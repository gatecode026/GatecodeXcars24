import mongoose from "mongoose";
import { ensureDB } from "../config/db.js";
import { ActivityLog } from "../models/ActivityLog.js";

/**
 * Helper to record activity log safely without blocking main transaction
 */
export const recordActivity = async ({
  performedBy,
  performedByName,
  performedByRole,
  actionType,
  targetCustomerId,
  appointmentId,
  customerName,
  carNumber,
  affectedEmployeeId,
  affectedEmployeeName,
  title,
  details,
  employeeMessage,
  adminMessage,
  metadata
}) => {
  try {
    if (!await ensureDB()) return null;
    const safePerformedBy = (performedBy && mongoose.Types.ObjectId.isValid(performedBy)) ? performedBy : null;
    const safeTargetCustomerId = (targetCustomerId && mongoose.Types.ObjectId.isValid(targetCustomerId)) ? targetCustomerId : null;
    const safeAffectedEmployeeId = (affectedEmployeeId && mongoose.Types.ObjectId.isValid(affectedEmployeeId)) ? affectedEmployeeId : null;

    return await ActivityLog.create({
      performedBy: safePerformedBy,
      performedByName: performedByName || "User",
      performedByRole: performedByRole || "employee",
      actionType,
      targetCustomerId: safeTargetCustomerId,
      appointmentId: appointmentId || "",
      customerName: customerName || "",
      carNumber: carNumber || "",
      affectedEmployeeId: safeAffectedEmployeeId,
      affectedEmployeeName: affectedEmployeeName || "",
      title,
      details,
      employeeMessage: employeeMessage || details,
      adminMessage: adminMessage || details,
      metadata: metadata || {}
    });
  } catch (err) {
    console.error("Failed to record activity log:", err.message);
    return null;
  }
};

/**
 * Controller to fetch live activities tailored to user role
 */
export const getActivities = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      
    }

    const userId = req.user?._id || req.user?.id || "";
    const userRole = req.user?.role || "employee";
    const limit = Math.min(Number(req.query.limit) || 40, 100);

    const query = {};

    // Role-based visibility: non-privileged users only see activities they performed or where they are affected
    const isPrivileged = ["superadmin", "admin", "manager", "tl"].includes(userRole);
    if (!isPrivileged) {
      query.$or = [
        { performedBy: userId },
        { affectedEmployeeId: userId }
      ];
    }
    // Admin / TL / Manager sees all activities

    if (req.query.type && req.query.type !== "all") {
      const t = String(req.query.type).toLowerCase();
      if (t === "employee") {
        query.actionType = { $regex: "^EMPLOYEE", $options: "i" };
      } else if (t === "order") {
        query.actionType = { $regex: "^ORDER", $options: "i" };
      } else if (t === "return") {
        query.actionType = { $regex: "^RETURN", $options: "i" };
      } else if (t === "lead") {
        query.actionType = { $regex: "^(LEAD|APPOINTMENT|STATUS)", $options: "i" };
      } else {
        query.actionType = req.query.type;
      }
    }

    const activities = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Map customized display text based on who is viewing
    const formatted = activities.map((act) => {
      const isActor = String(act.performedBy) === String(userId);
      const isTarget = String(act.affectedEmployeeId) === String(userId);
      const isTLOrAdminActor = act.performedByRole === "admin" || act.performedByRole === "tl";

      let displayMessage = act.details;
      let badgeType = "default";

      if (userRole === "employee") {
        if (isTarget && !isActor) {
          // TL edited employee's appointment
          displayMessage = act.employeeMessage || `${act.performedByName} (TL/Admin) modified your lead/appointment [${act.appointmentId || "N/A"}]`;
          badgeType = "tl-action";
        } else if (isActor) {
          displayMessage = `You ${act.details.replace(new RegExp(`^${act.performedByName}\\s+`, "i"), "")}`;
          badgeType = "self";
        }
      } else {
        // Admin / TL view
        displayMessage = act.adminMessage || act.details;
        badgeType = isTLOrAdminActor ? "tl-action" : "emp-action";
      }

      return {
        _id: act._id,
        actionType: act.actionType,
        performedBy: act.performedBy,
        performedByName: act.performedByName,
        performedByRole: act.performedByRole,
        appointmentId: act.appointmentId,
        customerName: act.customerName,
        carNumber: act.carNumber,
        affectedEmployeeName: act.affectedEmployeeName,
        title: act.title,
        message: displayMessage,
        details: act.details,
        badgeType,
        isActor,
        isTarget,
        createdAt: act.createdAt
      };
    });

    return res.status(200).json({
      data: formatted,
      total: formatted.length
    });
  } catch (error) {
    return next(error);
  }
};
