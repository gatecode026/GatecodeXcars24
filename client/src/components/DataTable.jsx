import { useMemo, useState, useRef } from "react";
import { toAbsoluteAssetUrl } from "../api/client";

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DetailModal = ({ title, columns, data, onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
        <div className="modal-header">
          <h3>View Details - {title}</h3>
          <button className="modal-close-btn" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid-2">
            {columns.map((col) => {
              if (col.key === "paymentScreenshot") return null;
              return (
                <div key={col.key} className="detail-label-val">
                  <span className="detail-label">{col.label}</span>
                  <div className="detail-value" style={{ fontSize: "13.5px" }}>
                    {col.render ? col.render(data) : data[col.key] ? String(data[col.key]) : "-"}
                  </div>
                </div>
              );
            })}
          </div>

          {data.paymentScreenshot && (
            <div style={{ marginTop: "16px" }}>
              <span className="detail-label">Payment / Receipt Document</span>
              <div style={{ display: "flex", justifyContent: "center", background: "#f8fafc", borderRadius: "10px", padding: "14px", border: "1px solid var(--border)", marginTop: "6px" }}>
                <a href={toAbsoluteAssetUrl(data.paymentScreenshot)} target="_blank" rel="noreferrer">
                  <img
                    src={toAbsoluteAssetUrl(data.paymentScreenshot)}
                    alt="Payment Document"
                    style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "6px" }}
                  />
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DataTable = ({
  title,
  columns,
  data,
  statusOptions = [],
  searchKeys = [],
  showAction = true,
  onEdit,
  onDelete
}) => {
  const items = Array.isArray(data) ? data : [];
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewRow, setViewRow] = useState(null);
  const pageSize = 12;

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter) {
      list = list.filter((item) =>
        (item.orderStatus || item.returnStatus || item.parcelStatus || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((item) =>
        searchKeys.some((key) => {
          const val = String(item[key] ?? "").toLowerCase().trim();
          return val.startsWith(q) || val.includes(q);
        })
      );
    }
    if (sortConfig.key) {
      list.sort((a, b) => {
        const av = String(a[sortConfig.key] ?? "");
        const bv = String(b[sortConfig.key] ?? "");
        return sortConfig.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [items, search, searchKeys, sortConfig, statusFilter]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);


  return (
    <div className="table-card">
      <div className="table-header-bar" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div className="card-title-box">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-heading)" }}>
            {title}
            <span style={{ fontWeight: 600, fontSize: "12px", background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary-border)", padding: "2px 8px", borderRadius: "12px" }}>
              {items.length} records
            </span>
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "220px" }}>
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", display: "flex" }}>
              <SearchIcon />
            </div>
            <input
              className="form-control"
              placeholder="Search records..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: "32px", fontSize: "12.5px", padding: "6px 10px 6px 32px" }}
            />
          </div>

          {statusOptions.length > 0 && (
            <select
              className="form-control"
              style={{ width: "auto", fontSize: "12.5px", padding: "6px 12px", fontWeight: 600 }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="leads-table slidable-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => setSortConfig((prev) => ({
                    key: col.key,
                    direction: prev.key === col.key && prev.direction === "asc" ? "desc" : "asc",
                  }))}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span style={{ fontSize: "10px", color: "var(--primary)" }}>
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {showAction && (
                <th style={{ textAlign: "center", minWidth: "120px" }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showAction ? 1 : 0)}
                  style={{ textAlign: "center", color: "var(--text-muted)", padding: "48px 24px", fontSize: "13.5px" }}
                >
                  {search || statusFilter ? "No matching records found matching criteria" : "No records found in this category yet"}
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row._id}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ? String(row[col.key]) : "-"}
                    </td>
                  ))}
                  {showAction && (
                    <td style={{ textAlign: "center", minWidth: "120px" }}>
                      <div className="table-actions" style={{ justifyContent: "center" }}>
                        <button
                          type="button"
                          className="btn-action btn-action-view"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => setViewRow(row)}
                        >
                          <EyeIcon />
                        </button>
                        {onEdit && (
                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => onEdit(row)}
                          >
                            <EditIcon />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className="btn-action btn-action-delete"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => onDelete(row)}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Clean Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: "10px" }}>
        <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
          Showing <strong>{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-heading)", padding: "0 6px" }}>
            Page {page} of {maxPage}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page === maxPage || filtered.length === 0}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {viewRow && (
        <DetailModal
          title={title}
          columns={columns}
          data={viewRow}
          onClose={() => setViewRow(null)}
        />
      )}
    </div>
  );
};

export default DataTable;
