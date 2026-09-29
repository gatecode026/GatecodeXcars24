"use client";
import { useCallback, useEffect, useState } from "react";
import { api, toAbsoluteAssetUrl } from "../api/client";
import DataTable from "../components/DataTable";
import { exportTableToCsv } from "../utils/csvHelper";

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

const columns = [
  { key: "employeeName", label: "Employee", render: (row) => row.employeeName || "-" },
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
  { key: "parcelStatus", label: "Parcel", render: (row) => parcelBadge(row.parcelStatus) },
  { key: "trackingId", label: "Tracking ID", render: (row) => row.trackingId || "-" },
  { key: "courierCompany", label: "Courier", render: (row) => row.courierCompany || "-" },
];

const fetchOrders = async () => {
  const res = await api.get("/orders");
  if (!res.data?.data) return [];
  return res.data.data;
};

const OrderHistoryPage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchOrders().then((data) => { if (mounted) { setOrders(data); setLoading(false); } }).catch((e) => { if (mounted) { setLoading(false); console.error("Failed to load order history:", e); } });
    return () => { mounted = false; };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchOrders().then((data) => { setOrders(data); setLoading(false); }).catch((e) => { setLoading(false); console.error("Failed to refresh order history:", e); });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete order for "${row.customerName}"? This cannot be undone.`)) return;
    await api.delete(`/orders/${row._id}`);
    handleRefresh();
  };

  const filteredOrders = orders.filter((o) => {
    if (!selectedDate) return true;
    if (!o.createdAt) return false;
    const orderDate = o.createdAt.split("T")[0];
    return orderDate === selectedDate;
  });

  const handleExportCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) return;
    const headers = [
      "Employee",
      "Customer Name",
      "Mobile Number",
      "Alt Mobile",
      "Product Type",
      "Units",
      "Total Amount",
      "Advance Amount",
      "Order Status",
      "Parcel Status",
      "Tracking ID",
      "Courier Company",
      "Date"
    ];
    const rows = filteredOrders.map((o) => [
      o.employeeName || "-",
      o.customerName || "-",
      o.mobileNumber || "-",
      o.alternateMobileNumber || "-",
      o.productType || "-",
      o.numberOfUnits || 1,
      o.totalAmount || 0,
      o.advanceAmount || 0,
      o.orderStatus || "Pending",
      o.parcelStatus || "Pending",
      o.trackingId || "-",
      o.courierCompany || "-",
      o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "-"
    ]);
    exportTableToCsv(`Purchase_History_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  return (
    <div className="content-area">
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Vehicle Purchase &amp; Order History</h1>
          <p>Historical log of vehicle purchases, shipments, and customer deliveries</p>
        </div>
        <div className="page-actions-group">
          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            title="Export Purchase History to CSV"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh} title="Refresh data">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="table-card" style={{ padding: "14px 20px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>Filter by Purchase Date:</span>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }}
        />
        {selectedDate && (
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setSelectedDate("")}
          >
            Clear Date
          </button>
        )}
      </div>

      {loading ? (
        <div className="table-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          <div className="loading-spinner" style={{ marginBottom: 12 }} />
          <div>Loading purchase history...</div>
        </div>
      ) : (
        <DataTable
          title="Completed Purchases"
          columns={columns}
          data={filteredOrders}
          searchKeys={["employeeName", "customerName", "mobileNumber", "alternateMobileNumber", "productType", "orderStatus", "parcelStatus", "trackingId", "courierCompany"]}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;
