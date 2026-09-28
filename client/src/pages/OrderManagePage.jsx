import { useCallback, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, toAbsoluteAssetUrl } from "../api/client";
import DataTable from "../components/DataTable";
import EditModal from "../components/EditModal";
import Toast from "../components/Toast";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status) => {
  const colors = {
    "Pending": "var(--warning)", "Approved": "var(--primary)",
    "Processing": "var(--primary)", "Delivered": "var(--success)",
    "Cancelled": "var(--danger)",
  };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11,
      fontWeight: 600, background: `${colors[status] || "#666"}22`,
      color: colors[status] || "#666", border: `1px solid ${colors[status] || "#666"}44`,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
};

const parcelBadge = (status) => {
  const colors = {
    "Pending": "var(--warning)", "Process": "#8b5cf6",
    "Parcel": "var(--primary)", "Packed": "#f59e0b",
    "Dispatched": "#3b82f6", "Delivered": "var(--success)",
  };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11,
      fontWeight: 600, background: `${colors[status] || "#666"}22`,
      color: colors[status] || "#666", border: `1px solid ${colors[status] || "#666"}44`,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
};

const orderEditFields = [
  { key: "customerName", label: "Customer Name" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "alternateMobileNumber", label: "Alt Mobile" },
  { key: "fullAddress", label: "Full Address" },
  { key: "pincode", label: "Pincode" },
  {
    key: "productType", label: "Product Type", type: "select",
    options: ["GPS", "Vending Machine", "Disposal", "Other"]
  },
  { key: "customProductName", label: "Custom Product Name" },
  { key: "numberOfUnits", label: "Number of Units", type: "number" },
  { key: "amount", label: "Amount (per unit)", type: "number" },
  { key: "totalAmount", label: "Total Amount", type: "number" },
  { key: "advanceAmount", label: "Advance Amount", type: "number" },
  {
    key: "orderStatus", label: "Status", type: "select",
    options: ["Pending", "Approved", "Processing", "Delivered", "Cancelled"]
  },
  {
    key: "parcelStatus", label: "Parcel Status", type: "select",
    options: ["Pending", "Process", "Parcel", "Packed", "Dispatched", "Delivered"]
  },
  { key: "trackingId", label: "Tracking ID" },
  { key: "courierCompany", label: "Courier Company" },
  { key: "bankName", label: "Bank Name", type: "select", options: ["SBI", "BOB", "BOM", "MGB", "UPGB", "MPGB"] },
];

const parcelStatusOptions = ["Pending", "Process", "Parcel", "Packed", "Dispatched", "Delivered"];

const fetchOrders = async () => {
  const res = await api.get("/orders");
  if (!res.data?.data) return [];
  return res.data.data;
};

