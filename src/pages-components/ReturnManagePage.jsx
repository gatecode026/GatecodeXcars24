"use client";
import { useCallback, useEffect, useState } from "react";
import { getPdfDoc } from "../utils/pdfExport";
import { api, emitDataSync, onDataSync } from "../api/client";
import DataTable from "../components/DataTable";
import EditModal from "../components/EditModal";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import CsvImportModal from "../components/CsvImportModal";
import { exportTableToCsv } from "../utils/csvHelper";

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

const returnEditFields = [
  { key: "customerName", label: "Customer Name" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "pincode", label: "Pincode" },
  {
    key: "productType", label: "Product Type", type: "select",
    options: ["GPS", "Vending Machine", "Disposal", "Other"]
  },
  { key: "numberOfUnitsReturning", label: "Units Returning", type: "number" },
  {
    key: "returnReason", label: "Return Reason", type: "select",
    options: ["Product Damaged", "Wrong Product", "Product Not Working", "Extra Order", "Other"]
  },
  { key: "customReason", label: "Custom Reason" },
  { key: "additionalDescription", label: "Additional Description", type: "textarea" },
  {
    key: "returnStatus", label: "Status", type: "select",
    options: ["Return Requested", "Return Approved", "Pickup Scheduled", "Returned Successfully", "Return Rejected"]
  },
];

