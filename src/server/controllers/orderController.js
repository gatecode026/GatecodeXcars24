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
    if (!isDatabaseReady()) {
      return res.status(200).json({ data: [] });
    }
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
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

export const bulkImportOrders = async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
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
          const dt = new Date(year, month, day);
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

    const getNum = (row, ...keys) => {
      const v = getVal(row, ...keys);
      if (!v) return 0;
      const parsed = parseFloat(v.replace(/[^0-9.-]/g, ""));
      return isNaN(parsed) ? 0 : parsed;
    };

    let insertedCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const customerName = getVal(r, "Customer Name", "customerName", "Name", "CX Name");
      const mobileNumber = getVal(r, "Mobile Number", "mobileNumber", "Mobile", "Phone");

      if (!customerName || !mobileNumber) {
        continue;
      }

      const fullAddress = getVal(r, "Full Address", "Address", "fullAddress") || "N/A";
      const pincode = getVal(r, "Pincode", "pincode", "Pin Code") || "110001";
      const productType = getVal(r, "Product Type", "productType", "Product") || "GPS";
      const customProductName = getVal(r, "Custom Product Name", "customProductName", "Car Model", "Vehicle") || "";
      const numberOfUnits = getNum(r, "Number Of Units", "Units", "numberOfUnits") || 1;
      const amount = getNum(r, "Amount", "Price", "amount") || 0;
      const totalAmount = getNum(r, "Total Amount", "totalAmount") || amount;
      const advanceAmount = getNum(r, "Advance Amount", "advanceAmount") || 0;
      const dateOfOrder = parseFlexibleDate(getVal(r, "Date Of Order", "Order Date", "dateOfOrder")) || new Date();
      const orderStatus = getVal(r, "Order Status", "Status", "orderStatus") || "Pending";
      const parcelStatus = getVal(r, "Parcel Status", "parcelStatus") || "Pending";
      const trackingId = getVal(r, "Tracking ID", "trackingId") || "";
      const courierCompany = getVal(r, "Courier Company", "courierCompany") || "";
      const bankName = getVal(r, "Bank Name", "bankName") || "";

      try {
        await Order.create({
          employeeId: req.user?._id || req.user?.id,
          employeeName: req.user?.name || "Executive",
          customerName,
          mobileNumber,
          fullAddress,
          pincode,
          productType: ["GPS", "Vending Machine", "Disposal", "Other"].includes(productType) ? productType : "Other",
          customProductName,
          numberOfUnits,
          amount,
          totalAmount,
          advanceAmount,
          dateOfOrder,
          orderStatus: ["Pending", "Approved", "Processing", "Delivered", "Cancelled"].includes(orderStatus) ? orderStatus : "Pending",
          parcelStatus: ["Pending", "Process", "Parcel", "Packed", "Dispatched", "Delivered"].includes(parcelStatus) ? parcelStatus : "Pending",
          trackingId,
          courierCompany,
          bankName: ["SBI", "BOB", "BOM", "MGB", "UPGB", "MPGB"].includes(bankName) ? bankName : ""
        });
        insertedCount++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    return res.status(200).json({
      message: `Successfully imported ${insertedCount} order(s).`,
      count: insertedCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : []
    });
  } catch (error) {
    return next(error);
  }
};

