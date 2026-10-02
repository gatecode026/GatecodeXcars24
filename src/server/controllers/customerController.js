import { ensureDB } from "../config/db.js";
import { Customer } from "../models/Customer.js";
import { User } from "../models/User.js";
import { EmployeeRecord } from "../models/EmployeeRecord.js";
import { recordActivity } from "./activityController.js";
import { sendTLWhatsAppNotification } from "../services/whatsappNotificationService.js";
import { can } from "../services/authorizationService.js";
import { invalidateDashboardCache } from "./dashboardController.js";
import { createMicroCache } from "../cache/serverCache.js";

const customerTableCache = createMicroCache("customers", 8000);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Compute a Mongoose date-range object based on a named period or custom dates.
 * Returns null when no period filter should be applied.
 */
const buildDateRange = (period, fromDate, toDate) => {
  const now = new Date();
  switch (period) {
    case "today": {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { $gte: s, $lte: e };
    }
    case "yesterday": {
      const s = new Date(now); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
      const e = new Date(s); e.setHours(23, 59, 59, 999);
      return { $gte: s, $lte: e };
    }
    case "week": {
      const s = new Date(now); s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { $gte: s, $lte: e };
    }
    case "month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { $gte: s, $lte: e };
    }
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); s.setHours(0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0); e.setHours(23, 59, 59, 999);
      return { $gte: s, $lte: e };
    }
    case "custom": {
      const range = {};
      if (fromDate) { const s = new Date(fromDate); s.setHours(0, 0, 0, 0); range.$gte = s; }
      if (toDate)   { const e = new Date(toDate);   e.setHours(23, 59, 59, 999); range.$lte = e; }
      return Object.keys(range).length > 0 ? range : null;
    }
    default:
      return null; // "all" → no date filter
  }
};

/**
 * Build a Mongoose filter from request query params + user role.
 * Role-based data scoping is always enforced here (backend authority).
 *
 * Supported query params:
 *   dateType            : "leadDate" | "appointmentDate" | "createdAt" (default)
 *   period              : "today" | "yesterday" | "week" | "month" | "custom" | "all"
 *   fromDate, toDate    : ISO date strings used when period="custom"
 *   verificationStatus  : exact string match
 *   leadBy              : partial case-insensitive match
 *   search              : searches customerName, mobile, carNumber, appointmentId, leadBy
 *   employeeId          : (admin only) filter by specific employee
 *   startDate, endDate  : legacy date range (used when period is absent)
 */
