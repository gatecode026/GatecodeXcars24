import { isDatabaseReady } from "../config/db.js";
import { Customer } from "../models/Customer.js";
import { User } from "../models/User.js";
import { EmployeeRecord } from "../models/EmployeeRecord.js";
import { recordActivity } from "./activityController.js";
import { sendTLWhatsAppNotification } from "../services/whatsappNotificationService.js";

export const getCustomers = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const filter = {};
    if (req.user?.role === "employee") {
      filter.$or = [{ employeeId: req.user._id }, { assignedTo: req.user._id }];
    } else if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    if (req.query.status) {
      filter.$or = [
        { verificationStatus: req.query.status },
        { leadStatus: req.query.status },
        { followUp: req.query.status }
      ];
    }

    if (req.query.verified !== undefined) {
      filter.verified = req.query.verified === "true" || req.query.verified === true;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        const s = new Date(req.query.startDate);
        s.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = s;
      }
      if (req.query.endDate) {
        const e = new Date(req.query.endDate);
        e.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = e;
      }
    }

    if (req.query.search) {
      const q = String(req.query.search).trim();
      const regex = new RegExp(q, "i");
      const searchConditions = [
        { customerName: regex },
        { mobile: regex },
        { carNumber: regex },
        { appointmentId: regex },
        { leadBy: regex }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const customers = await Customer.find(filter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Ensure appointmentId & leadBy fallbacks for legacy records
    const normalized = customers.map((c) => ({
      ...c,
      appointmentId: c.appointmentId || `AP-${String(c._id).slice(-5).toUpperCase()}`,
      leadBy: c.leadBy || c.employeeName || "Executive",
      carNumber: c.carNumber || "-",
      verificationStatus: c.verificationStatus || (c.verified ? "Verified" : "Pending"),
      leadStatus: c.leadStatus || (c.followUp === "Converted" ? "Completed" : "Pending")
    }));

    return res.status(200).json({ data: normalized });
  } catch (error) {
    return next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const {
      customerName, mobile, email, remark, district, state, followUp,
      appointmentId, leadDate, appointmentDate, carNumber, leadBy,
      followUpBy, followUpDate, verified, verificationStatus, odometerKm,
      leadStatus, assignedTo
    } = req.body;

    const generatedAptId = appointmentId?.trim() || `AP-${Math.floor(10000 + Math.random() * 90000)}`;

    const customer = await Customer.create({
      employeeId: req.user._id || req.user.id,
      employeeName: req.user.name || "Employee",
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
      leadBy: leadBy?.trim() || req.user.name || "Employee",
      followUpBy: followUpBy || "",
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      verified: Boolean(verified),
      verificationStatus: verificationStatus || (verified ? "Verified" : "Pending"),
      odometerKm: Number(odometerKm) || 0,
      leadStatus: leadStatus || "Pending",
      assignedTo: assignedTo || null
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
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer / Lead not found" });
    }

    // Staff/TL/Admins can update lead status and details, recorded in audit logs
    const previousStatus = customer.verificationStatus;
    const previousDate = customer.appointmentDate ? new Date(customer.appointmentDate).getTime() : null;

    const updatableFields = [
      "customerName", "mobile", "email", "remark", "district", "state", "followUp",
      "appointmentId", "leadDate", "appointmentDate", "carNumber", "leadBy",
      "followUpBy", "followUpDate", "verified", "verificationStatus", "odometerKm",
      "leadStatus", "assignedTo"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "carNumber" && req.body[field]) {
          customer[field] = String(req.body[field]).trim().toUpperCase();
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
            } else if (req.body.verificationStatus === "Rejected") {
              customer.leadStatus = "Cancelled";
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
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer / Lead not found" });
    }

    if (req.user?.role === "employee" && String(customer.employeeId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
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

    return res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const getEmployeesList = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable." });
    }
    const users = await User.find({}, "_id name email role")
      .sort({ name: 1 })
      .lean();

    const distinctLeadBy = await Customer.distinct("leadBy");
    const distinctFollowUpBy = await Customer.distinct("followUpBy");

    const namesSet = new Set();
    users.forEach((u) => {
      if (u.name && u.name.trim()) namesSet.add(u.name.trim());
    });
    distinctLeadBy.forEach((n) => {
      if (n && typeof n === "string" && n.trim()) namesSet.add(n.trim());
    });
    distinctFollowUpBy.forEach((n) => {
      if (n && typeof n === "string" && n.trim()) namesSet.add(n.trim());
    });

    const sortedNames = Array.from(namesSet).sort((a, b) => a.localeCompare(b));

    return res.status(200).json({
      data: sortedNames,
      users: users.map((u) => ({ id: u._id, name: u.name, role: u.role }))
    });
  } catch (error) {
    return next(error);
  }
};

