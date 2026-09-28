import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import DataTable from "../components/DataTable";

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status) => {
  const colors = {
    "Return Requested": "var(--warning)", "Return Approved": "var(--primary)",
    "Pickup Scheduled": "var(--primary)", "Returned Successfully": "var(--success)",
    "Return Rejected": "var(--danger)",
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
  { key: "productType", label: "Product" },
  { key: "numberOfUnitsReturning", label: "Units" },
  { key: "returnReason", label: "Reason" },
  {
    key: "additionalDescription", label: "Description",
    render: (row) => (
      <span style={{ maxWidth: 200, display: "inline-block", whiteSpace: "normal", fontSize: 12, lineHeight: 1.4 }}>
        {row.additionalDescription || "-"}
      </span>
    ),
  },
  { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
  { key: "returnStatus", label: "Status", render: (row) => statusBadge(row.returnStatus) },
];

const fetchReturns = async () => {
  const res = await api.get("/returns");
  if (!res.data?.data) return [];
  return res.data.data;
};

const ReturnHistoryPage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchReturns().then((data) => { if (mounted) { setReturns(data); setLoading(false); } }).catch((e) => { if (mounted) { setLoading(false); console.error("Failed to load return history:", e); } });
    return () => { mounted = false; };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchReturns().then((data) => { setReturns(data); setLoading(false); }).catch((e) => { setLoading(false); console.error("Failed to refresh return history:", e); });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete return request for "${row.customerName}"? This cannot be undone.`)) return;
    await api.delete(`/returns/${row._id}`);
    handleRefresh();
  };

  const filteredReturns = returns.filter((r) => {
    if (!selectedDate) return true;
    if (!r.createdAt) return false;
    const returnDate = r.createdAt.split("T")[0];
    return returnDate === selectedDate;
  });

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Return History</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            View completed and past returns
          </p>
        </div>
        <button className="logout-btn" onClick={handleRefresh} title="Refresh data">Refresh</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <label className="field-wrap" style={{ minWidth: 200, flexDirection: "row", gap: 8, alignItems: "center", margin: 0 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Filter by Date:</span>
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "var(--text)",
              fontSize: 13,
              outline: "none"
            }}
          />
        </label>
        {selectedDate && (
          <button
            className="primary-btn"
            style={{ background: "#64748b", padding: "6px 12px", fontSize: 12 }}
            onClick={() => setSelectedDate("")}
          >
            Clear Date
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
      ) : (
        <DataTable
          title="Returns"
          columns={columns}
          data={filteredReturns}
          searchKeys={["employeeName", "customerName", "mobileNumber", "productType", "returnStatus"]}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
};

export default ReturnHistoryPage;
