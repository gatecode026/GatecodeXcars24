import { ensureDB } from "../config/db.js";
import { ReturnRequest } from "../models/ReturnRequest.js";
import { recordActivity } from "./activityController.js";

export const createReturnRequest = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable. Cannot create return request." });
    }
    const employeeId = req.user?._id || req.user?.id || null;
    const employeeName = req.user?.name || "";

    const payload = {
      ...req.body,
      employeeId,
      employeeName,
      customReason: req.body.returnReason === "Other" ? req.body.customReason : ""
    };
    const request = await ReturnRequest.create(payload);

    const actorName = req.user?.name || (req.user?.role === "tl" ? "Team Leader" : "Executive");
    const actorRole = req.user?.role || "employee";
    recordActivity({
      performedBy: req.user?._id || req.user?.id || null,
      performedByName: actorName,
      performedByRole: actorRole,
      actionType: "RETURN_CREATED",
      customerName: request.customerName,
      title: "Return Request Created",
      details: `${actorName} logged return request #${request._id.toString().slice(-6).toUpperCase()} for CX ${request.customerName} (${request.returnReason})`,
      employeeMessage: `Logged return request for ${request.customerName}`,
      adminMessage: `${actorName} registered return request for ${request.customerName}`,
      metadata: { returnId: request._id, reason: request.returnReason }
    }).catch(() => {});

    return res.status(201).json({ message: "Return request created", data: request });
  } catch (error) {
    return next(error);
  }
};

export const getReturnRequests = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      
    }
    const requests = await ReturnRequest.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: requests });
  } catch (error) {
    return next(error);
  }
};

export const updateReturn = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable. Cannot update return." });
    }
    const allowedFields = [
      "customerName", "mobileNumber", "pincode", "productType",
      "numberOfUnitsReturning", "returnReason", "customReason",
      "additionalDescription", "returnDate", "returnStatus"
    ];
    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }
    const request = await ReturnRequest.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!request) {
      return res.status(404).json({ message: "Return request not found" });
    }

    const actorName = req.user?.name || (req.user?.role === "tl" ? "Team Leader" : "Executive");
    const actorRole = req.user?.role || "employee";
    recordActivity({
      performedBy: req.user?._id || req.user?.id || null,
      performedByName: actorName,
      performedByRole: actorRole,
      actionType: "RETURN_UPDATED",
      customerName: request.customerName,
      title: "Return Request Updated",
      details: `${actorName} updated return request #${request._id.toString().slice(-6).toUpperCase()} for ${request.customerName} (${request.returnStatus})`,
      employeeMessage: `Return request updated by ${actorName}`,
      adminMessage: `${actorName} updated return #${request._id.toString().slice(-6).toUpperCase()}`,
      metadata: { returnId: request._id, status: request.returnStatus }
    }).catch(() => {});

    return res.status(200).json({ message: "Return updated successfully", data: request });
  } catch (error) {
    return next(error);
  }
};

export const deleteReturn = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable. Cannot delete return." });
    }
    const request = await ReturnRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Return request not found" });
    }

    const actorName = req.user?.name || (req.user?.role === "tl" ? "Team Leader" : "Executive");
    const actorRole = req.user?.role || "employee";
    recordActivity({
      performedBy: req.user?._id || req.user?.id || null,
      performedByName: actorName,
      performedByRole: actorRole,
      actionType: "RETURN_DELETED",
      customerName: request.customerName,
      title: "Return Request Deleted",
      details: `${actorName} deleted return request #${request._id.toString().slice(-6).toUpperCase()} (${request.customerName})`,
      employeeMessage: `Return request removed by ${actorName}`,
      adminMessage: `${actorName} deleted return request for ${request.customerName}`,
      metadata: { returnId: request._id }
    }).catch(() => {});

    return res.status(200).json({ message: "Return request deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateReturnStatus = async (req, res, next) => {
  try {
    const dbReady = await ensureDB();
    if (!dbReady) {
      return res.status(503).json({ message: "Database unavailable. Cannot update return status." });
    }
    const request = await ReturnRequest.findByIdAndUpdate(
      req.params.id,
      { returnStatus: req.body.returnStatus },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: "Return request not found" });
    }
    return res.status(200).json({ message: "Return status updated", data: request });
  } catch (error) {
    return next(error);
  }
};
