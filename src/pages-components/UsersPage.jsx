"use client";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, emitDataSync, onDataSync } from "../api/client";
import { useAuth } from "../context/AuthContext";
import CsvImportModal from "../components/CsvImportModal";
import { exportTableToCsv } from "../utils/csvHelper";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

// Clean UI Icons
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

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewUser, setViewUser] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleImportUsers = async (rows) => {
    try {
      const res = await api.post("/users/bulk-import", { rows });
      setToast({ message: res.data?.message || `Imported ${rows.length} users successfully!`, type: "success" });
      emitDataSync({ type: "user", action: "bulk" });
      fetchUsers();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to import users", type: "error" });
    }
  };

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) {
      setToast({ message: "No users available to export", type: "error" });
      return;
    }
    const headers = ["Name", "Email", "Phone Number", "Role", "Created Date"];
    const rows = filtered.map((u) => [
      u.name || "-",
      u.email || "-",
      u.phoneNumber || "-",
      u.role || "employee",
      formatDate(u.createdAt)
    ]);
    exportTableToCsv(`Team_Members_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/users", { forceRefresh: true });
      setUsers(res.data.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Real-time synchronization
  useEffect(() => {
    const unsub = onDataSync((evt) => {
      if (evt?.type === "user") {
        fetchUsers();
      }
    });
    return unsub;
  }, [fetchUsers]);

  useEffect(() => {
    const onFocus = () => fetchUsers();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchUsers]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (viewUser) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewUser]);

  const filtered = users
    .filter((u) => {
      // Never show deleted accounts
      if (u.isDeleted) return false;
      // Never show administrator accounts in the employee list
      if (u.role === "admin") return false;
      // Never show the currently logged in user
      if (
        currentUser &&
        (String(u._id) === String(currentUser.id) ||
          String(u._id) === String(currentUser._id) ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()))
      ) {
        return false;
      }
      return true;
    })
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.phoneNumber && u.phoneNumber.includes(q))
      );
    });

  const handleDelete = (id, name, email) => {
    if (
      currentUser &&
      (String(currentUser.id) === String(id) ||
        String(currentUser._id) === String(id) ||
        (currentUser.email && email && currentUser.email.toLowerCase() === email.toLowerCase()))
    ) {
      setToast({ message: "Critical Security Alert: You cannot delete your own active account.", type: "error" });
      return;
    }
    setDeleteConfirmUser({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    const { id, name } = deleteConfirmUser;
    setDeleting(true);
    try {
      await api.delete(`/auth/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      emitDataSync({ type: "user", action: "delete", id });
      setToast({ message: `Employee "${name}" deleted successfully`, type: "success" });
      setDeleteConfirmUser(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete user";
      setToast({ message: msg, type: "error" });
      fetchUsers();
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "-";

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-box">
          <h1>Employees &amp; Team Users</h1>
          <p>All registered employee accounts, contact details, and role permissions</p>
        </div>
        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsCsvModalOpen(true)}
            title="Import Team Users from CSV"
          >
            <UploadIcon />
            Import CSV
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            title="Export Users to CSV"
          >
            <DownloadIcon />
            Export CSV
          </button>
          <Link to="/admin/register" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <PlusIcon />
            Register New User
          </Link>
        </div>
      </div>

      {/* Search & Counter Card */}
      <div className="table-card" style={{ marginBottom: "20px", padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
            Total Registered Users: <strong style={{ color: "var(--primary)", fontWeight: 700 }}>{filtered.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        <div className="table-container">
          <table className="leads-table slidable-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Role</th>
                <th>Registered Date</th>
                <th style={{ textAlign: "center", minWidth: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                      <div className="spinner-border" />
                      Loading employees database...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
                    {search ? "No employees match your search criteria." : "No registered employees found."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: u.role === "admin" ? "#0284c7" : "#0ea5e9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "13px",
                            color: "#ffffff",
                            flexShrink: 0
                          }}
                        >
                          {(u.name || "?").charAt(0).toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 600, color: "var(--text-heading)", fontSize: "13.5px" }}>
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "12.5px", color: "var(--text)" }}>{u.email}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12.5px", color: "var(--text-heading)", fontWeight: 500 }}>
                        {u.phoneNumber || "-"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge-verified-pill ${u.role === "admin" ? "verified" : (u.role === "tl" ? "completed" : "followup")}`}
                        style={{ textTransform: "capitalize", fontWeight: 600 }}
                      >
                        {u.role === "tl" ? "Team Leader (TL)" : (u.role === "admin" ? "Administrator" : "Executive")}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(u.createdAt)}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="table-actions" style={{ justifyContent: "center" }}>
                        <button
                          type="button"
                          className="btn-action btn-action-view"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => setViewUser(u)}
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-action-edit"
                          title="Edit User"
                          aria-label="Edit User"
                          onClick={() => navigate(`/admin/register/${u._id}?edit=true`)}
                        >
                          <EditIcon />
                        </button>
                        {u.email?.toLowerCase() === "uttam306115@gmail.com" ? (
                          <button
                            type="button"
                            className="btn-action"
                            style={{ opacity: 0.35, cursor: "not-allowed" }}
                            disabled
                            title="Primary administrator account is protected"
                            aria-label="Account protected"
                          >
                            <TrashIcon />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-action btn-action-delete"
                            title="Delete User"
                            aria-label="Delete User"
                            onClick={() => handleDelete(u._id, u.name, u.email)}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal (Matching Design System) */}
      {viewUser && (
        <div className="modal-backdrop" onClick={() => setViewUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <h3>Employee Dossier — {viewUser.name}</h3>
              <button className="modal-close-btn" onClick={() => setViewUser(null)}>
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-section-card" style={{ marginBottom: "12px" }}>
                <div className="form-section-heading">Personal Information</div>
                <div className="detail-label-val">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{viewUser.name}</span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{viewUser.email}</span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value">{viewUser.phoneNumber || "Not provided"}</span>
                </div>
              </div>

              <div className="form-section-card">
                <div className="form-section-heading">System &amp; Permissions</div>
                <div className="detail-label-val">
                  <span className="detail-label">Assigned Role</span>
                  <span className="detail-value" style={{ textTransform: "capitalize" }}>
                    <span className={`badge-verified-pill ${viewUser.role === "admin" ? "verified" : "followup"}`}>
                      {viewUser.role}
                    </span>
                  </span>
                </div>
                <div className="detail-label-val">
                  <span className="detail-label">Account Created</span>
                  <span className="detail-value">{new Date(viewUser.createdAt).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const toEdit = viewUser;
                  setViewUser(null);
                  navigate(`/admin/register/${toEdit._id}?edit=true`);
                }}
              >
                <EditIcon />
                Edit Account
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setViewUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Team Employees from CSV"
        description="Upload employee accounts and team members. Existing email addresses will be skipped automatically."
        templateFilename="team_users_template.csv"
        templateHeaders={["Name", "Email", "Phone Number", "Role", "Password"]}
        templateSampleRows={[
          ["Pooja Verma", "pooja@cars24.com", "9876543210", "employee", "User@12345"],
          ["Rahul Sharma", "rahul@cars24.com", "9812345678", "employee", "User@12345"]
        ]}
        requiredHeaders={["Name", "Email"]}
        onImport={handleImportUsers}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleteConfirmUser)}
        title={`Delete Employee "${deleteConfirmUser?.name || ""}"`}
        message={`Are you sure you want to delete employee "${deleteConfirmUser?.name || "this employee"}"? The account will be deactivated and removed from active access.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmUser(null)}
      />
    </div>
  );
};

export default UsersPage;