const buildCustomerFilter = (req) => {
  const conditions = [];

  // --- Role-based scoping (ALWAYS enforced on backend) ---
  const isPrivileged = ["superadmin", "admin", "manager", "tl"].includes(req.user?.role);
  if (!isPrivileged) {
    conditions.push({ $or: [{ employeeId: req.user._id }, { assignedTo: req.user._id }] });
  } else if (req.query.employeeId) {
    conditions.push({ employeeId: req.query.employeeId });
  }

  // --- Date field selection ---
  const VALID_DATE_TYPES = ["leadDate", "appointmentDate", "createdAt"];
  const dateType = VALID_DATE_TYPES.includes(req.query.dateType)
    ? req.query.dateType
    : "createdAt";

  // --- Period → date range ---
  const period = req.query.period || "";
  const dateRange = buildDateRange(period, req.query.fromDate, req.query.toDate);
  if (dateRange) {
    conditions.push({ [dateType]: dateRange });
  } else if (!period && (req.query.startDate || req.query.endDate)) {
    // Legacy support for old startDate/endDate params
    const legacyRange = {};
    if (req.query.startDate) {
      const s = new Date(req.query.startDate); s.setHours(0, 0, 0, 0);
      legacyRange.$gte = s;
    }
    if (req.query.endDate) {
      const e = new Date(req.query.endDate); e.setHours(23, 59, 59, 999);
      legacyRange.$lte = e;
    }
    if (Object.keys(legacyRange).length > 0) {
      conditions.push({ [dateType]: legacyRange });
    }
  }

  // --- Verification status filter ---
  if (req.query.verificationStatus) {
    conditions.push({ verificationStatus: req.query.verificationStatus });
  }

  // --- Lead By (executive) filter ---
  if (req.query.leadBy) {
    const name = String(req.query.leadBy).trim();
    if (name) {
      conditions.push({ leadBy: new RegExp(name, "i") });
    }
  }

  // --- Full-text search across key fields ---
  if (req.query.search) {
    const q = String(req.query.search).trim();
    if (q) {
      const regex = new RegExp(q, "i");
      conditions.push({
        $or: [
          { customerName: regex },
          { mobile: regex },
          { carNumber: regex },
          { appointmentId: regex },
          { leadBy: regex }
        ]
      });
    }
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
};

/** Normalise a raw Customer document for consistent API output */
const normalizeCustomer = (c) => {
  let aptId = c.appointmentId || `AP-${String(c._id).slice(-5).toUpperCase()}`;
  if (!aptId.startsWith("AP-")) {
    aptId = `AP-${aptId.replace(/^AP-?/, "").toUpperCase()}`;
  }
  let custName = c.customerName || "";
  if (custName) {
    custName = String(custName)
      .trim()
      .toLowerCase()
      .replace(/\b([a-z])/g, (ch) => ch.toUpperCase());
  }

  return {
    ...c,
    appointmentId: aptId,
    customerName: custName || c.customerName,
    leadBy: c.leadBy || c.employeeName || "Executive",
    carNumber: c.carNumber || "-",
    verificationStatus: c.verificationStatus || (c.verified ? "Verified" : "Pending"),
    leadStatus: c.leadStatus || (c.followUp === "Converted" ? "Completed" : "Pending")
  };
};

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

export const getCustomers = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(200).json({ data: [] });
    }

    const userId = req.user?._id || req.user?.id || "anon";
    const userRole = req.user?.role || "employee";
    const cacheKey = `${String(userId)}_${userRole}_${JSON.stringify(req.query || {})}`;

    const cached = customerTableCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ data: cached });
    }

    const filter = buildCustomerFilter(req);
    const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
    const skip = parseInt(req.query.skip) || 0;

    const customers = await Customer.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const normalized = customers.map(normalizeCustomer);
    customerTableCache.set(cacheKey, normalized);

    return res.status(200).json({ data: normalized });
  } catch (error) {
    return next(error);
  }
};

/**
 * Export leads as a UTF-8 CSV file.
 * Respects the same filters & role-based scoping as getCustomers.
 * CSV includes BOM so Excel opens it correctly.
 */