const downloadAllOrdersPDF = (orders) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("All Orders Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Orders: ${orders.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  const rows = orders.map((o) => [
    (o._id || "").slice(-6).toUpperCase(),
    o.customerName || "-",
    o.mobileNumber || "-",
    o.alternateMobileNumber || "-",
    o.productType || "-",
    o.numberOfUnits || 0,
    `Rs.${o.totalAmount || 0}`,
    o.advanceAmount ? `Rs.${o.advanceAmount}` : "-",
    o.orderStatus || "-",
    formatDateTime(o.createdAt)
  ]);

  autoTable(doc, {
    startY: y,
    head: [["ID", "Customer", "Mobile", "Alt Mobile", "Product", "Units", "Total", "Advance", "Status", "Date"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [6, 182, 212], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    styles: { cellPadding: 2 }
  });

  doc.save("All_Orders_Report.pdf");
};

const OrderManagePage = () => {
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);
  const [toast, setToast] = useState(null);

  const todayOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    return o.createdAt.split("T")[0] === todayStr;
  });

  useEffect(() => {
    if (editRow) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [editRow]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchOrders().then((data) => { if (mounted) { setOrders(data); setLoading(false); } }).catch((e) => { if (mounted) { setLoading(false); console.error("Failed to load orders:", e); } });
    return () => { mounted = false; };
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchOrders().then((data) => { setOrders(data); setLoading(false); }).catch((e) => { setLoading(false); console.error("Failed to refresh orders:", e); });
  }, []);

  const updateOrderStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { orderStatus: status });
    handleRefresh();
  };

  const updateParcelStatus = async (id, parcelStatus) => {
    await api.patch(`/orders/${id}/parcel-status`, { parcelStatus });
    handleRefresh();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete order for "${row.customerName}"? This cannot be undone.`)) return;
    await api.delete(`/orders/${row._id}`);
    handleRefresh();
  };

  const handleEdit = (row) => {
    setEditRow(row);
  };

  const clearToast = useCallback(() => setToast(null), []);

  const handleSaveEdit = async (form) => {
    try {
      await api.put(`/orders/${form._id}`, form);
      setToast("Order updated successfully!");
      handleRefresh();
      setTimeout(() => setEditRow(null), 500);
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to update order");
    }
  };

  const handleDownloadPDF = () => {
    downloadAllOrdersPDF(todayOrders);
  };

  const columns = [
    { key: "customerName", label: "Customer" },
    { key: "mobileNumber", label: "Mobile" },
    { key: "alternateMobileNumber", label: "Alt Mobile", render: (row) => row.alternateMobileNumber || "-" },
    { key: "productType", label: "Product" },
    { key: "numberOfUnits", label: "Units" },
    { key: "totalAmount", label: "Total", render: (row) => formatCurrency(row.totalAmount) },
    { key: "incentive", label: "Incentive", render: (row) => formatCurrency(row.incentive) },
    { key: "advanceAmount", label: "Advance", render: (row) => formatCurrency(row.advanceAmount) },
    {
      key: "paymentScreenshot", label: "Payment",
      render: (row) =>
        row.paymentScreenshot ? (
          <a href={toAbsoluteAssetUrl(row.paymentScreenshot)} target="_blank" rel="noreferrer">
            <img className="table-preview-image" src={toAbsoluteAssetUrl(row.paymentScreenshot)} alt="Payment" />
          </a>
        ) : "-",
    },
    { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
    { key: "orderStatus", label: "Status", render: (row) => statusBadge(row.orderStatus) },
    {
      key: "parcelStatus", label: "Parcel",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {parcelBadge(row.parcelStatus)}
          <select
            value={row.parcelStatus || "Pending"}
            onChange={(e) => updateParcelStatus(row._id, e.target.value)}
            style={{ fontSize: 11, padding: "2px 4px", minWidth: 70 }}
            title="Change parcel status"
          >
            {parcelStatusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      )
    },
    {
      key: "trackingId", label: "Tracking",
      render: (row) => row.trackingId ? (
        <span style={{ fontSize: 12, color: "var(--primary)" }}>{row.trackingId}</span>
      ) : "-"
    },
    {
      key: "courierCompany", label: "Courier",
      render: (row) => row.courierCompany || "-"
    },
  ];

  return (
    <div className="content-area">
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Cars Purchased &amp; Procurement</h1>
          <p>Manage acquired vehicles, purchase details, and inspection statuses</p>
        </div>
        <div className="page-actions-group">
          <button className="btn btn-secondary" onClick={handleDownloadPDF} title="Download PDF">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh} title="Refresh records">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="table-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          <div className="loading-spinner" style={{ marginBottom: 12 }} />
          <div>Loading vehicle records...</div>
        </div>
      ) : (
        <DataTable
          title="Cars Purchased"
          columns={columns}
          data={todayOrders}
          statusOptions={["Pending", "Approved", "Processing", "Delivered", "Cancelled"]}
          onStatusChange={updateOrderStatus}
          searchKeys={["customerName", "mobileNumber", "alternateMobileNumber", "productType", "orderStatus", "parcelStatus", "trackingId", "courierCompany"]}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editRow && (
        <EditModal
          title="Order"
          fields={editRow.productType === "Other" ? orderEditFields : orderEditFields.filter((f) => f.key !== "customProductName")}
          data={editRow}
          onSave={handleSaveEdit}
          onClose={() => setEditRow(null)}
        />
      )}

      {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}
    </div>
  );
};

export default OrderManagePage;