const columns = [
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

const fetchReturns = async (force = false) => {
  const res = await api.get("/returns", force ? { forceRefresh: true } : {});
  if (!res.data?.data) return [];
  return res.data.data;
};

const downloadAllReturnsPDF = async (returns) => {
  const { doc, autoTable } = await getPdfDoc({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("All Returns Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Returns: ${returns.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  const rows = returns.map((r) => [
    (r._id || "").slice(-6).toUpperCase(),
    r.customerName || "-",
    r.mobileNumber || "-",
    r.productType || "-",
    r.numberOfUnitsReturning || 0,
    r.returnReason || "-",
    r.returnStatus || "-",
    formatDateTime(r.createdAt)
  ]);

  autoTable(doc, {
    startY: y,
    head: [["ID", "Customer", "Mobile", "Product", "Units", "Reason", "Status", "Date"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [245, 158, 11], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    styles: { cellPadding: 2 }
  });

  doc.save("All_Returns_Report.pdf");
};

const ReturnManagePage = () => {
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const todayReturns = returns.filter((r) => {
    if (!r.createdAt) return false;
    return r.createdAt.split("T")[0] === todayStr;
  });

  useEffect(() => {
    if (editRow) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [editRow]);

  useEffect(() => {
    let mounted = true;
    fetchReturns().then((data) => {
      if (mounted) {
        setReturns(data);
        setLoading(false);
      }
    }).catch((e) => {
      if (mounted) {
        setLoading(false);
        console.error("Failed to load returns:", e);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Multi-tab real-time synchronization
  useEffect(() => {
    const unsub = onDataSync((evt) => {
      if (evt?.type === "return") {
        fetchReturns().then((data) => setReturns(data)).catch(() => {});
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const onFocus = () => fetchReturns().then((data) => setReturns(data)).catch(() => {});
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchReturns(true).then((data) => { setReturns(data); setLoading(false); }).catch((e) => { setLoading(false); console.error("Failed to refresh returns:", e); });
  }, []);

  const updateReturnStatus = async (id, status) => {
    // Immediately update row in table without reload
    setReturns((prev) => prev.map((r) => (r._id === id ? { ...r, returnStatus: status } : r)));
    try {
      const res = await api.patch(`/returns/${id}/status`, { returnStatus: status });
      const updated = res.data?.data;
      if (updated) {
        setReturns((prev) => prev.map((r) => (r._id === id ? { ...r, ...updated } : r)));
      }
      emitDataSync({ type: "return", action: "update", id, returnStatus: status });
    } catch (err) {
      console.error("Failed to update return status:", err);
      fetchReturns().then((data) => setReturns(data));
      setToast(err.response?.data?.message || "Failed to update return status");
    }
  };

  const handleDelete = (row) => {
    setDeleteConfirmRow(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRow) return;
    const row = deleteConfirmRow;
    setDeleting(true);
    // Immediately remove row from table without reload
    setReturns((prev) => prev.filter((r) => r._id !== row._id));
    try {
      await api.delete(`/returns/${row._id}`);
      emitDataSync({ type: "return", action: "delete", id: row._id });
      setToast(`Return request for "${row.customerName}" deleted successfully`);
      setDeleteConfirmRow(null);
    } catch (err) {
      console.error("Failed to delete return:", err);
      fetchReturns().then((data) => setReturns(data));
      setToast(err.response?.data?.message || "Failed to delete return");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (row) => {
    setEditRow(row);
  };

  const clearToast = useCallback(() => setToast(null), []);

  const handleSaveEdit = async (form) => {
    try {
      const res = await api.put(`/returns/${form._id}`, form);
      const updated = res.data?.data || form;
      // Immediately update row in table without reload
      setReturns((prev) => prev.map((r) => (r._id === form._id ? { ...r, ...updated } : r)));
      setToast("Return updated successfully!");
      setEditRow(null);
      emitDataSync({ type: "return", action: "update", record: updated });
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to update return");
    }
  };

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const handleDownloadPDF = () => {
    downloadAllReturnsPDF(todayReturns);
  };

  const handleExportCSV = () => {
    if (!returns || returns.length === 0) {
      setToast("No return records available to export");
      return;
    }
    const headers = [
      "Customer Name",
      "Mobile Number",
      "Pincode",
      "Product Type",
      "Units Returning",
      "Return Reason",
      "Additional Description",
      "Return Status",
      "Date"
    ];
    const rows = returns.map((r) => [
      r.customerName || "-",
      r.mobileNumber || "-",
      r.pincode || "-",
      r.productType || "-",
      r.numberOfUnitsReturning || 1,
      r.returnReason || "-",
      r.additionalDescription || "-",
      r.returnStatus || "Return Requested",
      r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "-"
    ]);
    exportTableToCsv(`Returns_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    setToast("Returns exported to CSV");
  };

  const handleImportReturns = async (rows) => {
    // Save returns
    for (const r of rows) {
      const customerName = r["Customer Name"] || r["customerName"];
      const mobileNumber = r["Mobile Number"] || r["mobileNumber"];
      if (!customerName || !mobileNumber) continue;
      try {
        await api.post("/returns", {
          customerName,
          mobileNumber,
          pincode: r["Pincode"] || r["pincode"] || "110001",
          productType: r["Product Type"] || r["productType"] || "GPS",
          numberOfUnitsReturning: Number(r["Units Returning"] || r["numberOfUnitsReturning"]) || 1,
          returnReason: r["Return Reason"] || r["returnReason"] || "Other",
          additionalDescription: r["Additional Description"] || r["additionalDescription"] || ""
        });
      } catch (_) {}
    }
    setToast(`Processed CSV return records`);
    emitDataSync({ type: "return", action: "bulk" });
    fetchReturns().then((data) => setReturns(data));
  };

  return (
    <div className="content-area">
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Vehicle Returns &amp; Cancellation Management</h1>
          <p>Inspection returns, dispute management, deposit refunds, and logistics</p>
        </div>
        <div className="page-actions-group">
          <button
            className="btn btn-secondary"
            onClick={() => setIsCsvModalOpen(true)}
            title="Import Returns from CSV"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={returns.length === 0}
            title="Export Returns to CSV"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF} title="Download PDF">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh} title="Refresh">
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
          <div>Loading return requests...</div>
        </div>
      ) : (
        <DataTable
          title="Vehicle Return Requests"
          columns={columns}
          data={todayReturns}
          statusOptions={["Return Requested", "Return Approved", "Pickup Scheduled", "Returned Successfully", "Return Rejected"]}
          onStatusChange={updateReturnStatus}
          searchKeys={["customerName", "mobileNumber", "productType", "returnStatus"]}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editRow && (
        <EditModal
          title="Return"
          fields={editRow.returnReason === "Other" ? returnEditFields : returnEditFields.filter((f) => f.key !== "customReason")}
          data={editRow}
          onSave={handleSaveEdit}
          onClose={() => setEditRow(null)}
        />
      )}

      {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Vehicle Return Requests from CSV"
        description="Upload return requests, reason codes, and pickup inspection details."
        templateFilename="return_requests_template.csv"
        templateHeaders={[
          "Customer Name",
          "Mobile Number",
          "Pincode",
          "Product Type",
          "Units Returning",
          "Return Reason",
          "Additional Description"
        ]}
        templateSampleRows={[
          ["Anil Kapoor", "9876543210", "110001", "GPS", "1", "Product Not Working", "Device not powering on after vehicle installation"]
        ]}
        requiredHeaders={["Customer Name", "Mobile Number"]}
        onImport={handleImportReturns}
      />

      <ConfirmModal
        isOpen={Boolean(deleteConfirmRow)}
        title={`Delete Return — ${deleteConfirmRow?.customerName || ""}`}
        message={`Are you sure you want to delete the return request for "${deleteConfirmRow?.customerName || "this customer"}"? This action cannot be undone.`}
        confirmText="Delete Return"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmRow(null)}
      />
    </div>
  );
};

export default ReturnManagePage;
