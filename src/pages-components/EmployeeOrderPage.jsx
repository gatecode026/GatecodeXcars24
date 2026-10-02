"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { getPdfDoc } from "../utils/pdfExport";
import { api, toAbsoluteAssetUrl, emitDataSync, onDataSync } from "../api/client";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import CsvImportModal from "../components/CsvImportModal";
import { exportTableToCsv } from "../utils/csvHelper";
import { isValidMobile, isValidPincode } from "../utils/validators";

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const initialState = {
  customerName: "",
  mobileNumber: "",
  alternateMobileNumber: "",
  fullAddress: "",
  pincode: "",
  carModel: "",
  carNumber: "",
  productType: "Sedan",
  fuelType: "Petrol",
  manufacturingYear: "",
  odometerKm: "",
  customProductName: "",
  numberOfUnits: "1",
  amount: "",
  advanceAmount: "",
  description: "",
  parcelStatus: "Pending",
  trackingId: "",
  courierCompany: "",
  bankName: "",
  orderStatus: "Pending",
};

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const maxFileSize = 2 * 1024 * 1024;

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status) => {
  const styles = {
    Approved: { bg: "#dcfce7", text: "#16a34a", border: "#bbf7d0" },
    Delivered: { bg: "#dcfce7", text: "#16a34a", border: "#bbf7d0" },
    Processing: { bg: "#e0f2fe", text: "#0284c7", border: "#bae6fd" },
    Pending: { bg: "#fef3c7", text: "#d97706", border: "#fde68a" },
    Cancelled: { bg: "#fee2e2", text: "#dc2626", border: "#fecaca" },
  };
  const current = styles[status] || { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: current.bg,
        color: current.text,
        border: `1px solid ${current.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status || "Pending"}
    </span>
  );
};

const downloadOrdersPDF = async (orders) => {
  const { doc, autoTable } = await getPdfDoc({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("GatecodeXcars24 — Orders Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Orders: ${orders.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Customer Name", "Mobile Number", "Product", "Units", "Total Amount", "Status", "Date"]],
    body: orders.map((o) => [
      o.customerName || "-",
      o.mobileNumber || "-",
      o.productType === "Other" ? o.customProductName : o.productType,
      o.numberOfUnits || 0,
      `Rs. ${Number(o.totalAmount || 0).toLocaleString("en-IN")}`,
      o.orderStatus || "-",
      o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "-",
    ]),
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2 },
  });

  doc.save(`Orders_Report_${new Date().toISOString().split("T")[0]}.pdf`);
};

const EmployeeOrderPage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadState, setUploadState] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("today");
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const fetchRecent = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setInitialLoading(true);
      const res = await api.get("/employee/orders", { forceRefresh: isBackground });
      setRecentOrders(res.data?.data || []);
    } catch {
      // silent
    } finally {
      if (!isBackground) setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent(false);
    const interval = setInterval(() => {
      fetchRecent(true);
    }, 8000);
    const onFocus = () => fetchRecent(true);
    window.addEventListener("focus", onFocus);

    const unsub = onDataSync((evt) => {
      if (evt?.type === "order") {
        fetchRecent(true);
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      unsub();
    };
  }, [fetchRecent]);

  useEffect(() => {
    if (isFormOpen || viewOrder) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isFormOpen, viewOrder]);

  const filteredOrders = useMemo(() => {
    let list = recentOrders;
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      list = list.filter((o) => o.customerName?.toLowerCase().includes(q) || o.mobileNumber?.includes(q) || o.productType?.toLowerCase().includes(q));
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateFilter === "today") {
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfToday && d <= endOfToday;
      });
    } else if (dateFilter === "yesterday") {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(endOfToday);
      endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfYesterday && d <= endOfYesterday;
      });
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(startOfToday);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfWeek && d <= endOfToday;
      });
    } else if (dateFilter === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfMonth && d <= endOfToday;
      });
    } else if (dateFilter === "custom") {
      if (orderDateFrom) {
        const from = new Date(orderDateFrom);
        from.setHours(0, 0, 0, 0);
        list = list.filter((o) => new Date(o.createdAt) >= from);
      }
      if (orderDateTo) {
        const to = new Date(orderDateTo);
        to.setHours(23, 59, 59, 999);
        list = list.filter((o) => new Date(o.createdAt) <= to);
      }
    }
    return list;
  }, [recentOrders, orderSearch, dateFilter, orderDateFrom, orderDateTo]);

  const totalAmount = useMemo(() => {
    const units = Number(form.numberOfUnits || 0);
    const amount = Number(form.amount || 0);
    return units * amount;
  }, [form.numberOfUnits, form.amount]);

  const incentive = useMemo(() => {
    const units = Number(form.numberOfUnits || 0);
    const amount = Number(form.amount || 0);
    if (amount <= 3200) return amount * 0.0225 * units;
    return (amount - 3200) * units;
  }, [form.numberOfUnits, form.amount]);

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);
  const sanitizeLetters = (value) => value.replace(/[^a-zA-Z\s]/g, "");
  const sanitizePositiveNumber = (value) => {
    if (value === "") return "";
    return value.replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, "");
  };

  const preventNonNumericKey = (e) => {
    if (e.ctrlKey || e.metaKey) return;
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const validate = (candidate = form) => {
    const next = {};
    if (!candidate.customerName.trim()) next.customerName = "Customer name is required";
    if (!isValidMobile(candidate.mobileNumber)) next.mobileNumber = "Enter valid 10-digit mobile number";
    if (candidate.alternateMobileNumber && !isValidMobile(candidate.alternateMobileNumber)) next.alternateMobileNumber = "Enter valid 10-digit number";
    if (!candidate.fullAddress.trim()) next.fullAddress = "Address is required";
    if (!isValidPincode(candidate.pincode)) next.pincode = "Enter valid 6-digit pincode";
    if (candidate.productType === "Other" && !candidate.customProductName.trim()) {
      next.customProductName = "Custom product name is required";
    }
    if (!candidate.numberOfUnits || Number(candidate.numberOfUnits) <= 0) next.numberOfUnits = "Units must be > 0";
    if (candidate.amount === "" || Number(candidate.amount) < 0) next.amount = "Amount must be positive";
    if (candidate.advanceAmount === "" || Number(candidate.advanceAmount) < 0) {
      next.advanceAmount = "Advance must be positive";
    } else if (Number(candidate.advanceAmount) > totalAmount) {
      next.advanceAmount = "Advance amount cannot exceed total amount";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleScreenshot = (file) => {
    setUploadState("");
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, paymentScreenshot: "Only JPG, JPEG and PNG allowed" }));
      return;
    }
    if (file.size > maxFileSize) {
      setErrors((prev) => ({ ...prev, paymentScreenshot: "File size must be <= 2MB" }));
      return;
    }
    setErrors((prev) => ({ ...prev, paymentScreenshot: "" }));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPaymentFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadState("Upload ready");
  };

  const removeScreenshot = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPaymentFile(null);
    setPreviewUrl("");
    setUploadState("");
  };

  const clearToast = useCallback(() => setToast(null), []);

  const handleEditOrder = (o) => {
    setForm({
      customerName: o.customerName || "",
      mobileNumber: o.mobileNumber || "",
      alternateMobileNumber: o.alternateMobileNumber || "",
      fullAddress: o.fullAddress || "",
      pincode: o.pincode || "",
      carModel: o.carModel || "",
      carNumber: o.carNumber || "",
      productType: o.productType || "Sedan",
      fuelType: o.fuelType || "Petrol",
      manufacturingYear: o.manufacturingYear || "",
      odometerKm: o.odometerKm || "",
      customProductName: o.customProductName || "",
      numberOfUnits: String(o.numberOfUnits || 1),
      amount: o.amount || "",
      advanceAmount: o.advanceAmount || "",
      description: o.description || "",
      parcelStatus: o.parcelStatus || "Pending",
      trackingId: o.trackingId || "",
      courierCompany: o.courierCompany || "",
      bankName: o.bankName || "",
      orderStatus: o.orderStatus || "Pending",
    });
    setEditingId(o._id);
    setIsFormOpen(true);
  };

  const handleDeleteOrder = (order) => {
    setDeleteConfirmOrder(order);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmOrder) return;
    const order = deleteConfirmOrder;
    setDeleting(true);
    // Immediately remove from state without reload
    setRecentOrders((prev) => prev.filter((o) => o._id !== order._id));
    try {
      await api.delete(`/employee/orders/${order._id}`);
      setToast("Order deleted successfully!");
      emitDataSync({ type: "order", action: "delete", id: order._id });
      setDeleteConfirmOrder(null);
      fetchRecent(true);
    } catch {
      fetchRecent(true);
      setToast("Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!recentOrders || recentOrders.length === 0) {
      setToast("No orders available to export");
      return;
    }
    const headers = [
      "Customer Name",
      "Mobile Number",
      "Alt Mobile",
      "Full Address",
      "Pincode",
      "Car Model",
      "Car Number",
      "Body Type",
      "Fuel Type",
      "Mfg Year",
      "Odometer",
      "Units",
      "Deal Price",
      "Advance Amount",
      "Order Status",
      "Date",
    ];
    const rows = recentOrders.map((o) => [
      o.customerName || "-",
      o.mobileNumber || "-",
      o.alternateMobileNumber || "-",
      o.fullAddress || "-",
      o.pincode || "-",
      o.carModel || "-",
      o.carNumber || "-",
      o.productType || "-",
      o.fuelType || "-",
      o.manufacturingYear || "-",
      o.odometerKm || "-",
      o.numberOfUnits || 1,
      o.amount || 0,
      o.advanceAmount || 0,
      o.orderStatus || "Pending",
      o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "-",
    ]);
    exportTableToCsv(`Orders_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    setToast("Orders exported to CSV");
  };

  const handleImportOrders = async (rows) => {
    const res = await api.post("/orders/bulk-import", { rows });
    setToast(res.data?.message || `Imported ${rows.length} orders successfully!`);
    emitDataSync({ type: "order", action: "bulk" });
    fetchRecent(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("customerName", form.customerName);
      payload.append("mobileNumber", form.mobileNumber);
      if (form.alternateMobileNumber) payload.append("alternateMobileNumber", form.alternateMobileNumber);
      payload.append("fullAddress", form.fullAddress);
      payload.append("pincode", form.pincode);
      payload.append("carModel", form.carModel);
      payload.append("carNumber", form.carNumber);
      payload.append("fuelType", form.fuelType);
      payload.append("manufacturingYear", form.manufacturingYear);
      payload.append("odometerKm", form.odometerKm);
      payload.append("productType", form.productType);
      payload.append("customProductName", form.customProductName);
      payload.append("numberOfUnits", String(Number(form.numberOfUnits || 1)));
      payload.append("amount", String(Number(form.amount)));
      payload.append("totalAmount", String(totalAmount));
      payload.append("advanceAmount", String(Number(form.advanceAmount)));
      payload.append("description", form.description);
      payload.append("parcelStatus", form.parcelStatus);
      payload.append("trackingId", form.trackingId);
      payload.append("courierCompany", form.courierCompany);
      payload.append("bankName", form.bankName);
      if (paymentFile) payload.append("paymentScreenshot", paymentFile);

      if (editingId) {
        const res = await api.put(`/employee/orders/${editingId}`, {
          customerName: form.customerName,
          mobileNumber: form.mobileNumber,
          alternateMobileNumber: form.alternateMobileNumber,
          fullAddress: form.fullAddress,
          pincode: form.pincode,
          carModel: form.carModel,
          carNumber: form.carNumber,
          fuelType: form.fuelType,
          manufacturingYear: form.manufacturingYear,
          odometerKm: form.odometerKm,
          productType: form.productType,
          customProductName: form.customProductName,
          numberOfUnits: Number(form.numberOfUnits || 1),
          amount: Number(form.amount),
          totalAmount,
          advanceAmount: Number(form.advanceAmount),
          description: form.description,
          parcelStatus: form.parcelStatus,
          trackingId: form.trackingId,
          courierCompany: form.courierCompany,
          bankName: form.bankName,
          orderStatus: form.orderStatus,
        });
        const updated = res.data?.data;
        if (updated) {
          setRecentOrders((prev) => prev.map((o) => (o._id === editingId ? { ...o, ...updated } : o)));
        }
        setToast("Order updated successfully!");
        emitDataSync({ type: "order", action: "update", record: updated });
      } else {
        const res = await api.post("/orders", payload);
        const created = res.data?.data;
        if (created) {
          setRecentOrders((prev) => [created, ...prev.filter((o) => o._id !== created._id)]);
        }
        setToast("Order submitted successfully!");
        emitDataSync({ type: "order", action: "create", record: created });
      }
      setForm(initialState);
      setEditingId(null);
      setErrors({});
      setIsFormOpen(false);
      setPaymentFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setUploadState("");
      fetchRecent(true);
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to submit order";
      setToast(errMsg);
      const fieldErrors = error.response?.data?.errors || {};
      if (Object.keys(fieldErrors).length) {
        setErrors(fieldErrors);
      } else {
        const lower = errMsg.toLowerCase();
        if (lower.includes("mobile")) setErrors((prev) => ({ ...prev, mobileNumber: errMsg }));
        else if (lower.includes("customer")) setErrors((prev) => ({ ...prev, customerName: errMsg }));
        else if (lower.includes("pincode")) setErrors((prev) => ({ ...prev, pincode: errMsg }));
        else if (lower.includes("address")) setErrors((prev) => ({ ...prev, fullAddress: errMsg }));
        else if (lower.includes("bank")) setErrors((prev) => ({ ...prev, bankName: errMsg }));
        else if (lower.includes("advance")) setErrors((prev) => ({ ...prev, advanceAmount: errMsg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1>Orders</h1>
            <span className="badge-live-pulse" title="Real-time syncing enabled">
              <span className="badge-live-dot" /> LIVE
            </span>
          </div>
          <p>View and manage customer purchase orders and dispatches</p>
        </div>

        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsCsvModalOpen(true)}
            title="Import Orders from CSV"
          >
            <UploadIcon />
            Import CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            title="Export Orders to CSV"
          >
            <DownloadIcon />
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setForm(initialState);
              setEditingId(null);
              setErrors({});
              setPaymentFile(null);
              setPreviewUrl("");
              setUploadState("");
              setIsFormOpen(true);
            }}
          >
            <PlusIcon />
            Create Order
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        {/* Table Header Bar with Filters */}
        <div className="table-header-bar" style={{ flexWrap: "wrap", gap: "10px" }}>
          <div className="filter-period-pills" style={{ display: "flex", gap: "4px" }}>
            {[
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "custom", label: "Custom Range" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`filter-pill ${dateFilter === key ? "active" : ""}`}
                onClick={() => setDateFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {dateFilter === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="date"
                className="form-control"
                style={{ width: "auto", height: "32px", padding: "2px 8px", fontSize: "12px" }}
                value={orderDateFrom}
                max={today}
                onChange={(e) => {
                  const val = e.target.value;
                  setOrderDateFrom(val);
                  if (orderDateTo && val > orderDateTo) setOrderDateTo("");
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>to</span>
              <input
                type="date"
                className="form-control"
                style={{ width: "auto", height: "32px", padding: "2px 8px", fontSize: "12px" }}
                value={orderDateTo}
                min={orderDateFrom}
                max={today}
                onChange={(e) => setOrderDateTo(e.target.value)}
              />
            </div>
          )}

          <div className="table-search-input" style={{ marginLeft: "auto", minWidth: "220px" }}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by customer, mobile, product..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchRecent(false)}
            title="Refresh records"
          >
            <RefreshIcon />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#10b981", color: "#ffffff", border: "1px solid #10b981", display: "inline-flex", alignItems: "center", gap: "6px" }}
            onClick={() => downloadOrdersPDF(filteredOrders)}
            title="Download PDF Report"
          >
            <DownloadIcon />
            Download PDF
          </button>
        </div>

        {/* Table Container */}
        <div className="table-container">
          <table className="leads-table slidable-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>MOBILE</th>
                <th>VEHICLE / MODEL</th>
                <th>REG. NO</th>
                <th>DEAL PRICE</th>
                <th>ADVANCE</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {initialLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    <td><div className="skeleton-box" style={{ width: "120px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "90px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "100px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "80px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "80px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "70px", height: "14px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "70px", height: "20px", borderRadius: "10px" }} /></td>
                    <td><div className="skeleton-box" style={{ width: "90px", height: "14px" }} /></td>
                    <td style={{ textAlign: "center" }}><div className="skeleton-box" style={{ width: "60px", height: "24px", margin: "0 auto" }} /></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: "36px 16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>No matching orders found</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Create a new customer order or adjust your date filter.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{o.customerName}</td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: "12.5px" }}>{o.mobileNumber}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-heading)", fontSize: "12.5px" }}>
                        {o.carModel || o.productType || "-"}
                      </div>
                      {o.fuelType && (
                        <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>{o.fuelType} • {o.productType}</small>
                      )}
                    </td>
                    <td>
                      {o.carNumber ? (
                        <span className="badge badge-gray" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
                          {o.carNumber}
                        </span>
                      ) : "-"}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                      ₹{Number(o.totalAmount || o.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>
                      ₹{Number(o.advanceAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td>{statusBadge(o.orderStatus)}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="View Details"
                          onClick={() => setViewOrder(o)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "5px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#0284c7",
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit"
                          onClick={() => handleEditOrder(o)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "5px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#f59e0b",
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Delete"
                          onClick={() => handleDeleteOrder(o)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "5px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#ef4444",
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Modal: Create / Edit Order */}
      {isFormOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setIsFormOpen(false);
            setForm(initialState);
            setEditingId(null);
            setErrors({});
          }}
        >
          <div
            className="modal-card modal-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "860px", width: "95%", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>
                  {editingId ? "EDIT ORDER" : "NEW ORDER"}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
                  {editingId ? "Edit Customer Order" : "Create New Customer Order"}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setIsFormOpen(false);
                  setForm(initialState);
                  setEditingId(null);
                  setErrors({});
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
              <div className="modal-body modal-body-compact" style={{ overflowY: "auto", maxHeight: "calc(90vh - 130px)", flex: 1, padding: "16px 20px" }}>
                {/* 1. Customer Information */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>1. Customer Information</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr", gap: "10px" }}>
                    <div className="form-group">
                      <label className="form-label">Customer Name *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.customerName ? "is-invalid" : ""}`}
                        placeholder="e.g. Rahul Sharma"
                        required
                        value={form.customerName}
                        onChange={(e) => onChange("customerName", sanitizeLetters(e.target.value))}
                      />
                      {errors.customerName && <small className="error-text">{errors.customerName}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.mobileNumber ? "is-invalid" : ""}`}
                        placeholder="10-digit number"
                        inputMode="numeric"
                        maxLength={10}
                        required
                        value={form.mobileNumber}
                        onKeyDown={preventNonNumericKey}
                        onChange={(e) => onChange("mobileNumber", sanitizeDigits(e.target.value, 10))}
                      />
                      {errors.mobileNumber && <small className="error-text">{errors.mobileNumber}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Alternate Mobile</label>
                      <input
                        type="text"
                        className={`form-control ${errors.alternateMobileNumber ? "is-invalid" : ""}`}
                        placeholder="Optional"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.alternateMobileNumber}
                        onKeyDown={preventNonNumericKey}
                        onChange={(e) => onChange("alternateMobileNumber", sanitizeDigits(e.target.value, 10))}
                      />
                      {errors.alternateMobileNumber && <small className="error-text">{errors.alternateMobileNumber}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.pincode ? "is-invalid" : ""}`}
                        placeholder="6 digits"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={form.pincode}
                        onKeyDown={preventNonNumericKey}
                        onChange={(e) => onChange("pincode", sanitizeDigits(e.target.value, 6))}
                      />
                      {errors.pincode && <small className="error-text">{errors.pincode}</small>}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "4px" }}>
                    <label className="form-label">Full Delivery Address *</label>
                    <textarea
                      className={`form-control ${errors.fullAddress ? "is-invalid" : ""}`}
                      placeholder="Enter complete building, street, landmark, city and state..."
                      required
                      rows={2}
                      value={form.fullAddress}
                      onChange={(e) => onChange("fullAddress", e.target.value)}
                    />
                    {errors.fullAddress && <small className="error-text">{errors.fullAddress}</small>}
                  </div>
                </div>

                {/* 2. Vehicle / Car Details & Financials */}
                <div className="compact-section-box">
                  <div className="compact-section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 17h14v-5l-2-6H7L5 12v5z" />
                      <circle cx="7.5" cy="17.5" r="2.5" />
                      <circle cx="16.5" cy="17.5" r="2.5" />
                    </svg>
                    <span>2. Vehicle / Car Details &amp; Financials</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px" }}>
                    <div className="form-group">
                      <label className="form-label">Car Model &amp; Variant *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.carModel ? "is-invalid" : ""}`}
                        placeholder="e.g. Maruti Swift Dzire VXi"
                        required
                        value={form.carModel}
                        onChange={(e) => onChange("carModel", e.target.value)}
                      />
                      {errors.carModel && <small className="error-text">{errors.carModel}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Car Registration No. *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.carNumber ? "is-invalid" : ""}`}
                        placeholder="e.g. DL-01-AB-1234"
                        style={{ textTransform: "uppercase" }}
                        required
                        value={form.carNumber}
                        onChange={(e) => onChange("carNumber", e.target.value.toUpperCase())}
                      />
                      {errors.carNumber && <small className="error-text">{errors.carNumber}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Body Type / Category *</label>
                      <select
                        className="form-control"
                        value={form.productType}
                        onChange={(e) => onChange("productType", e.target.value)}
                      >
                        <option value="Sedan">Sedan</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="SUV">SUV</option>
                        <option value="Compact SUV">Compact SUV</option>
                        <option value="MUV">MUV</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "8px" }}>
                    <div className="form-group">
                      <label className="form-label">Fuel Type</label>
                      <select
                        className="form-control"
                        value={form.fuelType}
                        onChange={(e) => onChange("fuelType", e.target.value)}
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Manufacturing Year</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 2021"
                        maxLength={4}
                        inputMode="numeric"
                        value={form.manufacturingYear}
                        onChange={(e) => onChange("manufacturingYear", sanitizeDigits(e.target.value, 4))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Odometer (KM)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 45000"
                        inputMode="numeric"
                        value={form.odometerKm}
                        onChange={(e) => onChange("odometerKm", sanitizeDigits(e.target.value, 7))}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", marginTop: "8px" }}>
                    <div className="form-group">
                      <label className="form-label">Car Deal Price (₹) *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                        placeholder="e.g. 450000"
                        inputMode="decimal"
                        required
                        value={form.amount}
                        onChange={(e) => onChange("amount", sanitizePositiveNumber(e.target.value))}
                      />
                      {errors.amount && <small className="error-text">{errors.amount}</small>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Advance / Token Amount (₹) *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.advanceAmount ? "is-invalid" : ""}`}
                        placeholder="e.g. 25000"
                        inputMode="decimal"
                        required
                        value={form.advanceAmount}
                        onChange={(e) => onChange("advanceAmount", sanitizePositiveNumber(e.target.value))}
                      />
                      {errors.advanceAmount && <small className="error-text">{errors.advanceAmount}</small>}
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "10px",
                      background: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      marginTop: "10px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block" }}>Total Deal Price</span>
                      <strong style={{ fontSize: "15px", color: "var(--text-heading)" }}>
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block" }}>Advance Paid</span>
                      <strong style={{ fontSize: "15px", color: "#16a34a" }}>
                        ₹{Number(form.advanceAmount || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block" }}>Balance Remaining</span>
                      <strong style={{ fontSize: "15px", color: "#0284c7" }}>
                        ₹{Math.max(0, totalAmount - Number(form.advanceAmount || 0)).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </div>

                  {editingId && (
                    <div className="form-group" style={{ marginTop: "12px", maxWidth: "240px" }}>
                      <label className="form-label">Order Status</label>
                      <select
                        className="form-control"
                        value={form.orderStatus}
                        onChange={(e) => onChange("orderStatus", e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Processing">Processing</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsFormOpen(false);
                    setForm(initialState);
                    setEditingId(null);
                    setErrors({});
                  }}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Submitting..." : editingId ? "Update Order" : "Submit Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Modal: View Order Details */}
      {viewOrder && (
        <div className="modal-backdrop" onClick={() => setViewOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "660px", width: "95%" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge badge-blue" style={{ fontSize: "11px", fontWeight: 700 }}>DETAILS</span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Order &amp; Purchase Details</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setViewOrder(null)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Customer Name
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 600 }}>{viewOrder.customerName || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Mobile Number
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500, fontFamily: "monospace" }}>{viewOrder.mobileNumber || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Alternate Mobile
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500, fontFamily: "monospace" }}>{viewOrder.alternateMobileNumber || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Pincode
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.pincode || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px", gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Full Delivery Address
                  </span>
                  <div style={{ fontSize: "13.5px", color: "var(--text)", fontWeight: 500 }}>{viewOrder.fullAddress || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Car Model &amp; Variant
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 600 }}>
                    {viewOrder.carModel || viewOrder.productType || "-"}
                  </div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Car Registration No.
                  </span>
                  <div style={{ fontSize: "14px", color: "var(--text-heading)", fontWeight: 600, textTransform: "uppercase" }}>
                    {viewOrder.carNumber || "-"}
                  </div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Body Type / Fuel
                  </span>
                  <div style={{ fontSize: "13.5px", color: "var(--text-heading)", fontWeight: 500 }}>
                    {viewOrder.productType || "Car"} {viewOrder.fuelType ? `• ${viewOrder.fuelType}` : ""}
                  </div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Year / Odometer
                  </span>
                  <div style={{ fontSize: "13.5px", color: "var(--text-heading)", fontWeight: 500 }}>
                    {viewOrder.manufacturingYear || "-"} {viewOrder.odometerKm ? `• ${Number(viewOrder.odometerKm).toLocaleString("en-IN")} KM` : ""}
                  </div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Car Deal Price
                  </span>
                  <div style={{ fontSize: "15px", color: "var(--text-heading)", fontWeight: 700 }}>
                    ₹{Number(viewOrder.totalAmount || viewOrder.amount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Advance Paid
                  </span>
                  <div style={{ fontSize: "14px", color: "#16a34a", fontWeight: 600 }}>
                    ₹{Number(viewOrder.advanceAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Remaining Balance
                  </span>
                  <div style={{ fontSize: "14px", color: "#0284c7", fontWeight: 600 }}>
                    ₹{Math.max(0, Number(viewOrder.totalAmount || viewOrder.amount || 0) - Number(viewOrder.advanceAmount || 0)).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Order Status
                  </span>
                  <div>{statusBadge(viewOrder.orderStatus)}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Parcel Status
                  </span>
                  <div style={{ fontSize: "13.5px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.parcelStatus || "Pending"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Bank Name
                  </span>
                  <div style={{ fontSize: "13.5px", color: "var(--text-heading)", fontWeight: 500 }}>{viewOrder.bankName || "-"}</div>
                </div>
                <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 600 }}>
                    Tracking ID &amp; Courier
                  </span>
                  <div style={{ fontSize: "13px", color: "var(--text-heading)", fontWeight: 500 }}>
                    {viewOrder.trackingId ? `${viewOrder.trackingId} (${viewOrder.courierCompany || "N/A"})` : "-"}
                  </div>
                </div>

                {viewOrder.paymentScreenshot && (
                  <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                      Payment Screenshot
                    </span>
                    <div style={{ display: "flex", justifyContent: "center", background: "#f8fafc", borderRadius: "8px", padding: "10px", border: "1px solid #e2e8f0" }}>
                      <a href={toAbsoluteAssetUrl(viewOrder.paymentScreenshot)} target="_blank" rel="noreferrer">
                        <img
                          src={toAbsoluteAssetUrl(viewOrder.paymentScreenshot)}
                          alt="Payment Screenshot"
                          style={{ maxWidth: "100%", maxHeight: "220px", objectFit: "contain", borderRadius: "6px" }}
                        />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Orders from CSV"
        description="Upload customer order records and purchase information from a CSV spreadsheet."
        templateFilename="orders_template.csv"
        templateHeaders={[
          "Customer Name",
          "Mobile Number",
          "Alternate Mobile",
          "Full Address",
          "Pincode",
          "Product Type",
          "Units",
          "Amount",
          "Advance Amount",
          "Date Of Order",
          "Order Status",
          "Parcel Status",
          "Tracking ID",
          "Courier Company",
        ]}
        templateSampleRows={[
          ["Vijay Kumar", "9876543210", "9812345678", "Sector 14, Gurgaon", "122001", "GPS", "1", "45000", "5000", "2026-09-29", "Approved", "Delivered", "TRK94821", "Blue Dart"],
        ]}
        requiredHeaders={["Customer Name", "Mobile Number"]}
        onImport={handleImportOrders}
      />

      {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}

      <ConfirmModal
        isOpen={Boolean(deleteConfirmOrder)}
        title={`Delete Order — ${deleteConfirmOrder?.customerName || ""}`}
        message={`Are you sure you want to delete the order for "${deleteConfirmOrder?.customerName || "this customer"}"? This action cannot be undone.`}
        confirmText="Delete Order"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOrder(null)}
      />
    </div>
  );
};

export default EmployeeOrderPage;
