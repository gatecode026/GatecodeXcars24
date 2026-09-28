import { isDatabaseReady } from "../config/db.js";
import { ReturnRequest } from "../models/ReturnRequest.js";

export const createReturnRequest = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
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
    return res.status(201).json({ message: "Return request created", data: request });
  } catch (error) {
    return next(error);
  }
};

export const getReturnRequests = async (req, res, next) => {
  try {
    const requests = await ReturnRequest.find().sort({ createdAt: -1 });
    return res.status(200).json({ data: requests });
  } catch (error) {
    return next(error);
  }
};

export const updateReturn = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
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
    return res.status(200).json({ message: "Return updated successfully", data: request });
  } catch (error) {
    return next(error);
  }
};

export const deleteReturn = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable. Cannot delete return." });
    }
    const request = await ReturnRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Return request not found" });
    }
    return res.status(200).json({ message: "Return request deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateReturnStatus = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
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
