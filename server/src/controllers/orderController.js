import { isDatabaseReady } from "../config/db.js";
import { Order } from "../models/Order.js";

export const createOrder = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable. Cannot create order." });
    }
    const numberOfUnits = Number(req.body.numberOfUnits || 0);
    const amount = Number(req.body.amount || 0);
    const totalAmount = numberOfUnits * amount;
    const advanceAmount = Number(req.body.advanceAmount || 0);

    if (advanceAmount > totalAmount) {
      return res.status(400).json({ message: "Advance amount cannot exceed total amount" });
    }

    const employeeId = req.user?._id || req.user?.id || null;
    const employeeName = req.user?.name || "";

    const payload = {
      ...req.body,
      employeeId,
      employeeName,
      numberOfUnits,
      amount,
      totalAmount,
      advanceAmount,
      customProductName: req.body.productType === "Other" ? req.body.customProductName : ""
    };
    if (req.file) {
      payload.paymentScreenshot = `/uploads/${req.file.filename}`;
    }
    const order = await Order.create(payload);
    return res.status(201).json({ message: "Order created successfully", data: order });
  } catch (error) {
    return next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({ data: orders });
  } catch (error) {
    return next(error);
  }
};

export const updateOrder = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable. Cannot update order." });
    }
    const allowedFields = [
      "customerName", "mobileNumber", "alternateMobileNumber", "fullAddress", "pincode",
      "productType", "customProductName", "numberOfUnits", "amount",
      "totalAmount", "advanceAmount", "dateOfOrder", "orderStatus",
      "parcelStatus", "trackingId", "courierCompany", "bankName"
    ];
    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ message: "Order updated successfully", data: order });
  } catch (error) {
    return next(error);
  }
};

export const updateParcelStatus = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable. Cannot update parcel." });
    }
    const update = { parcelStatus: req.body.parcelStatus };
    if (req.body.trackingId !== undefined) update.trackingId = req.body.trackingId;
    if (req.body.courierCompany !== undefined) update.courierCompany = req.body.courierCompany;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ message: "Parcel status updated", data: order });
  } catch (error) {
    return next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable. Cannot delete order." });
    }
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ message: "Database unavailable. Cannot update order." });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: req.body.orderStatus },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ message: "Order status updated", data: order });
  } catch (error) {
    return next(error);
  }
};