export const exportCustomersCSV = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      
    }

    const filter = buildCustomerFilter(req);
    const customers = await Customer.find(filter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const normalized = customers.map(normalizeCustomer);

    // --- Date formatting helpers (ISO-safe, no locale dependency) ---
    const pad = (n) => String(n).padStart(2, "0");
    const fmtDate = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
    };
    const fmtTime = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };
    const fmtDateTime = (d) => {
      const date = fmtDate(d);
      const time = fmtTime(d);
      return date && time ? `${date} ${time}` : date || time || "";
    };

    // --- CSV escape ---
    const esc = (val) => {
      const s = String(val ?? "").trim();
      if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const CSV_HEADERS = [
      "Appointment ID",
      "Lead Date",
      "Appointment Date",
      "Appointment Time",
      "Car Number",
      "Oddo Meter/KM",
      "CX Name",
      "Cx Mobile No.",
      "Lead By",
      "Follow Up Done By",
      "Date of Follow-up",
      "VERIFIED",
      "Cx Expectation / Remarks",
      "Timestamp (Created)"
    ];

    const rows = normalized.map((c) => [
      c.appointmentId,
      fmtDate(c.leadDate || c.createdAt),
      fmtDate(c.appointmentDate),
      fmtTime(c.appointmentDate),
      c.carNumber || "",
      c.odometerKm ? `${Number(c.odometerKm)} KM` : "0 KM",
      c.customerName || "",
      c.mobile || "",
      c.leadBy || c.employeeName || "",
      c.followUpBy || "",
      fmtDate(c.followUpDate),
      c.verificationStatus || (c.verified ? "Verified" : "Pending"),
      c.remark || "",
      fmtDateTime(c.createdAt)
    ].map(esc).join(","));

    const csvContent = [CSV_HEADERS.map(esc).join(","), ...rows].join("\r\n");
    const filename = `GatecodeXcars24_Leads_${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    // Prepend BOM (\uFEFF) so Excel recognises UTF-8 encoding
    return res.send("\uFEFF" + csvContent);
  } catch (error) {
    return next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const {
      customerName, mobile, email, remark, district, state, followUp,
      appointmentId, leadDate, appointmentDate, carNumber, leadBy,
      followUpBy, followUpDate, verified, verificationStatus, odometerKm,
      leadStatus, assignedTo
    } = req.body;

    const isPrivileged = ["superadmin", "admin", "manager", "tl"].includes(req.user?.role);
    let targetEmployeeId = req.user._id || req.user.id;
    let targetEmployeeName = req.user.name || "Employee";

    // Only privileged roles (admin, TL, manager) can assign leads to other employees on creation
    if (isPrivileged && req.body.employeeId && String(req.body.employeeId) !== String(targetEmployeeId)) {
      try {
        const targetUser = await User.findById(req.body.employeeId).select("_id name").lean();
        if (targetUser) {
          targetEmployeeId = targetUser._id;
          targetEmployeeName = targetUser.name;
        }
      } catch (_) {}
    }

    const generatedAptId = (appointmentId && String(appointmentId).trim())
      ? String(appointmentId).trim().toUpperCase()
      : `AP-${Math.floor(10000 + Math.random() * 90000)}`;

    const customer = await Customer.create({
      employeeId: targetEmployeeId,
      employeeName: targetEmployeeName,
      customerName,
      mobile,
      email: email || "",
      remark: remark || "",
      district: district || "",
      state: state || "",
      followUp: followUp || "Convert",
      appointmentId: generatedAptId,
      leadDate: leadDate ? new Date(leadDate) : new Date(),
      appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
      carNumber: carNumber ? String(carNumber).trim().toUpperCase() : "",
      leadBy: isPrivileged ? (leadBy?.trim() || targetEmployeeName) : (req.user.name || "Employee"),
      followUpBy: followUpBy || "",
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      verified: Boolean(verified),
      verificationStatus: verificationStatus || (verified ? "Verified" : "Pending"),
      odometerKm: Number(odometerKm) || 0,
      leadStatus: leadStatus || "Pending",
      assignedTo: isPrivileged ? (assignedTo || null) : null
    });

    // Record activity audit log
    try {
      await EmployeeRecord.create({
        employeeId: req.user._id || req.user.id,
        employeeName: req.user.name || "Employee",
        date: new Date(),
        type: "lead_created",
        description: `Created lead for ${customerName} (${customer.carNumber || "No Car"}) [${generatedAptId}]`,
        referenceId: customer._id,
        createdBy: req.user._id || req.user.id
      });

      const isTL = req.user.role === "admin" || req.user.role === "tl";
      const actorLabel = isTL ? `TL ${req.user.name}` : `Employee ${req.user.name}`;
      await recordActivity({
        performedBy: req.user._id || req.user.id,
        performedByName: req.user.name || "User",
        performedByRole: req.user.role || "employee",
        actionType: "LEAD_CREATED",
        targetCustomerId: customer._id,
        appointmentId: customer.appointmentId,
        customerName: customer.customerName,
        carNumber: customer.carNumber,
        affectedEmployeeId: customer.employeeId,
        affectedEmployeeName: customer.employeeName,
        title: "New Lead Created",
        details: `${actorLabel} added a new lead for ${customer.customerName} [${customer.appointmentId}]`,
        employeeMessage: `${actorLabel} created lead [${customer.appointmentId}] for ${customer.customerName}`,
        adminMessage: `${actorLabel} added lead [${customer.appointmentId}] for ${customer.customerName}`
      });

      // Dispatch automated WhatsApp notification alert to Team Leaders (TL)
      sendTLWhatsAppNotification(customer, "LEAD_CREATED").catch(() => {});
    } catch (_) {}

    invalidateEmployeesListCache();
    invalidateDashboardCache();

    return res.status(201).json({
      message: "Lead created successfully",
      data: customer
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer / Lead not found" });
    }

    // RBAC Authorization & IDOR protection
    if (!can(req.user, "update", "customers", customer)) {
      return res.status(403).json({
        message: "Forbidden. You are not authorized to update this customer lead.",
        code: "ERR_FORBIDDEN"
      });
    }

    // Staff/TL/Admins can update lead status and details, recorded in audit logs
    const previousStatus = customer.verificationStatus;
    const previousDate = customer.appointmentDate ? new Date(customer.appointmentDate).getTime() : null;

    const updatableFields = [
      "customerName", "mobile", "email", "remark", "district", "state", "followUp",
      "appointmentId", "leadDate", "appointmentDate", "carNumber", "leadBy",
      "followUpBy", "followUpDate", "verified", "verificationStatus", "odometerKm",
      "leadStatus", "assignedTo", "rescheduledDate", "rescheduleCount", "cancellationReason"
    ];

    const isPrivileged = ["superadmin", "admin", "manager", "tl"].includes(req.user?.role);
    const nonPrivilegedBlockedFields = ["assignedTo", "employeeId", "employeeName", "leadBy"];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (!isPrivileged && nonPrivilegedBlockedFields.includes(field)) {
          return; // Ignore unauthorized reassignment attempts by non-privileged roles
        }
        if (field === "carNumber" && req.body[field]) {
          customer[field] = String(req.body[field]).trim().toUpperCase();
        } else if (field === "appointmentId") {
          if (req.body.appointmentId && String(req.body.appointmentId).trim()) {
            customer.appointmentId = String(req.body.appointmentId).trim().toUpperCase();
          }
        } else if (field === "verified") {
          customer.verified = Boolean(req.body[field]);
        } else if (field === "verificationStatus") {
          customer.verificationStatus = req.body.verificationStatus;
          if (req.body.verificationStatus === "Verified") {
            customer.verified = true;
            customer.leadStatus = "Verified";
          } else {
            customer.verified = false;
            if (req.body.verificationStatus === "Follow-up") {
              customer.leadStatus = "Follow-up";
            } else if (req.body.verificationStatus === "Pending") {
              customer.leadStatus = "Pending";
            } else if (req.body.verificationStatus === "Rejected" || req.body.verificationStatus === "Cancelled") {
              customer.leadStatus = "Cancelled";
            } else if (req.body.verificationStatus === "Rescheduled") {
              customer.leadStatus = "Rescheduled";
              customer.rescheduleCount = (customer.rescheduleCount || 0) + 1;
            } else if (req.body.verificationStatus === "No-Show") {
              customer.leadStatus = "No-Show";
            }
          }
        } else {
          customer[field] = req.body[field];
        }
      }
    });

    await customer.save();

    // Record activity audit log
    try {
      await EmployeeRecord.create({
        employeeId: req.user._id || req.user.id,
        employeeName: req.user.name || "Employee",
        date: new Date(),
        type: "lead_updated",
        description: `Updated lead ${customer.customerName} [${customer.appointmentId}] (Status: ${customer.verificationStatus})`,
        referenceId: customer._id,
        createdBy: req.user._id || req.user.id
      });

      const isTL = req.user.role === "admin" || req.user.role === "tl";
      const isOwner = String(customer.employeeId) === String(req.user._id);
      const newDate = customer.appointmentDate ? new Date(customer.appointmentDate).getTime() : null;
      const dateChanged = previousDate !== newDate;
      const statusChanged = previousStatus !== customer.verificationStatus;

      let actionDesc = "updated lead details";
      if (dateChanged) actionDesc = "rescheduled appointment date";
      else if (statusChanged) actionDesc = `changed status to ${customer.verificationStatus}`;

      const adminMsg = isTL && !isOwner
        ? `TL ${req.user.name} ${actionDesc} on lead [${customer.appointmentId}] (${customer.customerName}) belonging to ${customer.leadBy || customer.employeeName}`
        : `${req.user.name} ${actionDesc} on [${customer.appointmentId}] (${customer.customerName})`;

      const empMsg = isTL && !isOwner
        ? `TL ${req.user.name} edited details in your appointment [${customer.appointmentId}] (${customer.customerName})`
        : `You ${actionDesc} on [${customer.appointmentId}] (${customer.customerName})`;

      await recordActivity({
        performedBy: req.user._id || req.user.id,
        performedByName: req.user.name || "User",
        performedByRole: req.user.role || "employee",
        actionType: dateChanged ? "APPOINTMENT_SCHEDULED" : (statusChanged ? "STATUS_CHANGED" : "LEAD_UPDATED"),
        targetCustomerId: customer._id,
        appointmentId: customer.appointmentId,
        customerName: customer.customerName,
        carNumber: customer.carNumber,
        affectedEmployeeId: customer.employeeId,
        affectedEmployeeName: customer.employeeName,
        title: dateChanged ? "Appointment Updated" : (statusChanged ? `Status -> ${customer.verificationStatus}` : "Lead Modified"),
        details: adminMsg,
        employeeMessage: empMsg,
        adminMessage: adminMsg,
        metadata: {
          status: customer.verificationStatus,
          appointmentDate: customer.appointmentDate
        }
      });

      // Dispatch automated WhatsApp notification alert to Team Leaders (TL)
      sendTLWhatsAppNotification(customer, dateChanged ? "APPOINTMENT_SCHEDULED" : "LEAD_UPDATED").catch(() => {});
    } catch (_) {}

    invalidateEmployeesListCache();
    invalidateDashboardCache();

    return res.status(200).json({
      message: "Lead updated successfully",
      data: customer
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer / Lead not found" });
    }

    if (!can(req.user, "delete", "customers", customer)) {
      return res.status(403).json({
        message: "Forbidden. You are not authorized to delete customer leads.",
        code: "ERR_FORBIDDEN"
      });
    }

    const name = customer.customerName;
    const aptId = customer.appointmentId;
    const empId = customer.employeeId;
    const empName = customer.employeeName;
    await Customer.findByIdAndDelete(req.params.id);

    // Record activity audit log
    try {
      await EmployeeRecord.create({
        employeeId: req.user._id || req.user.id,
        employeeName: req.user.name || "Employee",
        date: new Date(),
        type: "lead_deleted",
        description: `Deleted lead ${name} [${aptId}]`,
        createdBy: req.user._id || req.user.id
      });

      const isTL = req.user.role === "admin" || req.user.role === "tl";
      await recordActivity({
        performedBy: req.user._id || req.user.id,
        performedByName: req.user.name || "User",
        performedByRole: req.user.role || "employee",
        actionType: "LEAD_DELETED",
        targetCustomerId: customer._id,
        appointmentId: aptId,
        customerName: name,
        carNumber: customer.carNumber,
        affectedEmployeeId: empId,
        affectedEmployeeName: empName,
        title: "Lead Deleted",
        details: `${isTL ? "TL " : ""}${req.user.name} deleted lead [${aptId}] (${name})`,
        employeeMessage: isTL && String(empId) !== String(req.user._id)
          ? `TL ${req.user.name} removed your lead [${aptId}] (${name})`
          : `You deleted lead [${aptId}] (${name})`,
        adminMessage: `${isTL ? "TL " : ""}${req.user.name} deleted lead [${aptId}] (${name})`
      });
    } catch (_) {}

    invalidateEmployeesListCache();
    invalidateDashboardCache();

    return res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const bulkImportCustomers = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No data rows provided for import." });
    }

    const parseFlexibleDate = (str) => {
      if (!str) return null;
      const s = String(str).trim();
      if (!s) return null;
      if (s.includes("/")) {
        const parts = s.split(/[\/\s:]+/);
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const hour = parts[3] ? parseInt(parts[3], 10) : 0;
          const minute = parts[4] ? parseInt(parts[4], 10) : 0;
          const dt = new Date(year, month, day, hour, minute);
          if (!isNaN(dt.getTime())) return dt;
        }
      }
      const dt = new Date(s);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const getVal = (row, ...keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
        // Case-insensitive fallback
        const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const actualKey of Object.keys(row)) {
          if (actualKey.toLowerCase().replace(/[^a-z0-9]/g, "") === lowerK) {
            if (row[actualKey] !== undefined && row[actualKey] !== null && String(row[actualKey]).trim() !== "") {
              return String(row[actualKey]).trim();
            }
          }
        }
      }
      return "";
    };

    const currentUserId = req.user?._id || req.user?.id;
    const currentUserName = req.user?.name || "Employee";

    let insertedCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const customerName = getVal(r, "CX Name", "Customer Name", "cx_name", "customerName", "Name");
      const mobile = getVal(r, "Cx Mobile No.", "Mobile", "mobile", "mobileNumber", "Phone", "Phone Number");

      if (!customerName && !mobile) {
        continue; // Skip blank lines
      }

      try {
        const rawOdo = getVal(r, "Oddo Meter/KM", "odometerKm", "Odometer", "KM", "Oddo Meter");
        const cleanOdo = Number(rawOdo.replace(/[^0-9.]/g, "")) || 0;

        const rawLeadDate = getVal(r, "Lead Date", "leadDate", "Date");
        const leadDate = parseFlexibleDate(rawLeadDate) || new Date();

        const rawAptDate = getVal(r, "Appointment Date", "appointmentDate");
        const rawAptTime = getVal(r, "Appointment Time");
        let appointmentDate = parseFlexibleDate(rawAptDate);
        if (appointmentDate && rawAptTime && rawAptTime.includes(":")) {
          const [h, m] = rawAptTime.split(":").map((v) => parseInt(v, 10));
          if (!isNaN(h) && !isNaN(m)) {
            appointmentDate.setHours(h, m, 0, 0);
          }
        }

        const rawFollowUpDate = getVal(r, "Date of Follow-up", "followUpDate", "Follow Up Date");
        const followUpDate = parseFlexibleDate(rawFollowUpDate);

        const leadBy = getVal(r, "Lead By", "leadBy") || currentUserName;
        const followUpBy = getVal(r, "Follow Up Done By", "followUpBy", "Follow Up By") || "";
        const carNumber = getVal(r, "Car Number", "carNumber", "Car No").toUpperCase();
        const appointmentId = getVal(r, "Appointment ID", "appointmentId");
        const remark = getVal(r, "Cx Expectation / Remarks", "remark", "Remarks", "Remark", "Notes");
        const email = getVal(r, "Email", "email");
        const rawVerification = getVal(r, "VERIFIED", "verificationStatus", "Verification Status", "Status");

        let verificationStatus = "Pending";
        let verified = false;
        if (rawVerification) {
          const vLower = rawVerification.toLowerCase();
          if (vLower === "verified" || vLower === "yes" || vLower === "true") {
            verificationStatus = "Verified";
            verified = true;
          } else if (vLower.includes("follow")) {
            verificationStatus = "Follow-up";
            verified = false;
          } else if (vLower.includes("reject")) {
            verificationStatus = "Rejected";
            verified = false;
          }
        }

        await Customer.create({
          employeeId: currentUserId,
          employeeName: currentUserName,
          customerName: customerName || "Customer",
          mobile: mobile || "-",
          email,
          remark,
          appointmentId: appointmentId || undefined,
          leadDate,
          appointmentDate,
          carNumber,
          leadBy,
          followUpBy,
          followUpDate,
          verified,
          verificationStatus,
          odometerKm: cleanOdo,
          leadStatus: verificationStatus === "Verified" ? "Verified" : verificationStatus === "Follow-up" ? "Follow-up" : "Pending"
        });

        insertedCount++;
      } catch (rowErr) {
        errors.push({ row: i + 1, error: rowErr.message });
      }
    }

    invalidateEmployeesListCache();
    invalidateDashboardCache();

    return res.status(200).json({
      message: `Successfully imported ${insertedCount} lead(s).`,
      count: insertedCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : []
    });
  } catch (error) {
    return next(error);
  }
};

let cachedEmployeesList = null;
let cachedEmployeesListTime = 0;
const EMPLOYEES_CACHE_TTL_MS = 30 * 1000;

export const invalidateEmployeesListCache = () => {
  cachedEmployeesList = null;
};

export const getEmployeesList = async (req, res, next) => {
  try {
    if (cachedEmployeesList && Date.now() - cachedEmployeesListTime < EMPLOYEES_CACHE_TTL_MS) {
      return res.status(200).json(cachedEmployeesList);
    }

    const dbReady = await ensureDB();
    if (!dbReady) {
      
    }
    const users = await User.find(
      { isDeleted: { $ne: true }, role: { $in: ["employee", "tl"] } },
      "_id name email role"
    )
      .sort({ name: 1 })
      .lean();

    const namesSet = new Set();
    users.forEach((u) => {
      if (u.name && u.name.trim()) namesSet.add(u.name.trim());
    });

    const sortedNames = Array.from(namesSet).sort((a, b) => a.localeCompare(b));

    const result = {
      data: sortedNames,
      users: users.map((u) => ({ id: u._id, name: u.name, role: u.role }))
    };

    cachedEmployeesList = result;
    cachedEmployeesListTime = Date.now();

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};


