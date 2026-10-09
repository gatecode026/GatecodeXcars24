"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { api, onDataSync } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Database,
  Search,
  Filter,
  SlidersHorizontal,
  Upload,
  FileSpreadsheet,
  FileText,
  Columns3,
  Bookmark,
  RefreshCw,
  X,
  Trash2,
  Plus,
  Check,
  Calendar,
  Target,
  Tag,
  Gavel,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FilterX,
  History,
  RotateCcw,
  Archive,
  Download,
  Eye
} from "lucide-react";

// ─── DATE TIME FORMATTER HELPER ───────────────────────────────────────────────
const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (_) {
    return String(dateStr);
  }
};

// ─── LUCIDE ICON WRAPPERS FOR CLEAN BACKWARD COMPATIBILITY ─────────────────────
const DatabaseIcon = ({ size = 18 }) => <Database size={size} />;
const SearchIcon = ({ size = 16 }) => <Search size={size} />;
const FilterIcon = ({ size = 16 }) => <Filter size={size} />;
const UploadIcon = ({ size = 16 }) => <Upload size={size} />;
const FileCsvIcon = ({ size = 16 }) => <FileText size={size} />;
const FilePdfIcon = ({ size = 16 }) => <FileText size={size} />;
const ColumnsIcon = ({ size = 16 }) => <Columns3 size={size} />;
const BookmarkIcon = ({ size = 16 }) => <Bookmark size={size} />;
const RefreshIcon = ({ spinning, size = 16 }) => (
  <RefreshCw size={size} style={{ animation: spinning ? "spin 0.8s linear infinite" : "none" }} />
);
const CloseIcon = ({ size = 14 }) => <X size={size} />;
const TrashIcon = ({ size = 15 }) => <Trash2 size={size} />;
const PlusIcon = ({ size = 14 }) => <Plus size={size} />;
const CheckIcon = ({ size = 14 }) => <Check size={size} />;

// ─── STATUS PILL COLOR MAPPINGS ───────────────────────────────────────────
const getStatusBadgeStyle = (status = "") => {
  const s = String(status).toLowerCase();
  if (s.includes("completed") || s.includes("verified") || s.includes("purchased")) {
    return { bg: "#dcfce7", color: "#15803d", border: "#86efac" };
  }
  if (s.includes("pending") || s.includes("in progress")) {
    return { bg: "#fef9c3", color: "#a16207", border: "#fde047" };
  }
  if (s.includes("cancelled") || s.includes("rejected") || s.includes("no-show")) {
    return { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" };
  }
  if (s.includes("rescheduled") || s.includes("follow-up")) {
    return { bg: "#e0e7ff", color: "#4338ca", border: "#a5b4fc" };
  }
  return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
};

const getPresetRangeDisplay = (preset) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (preset === "today") {
    return `Today (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    return `Yesterday (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "last_7_days") {
    start.setDate(start.getDate() - 6);
    return `Last 7 Days (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "last_30_days") {
    start.setDate(start.getDate() - 29);
    return `Last 30 Days (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "this_week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return `This Week (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "last_week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day - 6);
    end.setDate(start.getDate() + 6);
    return `Last Week (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "this_month") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
    return `This Month (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "last_month") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
    return `Last Month (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "this_quarter") {
    const q = Math.floor(now.getMonth() / 3);
    start.setMonth(q * 3, 1);
    end.setMonth((q + 1) * 3, 0);
    return `This Quarter (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
  } else if (preset === "this_year") {
    return `This Year (01 Jan ${now.getFullYear()} – 31 Dec ${now.getFullYear()})`;
  } else if (preset === "last_year") {
    return `Last Year (01 Jan ${now.getFullYear() - 1} – 31 Dec ${now.getFullYear() - 1})`;
  }
  return "";
};

const getPresetDates = (preset) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  const toIso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  if (preset === "today") {
    return { from: toIso(start), to: toIso(end) };
  } else if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
    return { from: toIso(start), to: toIso(end) };
  } else if (preset === "last_7_days") {
    start.setDate(start.getDate() - 6);
    return { from: toIso(start), to: toIso(end) };
  } else if (preset === "last_30_days") {
    start.setDate(start.getDate() - 29);
    return { from: toIso(start), to: toIso(end) };
  } else if (preset === "this_week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return { from: toIso(start), to: toIso(end) };
  } else if (preset === "last_week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day - 6);
    end.setDate(start.getDate() + 6);
    return { from: toIso(start), to: toIso(end) };
  } else if (preset === "this_month") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
    return { from: toIso(start), to: toIso(end) };
  } else if (preset === "last_month") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
    return { from: toIso(start), to: toIso(end) };
  }
  return { from: "", to: "" };
};

export default function DataManagementPage() {
  const { user } = useAuth();

  // ─── STATE ───
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState("LEAD_DATE");
  const [sortDir, setSortDir] = useState("desc");

  // Filtering & Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [filters, setFilters] = useState([]);
  const [filterLogic, setFilterLogic] = useState("AND");

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Columns & Column Visibility
  const [availableColumns, setAvailableColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [columnSearch, setColumnSearch] = useState("");

  // Modals & Drawers
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toast, setToast] = useState(null);

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importParsedRows, setImportParsedRows] = useState([]);
  const [importValidation, setImportValidation] = useState(null);
  const [importDuplicateHandling, setImportDuplicateHandling] = useState("update");
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [archiveOldTableOnImport, setArchiveOldTableOnImport] = useState(true);

  // Historical Tables & Snapshot State
  const [selectedHistoryBatch, setSelectedHistoryBatch] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyBatches, setHistoryBatches] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentBatchInfo, setCurrentBatchInfo] = useState(null);
  const [totalHistoryBatches, setTotalHistoryBatches] = useState(0);

  // Saved Views State
  const [savedViews, setSavedViews] = useState([]);
  const [newViewName, setNewViewName] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Saved Column Preferences
  useEffect(() => {
    const saved = localStorage.getItem("data_management_visible_cols");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr) && arr.length > 0) {
          setVisibleColumns(new Set(arr));
        }
      } catch (_) {}
    }
  }, []);

  // Fetch Available Columns
  useEffect(() => {
    api.get("/data-management/columns")
      .then((res) => {
        const cols = res.data?.columns || [];
        setAvailableColumns(cols);
        setVisibleColumns((prev) => {
          if (prev.size > 0) return prev;
          const defaults = cols.filter((c) => c.defaultVisible).map((c) => c.key);
          return new Set(defaults);
        });
      })
      .catch((err) => console.error("Error loading columns metadata:", err));
  }, []);

  // Fetch Saved Views
  const fetchSavedViews = useCallback(async () => {
    try {
      const res = await api.get("/data-management/views");
      setSavedViews(res.data?.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchSavedViews();
  }, [fetchSavedViews]);

  // Fetch Import History Batches
  const fetchHistoryBatches = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get("/data-management/import-history");
      setHistoryBatches(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch import history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryBatches();
  }, [fetchHistoryBatches]);

  const fetchReqIdRef = useRef(0);

  // Main Data Fetcher
  const fetchData = useCallback(async (options = {}) => {
    const isSilent = options.silent === true;
    if (options.force) {
      setRefreshing(true);
    } else if (!isSilent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const currentReqId = ++fetchReqIdRef.current;

    try {
      const params = {
        page: options.page || page,
        perPage,
        search: debouncedSearch,
        statusQuickFilter: quickFilter,
        filters: JSON.stringify(filters),
        logic: filterLogic,
        sort: JSON.stringify({ field: sortField, direction: sortDir }),
        batchId: selectedHistoryBatch?._id || undefined,
        viewMode: selectedHistoryBatch ? "archived" : "active"
      };

      const res = await api.get("/data-management", { params, forceRefresh: options.force === true });
      if (currentReqId !== fetchReqIdRef.current) return;

      const { data, pagination, currentBatch, totalHistoryBatches: totalBatches } = res.data;

      setRecords(data || []);
      setTotalRecords(pagination?.total || 0);
      setFilteredCount(pagination?.filtered || 0);
      setTotalPages(pagination?.totalPages || 1);
      if (currentBatch) setCurrentBatchInfo(currentBatch);
      if (typeof totalBatches === "number") setTotalHistoryBatches(totalBatches);
      if (options.page) setPage(options.page);
    } catch (err) {
      if (currentReqId !== fetchReqIdRef.current) return;
      console.error("Failed to load data management records:", err);
      setToast({ type: "error", message: "Failed to load records from database." });
    } finally {
      if (currentReqId === fetchReqIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [page, perPage, debouncedSearch, quickFilter, filters, filterLogic, sortField, sortDir, selectedHistoryBatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time listener
  useEffect(() => {
    const unsub = onDataSync((evt) => {
      if (evt?.type === "data-management") {
        fetchData({ silent: true });
      }
    });
    return unsub;
  }, [fetchData]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ─── SORTING ───
  const handleSort = (fieldKey) => {
    if (sortField === fieldKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(fieldKey);
      setSortDir("desc");
    }
    setPage(1);
  };

  // ─── SELECTION ───
  const handleSelectAllOnPage = (e) => {
    if (e.target.checked) {
      const next = new Set(selectedIds);
      records.forEach((r) => next.add(r._id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      records.forEach((r) => next.delete(r._id));
      setSelectedIds(next);
    }
  };

  const handleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const isAllOnPageSelected = records.length > 0 && records.every((r) => selectedIds.has(r._id));

  // ─── BULK DELETE ───
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected records?`)) return;

    try {
      await api.post("/data-management/bulk-delete", { ids: Array.from(selectedIds) });
      setToast({ type: "success", message: `Deleted ${selectedIds.size} records successfully.` });
      setSelectedIds(new Set());
      fetchData({ force: true });
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Bulk delete failed." });
    }
  };

  // ─── COLUMN PREFERENCES ───
  const toggleColumnVisibility = (key) => {
    const next = new Set(visibleColumns);
    if (next.has(key)) {
      if (next.size <= 2) {
        alert("At least 2 columns must remain visible.");
        return;
      }
      next.delete(key);
    } else {
      next.add(key);
    }
    setVisibleColumns(next);
    localStorage.setItem("data_management_visible_cols", JSON.stringify(Array.from(next)));
  };

  const resetColumnsToDefault = () => {
    const defaults = availableColumns.filter((c) => c.defaultVisible).map((c) => c.key);
    setVisibleColumns(new Set(defaults));
    localStorage.removeItem("data_management_visible_cols");
  };

  // ─── IMPORT FILE HANDLING ───
  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const processUploadedFile = (file) => {
    setImportFile(file);
    setImportValidation(null);
    setImportSummary(null);
    setImportLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          alert("Uploaded file contains no data rows.");
          setImportLoading(false);
          return;
        }

        setImportParsedRows(rows);

        // Validate on backend
        const valRes = await api.post("/data-management/validate-import", { rows });
        setImportValidation(valRes.data);
      } catch (err) {
        console.error("Import parse error:", err);
        alert("Failed to parse spreadsheet file: " + (err.message || "Invalid file format"));
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    if (!importParsedRows || importParsedRows.length === 0) return;
    setImportLoading(true);
    try {
      const res = await api.post("/data-management/import", {
        rows: importParsedRows,
        duplicateHandling: importDuplicateHandling,
        fileName: importFile?.name || "import_dataset.xlsx",
        fileSize: importFile?.size || 0,
        archiveOldTable: archiveOldTableOnImport
      });

      setImportSummary(res.data?.summary);
      setSelectedHistoryBatch(null);
      setToast({
        type: "success",
        message: archiveOldTableOnImport
          ? "Nayi table import ho gayi! Purani active table date ke sath History me archive kar di gayi hai."
          : (res.data?.message || "Import completed successfully!")
      });
      fetchData({ force: true });
      fetchHistoryBatches();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Import failed." });
    } finally {
      setImportLoading(false);
    }
  };

  // ─── HISTORY BATCH ACTIONS ───
  const handleRestoreBatch = async (batch) => {
    if (!batch?._id) return;
    const confirmMsg = `Kya aap sach me "${batch.fileName}" (${formatDateTime(batch.createdAt)}) ko Current Active Table banana chahte hain?\n\nAbhi ki active table history me save ho jayegi aur yeh table active ho jayegi.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      const res = await api.post(`/data-management/import-history/${batch._id}/restore`);
      setToast({ type: "success", message: res.data?.message || "Historical table restored to active successfully!" });
      setSelectedHistoryBatch(null);
      setIsHistoryModalOpen(false);
      fetchData({ force: true });
      fetchHistoryBatches();
    } catch (err) {
      console.error("Failed to restore history batch:", err);
      setToast({ type: "error", message: err.response?.data?.message || "Failed to restore table." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!batch?._id) return;
    const confirmMsg = `Kya aap sach me historical snapshot "${batch.fileName}" (${formatDateTime(batch.createdAt)}) ko delete karna chahte hain?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/data-management/import-history/${batch._id}`);
      setToast({ type: "success", message: "Historical snapshot deleted successfully." });
      if (selectedHistoryBatch?._id === batch._id) {
        setSelectedHistoryBatch(null);
      }
      fetchHistoryBatches();
      fetchData({ force: true });
    } catch (err) {
      console.error("Failed to delete history batch:", err);
      setToast({ type: "error", message: err.response?.data?.message || "Failed to delete historical snapshot." });
    }
  };

  const handleDownloadBatchCSV = async (batch) => {
    if (!batch?._id) return;
    try {
      setToast({ type: "info", message: `Downloading CSV for ${batch.fileName}...` });
      const res = await api.get(`/data-management/export/csv?batchId=${batch._id}&columns=all`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cleanName = (batch.fileName || "dataset").replace(/\.[^/.]+$/, "");
      link.download = `History_${cleanName}_${new Date(batch.createdAt).toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ type: "success", message: "CSV download completed!" });
    } catch (err) {
      console.error("Failed to download batch CSV:", err);
      setToast({ type: "error", message: "Failed to download batch CSV." });
    }
  };

  // ─── EXPORT HANDLING ───
  const handleExport = async (format = "csv", scope = "filtered") => {
    try {
      setToast({ type: "info", message: `Generating ${format.toUpperCase()} export...` });

      const payload = {
        search: scope === "filtered" ? debouncedSearch : "",
        filters: scope === "filtered" ? filters : [],
        logic: filterLogic,
        statusQuickFilter: scope === "filtered" ? quickFilter : "",
        columns: Array.from(visibleColumns),
        sort: { field: sortField, direction: sortDir }
      };

      const res = await api.post(`/data-management/export/${format}`, payload, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `GatecodeXCars24_Data_${new Date().toISOString().slice(0, 10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setIsExportModalOpen(false);
      setToast({ type: "success", message: `${format.toUpperCase()} export downloaded successfully!` });
    } catch (err) {
      console.error("Export error:", err);
      setToast({ type: "error", message: `Failed to export ${format.toUpperCase()}.` });
    }
  };

  // ─── SAVED VIEWS ───
  const handleSaveCurrentView = async () => {
    if (!newViewName.trim()) return;
    try {
      const payload = {
        name: newViewName.trim(),
        filters,
        logic: filterLogic,
        search: debouncedSearch,
        sort: { field: sortField, direction: sortDir },
        visibleColumns: Array.from(visibleColumns),
        perPage
      };
      await api.post("/data-management/views", payload);
      setNewViewName("");
      setToast({ type: "success", message: "Filter view saved!" });
      fetchSavedViews();
    } catch (err) {
      setToast({ type: "error", message: "Failed to save view." });
    }
  };

  const handleApplySavedView = (view) => {
    setFilters(view.filters || []);
    setFilterLogic(view.logic || "AND");
    setSearch(view.search || "");
    setDebouncedSearch(view.search || "");
    if (view.sort?.field) setSortField(view.sort.field);
    if (view.sort?.direction) setSortDir(view.sort.direction);
    if (view.visibleColumns?.length > 0) setVisibleColumns(new Set(view.visibleColumns));
    if (view.perPage) setPerPage(view.perPage);
    setPage(1);
    setIsSavedViewsOpen(false);
    setToast({ type: "success", message: `Applied view "${view.name}"` });
  };

  const handleDeleteSavedView = async (id) => {
    try {
      await api.delete(`/data-management/views/${id}`);
      fetchSavedViews();
    } catch (_) {}
  };

  // Active columns to display
  const displayColumns = useMemo(() => {
    return availableColumns.filter((c) => visibleColumns.has(c.key));
  }, [availableColumns, visibleColumns]);

  return (
    <div className="content-area" style={{ maxWidth: "100%", padding: "20px 24px" }}>
      {/* Toast Banner */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "8px",
            background: toast.type === "error" ? "#ef4444" : toast.type === "success" ? "#10b981" : "#0284c7",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          {toast.type === "success" ? <CheckIcon /> : null}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", marginLeft: "10px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 1. HEADER ROW ── */}
      <div className="page-header-row" style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div className="page-title-box">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(2, 132, 199, 0.1)", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DatabaseIcon />
            </div>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--text-heading, #0f172a)" }}>
                Data Management
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                Large-scale operational datasets, vehicle dossiers, inspection reports &amp; multi-dimensional filtering
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setImportFile(null);
              setImportValidation(null);
              setImportSummary(null);
              setIsImportModalOpen(true);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <UploadIcon />
            <span>Import Data</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              fetchHistoryBatches();
              setIsHistoryModalOpen(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: selectedHistoryBatch ? "#fef3c7" : undefined,
              borderColor: selectedHistoryBatch ? "#f59e0b" : undefined,
              color: selectedHistoryBatch ? "#b45309" : undefined,
              fontWeight: 600
            }}
            title="Imported Tables History with Date & Time"
          >
            <Clock size={15} />
            <span>Table History {totalHistoryBatches > 0 ? `(${totalHistoryBatches})` : ""}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsExportModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <FileCsvIcon />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport("pdf", "filtered")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <FilePdfIcon />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsColumnModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ColumnsIcon />
            <span>Columns ({visibleColumns.size} / {availableColumns.length})</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsSavedViewsOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <BookmarkIcon />
            <span>Saved Views</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchData({ force: true })}
            title="Refresh dataset"
            style={{ padding: "8px 10px" }}
          >
            <RefreshIcon spinning={refreshing} />
          </button>
        </div>
      </div>

      {/* ── ACTIVE / HISTORICAL TABLE STATUS BANNER ── */}
      {selectedHistoryBatch ? (
        <div
          style={{
            marginBottom: "16px",
            padding: "14px 18px",
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            border: "1px solid #fde68a",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.12)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f59e0b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Archive size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#92400e" }}>
                  Viewing Historical Table Snapshot
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d" }}>
                  Archived / Purani Table
                </span>
                <span style={{ fontSize: "11px", color: "#78350f" }}>
                  (Read-Only View)
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#78350f", marginTop: "3px" }}>
                File: <strong>{selectedHistoryBatch.fileName}</strong> • Imported: <strong>{formatDateTime(selectedHistoryBatch.createdAt)}</strong>
                {selectedHistoryBatch.archivedAt && (
                  <span> • Archived: <strong>{formatDateTime(selectedHistoryBatch.archivedAt)}</strong></span>
                )}
                <span> • Total Snapshot Rows: <strong>{(selectedHistoryBatch.totalRows || totalRecords).toLocaleString("en-IN")}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => handleRestoreBatch(selectedHistoryBatch)}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              title="Is historical table ko wapas current active table banayein"
            >
              <RotateCcw size={14} />
              <span>Restore to Active Table</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleDownloadBatchCSV(selectedHistoryBatch)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              title="Download this snapshot as CSV"
            >
              <Download size={14} />
              <span>Download CSV</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedHistoryBatch(null)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
              <span>Back to Active Table</span>
            </button>
          </div>
        </div>
      ) : currentBatchInfo ? (
        <div
          style={{
            marginBottom: "14px",
            padding: "8px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "12px",
            color: "#166534"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 3px rgba(34, 197, 94, 0.2)" }} />
            <span>
              <strong>Current Active Table:</strong> {currentBatchInfo.fileName || "Live Operational Dataset"}
            </span>
            <span style={{ color: "#15803d" }}>•</span>
            <span>
              Imported on: <strong>{formatDateTime(currentBatchInfo.createdAt)}</strong>
            </span>
            {currentBatchInfo.performedByName && (
              <>
                <span style={{ color: "#15803d" }}>•</span>
                <span>By: <strong>{currentBatchInfo.performedByName}</strong></span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              fetchHistoryBatches();
              setIsHistoryModalOpen(true);
            }}
            style={{
              background: "none",
              border: "none",
              color: "#15803d",
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "12px",
              padding: 0
            }}
          >
            View Past Table History ({totalHistoryBatches}) →
          </button>
        </div>
      ) : null}

      {/* ── 2. METRICS & KPI STRIP ── */}
      <div
        className="glass-card"
        style={{
          padding: "12px 18px",
          marginBottom: "16px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0"
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px" }}>
              Total Records
            </span>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
              {totalRecords.toLocaleString("en-IN")}
            </div>
          </div>

          <div style={{ width: "1px", height: "30px", background: "#e2e8f0" }} />

          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px" }}>
              Filtered Records
            </span>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#0284c7" }}>
              {filteredCount.toLocaleString("en-IN")}
            </div>
          </div>

          <div style={{ width: "1px", height: "30px", background: "#e2e8f0" }} />

          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#64748b", letterSpacing: "0.5px" }}>
              Selected
            </span>
            <div style={{ fontSize: "18px", fontWeight: 800, color: selectedIds.size > 0 ? "#16a34a" : "#64748b" }}>
              {selectedIds.size}
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleBulkDelete}
                style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", fontSize: "12px", padding: "4px 10px" }}
              >
                Delete Selected ({selectedIds.size})
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedIds(new Set())}
                style={{ fontSize: "12px", padding: "4px 8px" }}
              >
                Deselect
              </button>
            </div>
          )}
        </div>

        {/* Quick Status Pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { key: "all", label: "All Records" },
            { key: "Purchased", label: "Purchased / Tokens (13)" },
            { key: "Auctioned", label: "Auctioned / Quotes (469)" },
            { key: "Confirmed", label: "Confirmed" },
            { key: "Booked", label: "Booked" },
            { key: "Inspected", label: "Inspected" },
            { key: "Verified", label: "Verified" },
            { key: "Unverified", label: "Unverified" },
            { key: "Cancelled", label: "Cancelled" }
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setQuickFilter(key);
                setPage(1);
              }}
              style={{
                border: "none",
                background: quickFilter === key ? "#0284c7" : "#f1f5f9",
                color: quickFilter === key ? "#ffffff" : "#475569",
                fontSize: "12px",
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. SEARCH & ADVANCED FILTER BAR ── */}
      <div
        className="glass-card"
        style={{
          padding: "12px 18px",
          marginBottom: "14px",
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0"
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Global Search Input */}
          <div style={{ flex: "1 1 320px", position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search anything (Appointment ID, Make, Model, Store, DSA, Email, Status)..."
              style={{
                width: "100%",
                padding: "8px 36px 8px 36px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none"
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                title="Clear search"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Advanced Filters Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsFilterModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: filters.length > 0 ? "rgba(2, 132, 199, 0.08)" : "#f8fafc",
              border: filters.length > 0 ? "1px solid #0284c7" : "1px solid #cbd5e1",
              color: filters.length > 0 ? "#0284c7" : "#334155"
            }}
          >
            <FilterIcon />
            <span>{filters.length > 0 ? `Advanced Filters · ${filters.length}` : "Advanced Filters"}</span>
          </button>

          {/* Clear Filters Button */}
          {(filters.length > 0 || search || quickFilter !== "all") && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFilters([]);
                setSearch("");
                setQuickFilter("all");
                setPage(1);
              }}
              style={{ color: "#ef4444", borderColor: "#fca5a5" }}
            >
              Reset All
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {filters.length > 0 && (
          <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #e2e8f0", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Active Filters:
            </span>
            {filters.map((f, idx) => {
              const colDef = availableColumns.find((c) => c.key === f.field);
              const label = colDef?.label || f.field;
              let valStr = String(f.value ?? "");
              if (f.operator === "between" || f.operator === "custom_range") {
                valStr = `${f.from || "Start"} → ${f.to || "End"}`;
              } else if (["today", "yesterday", "last_7_days", "last_30_days", "this_week", "last_week", "this_month", "last_month", "this_quarter", "this_year", "last_year"].includes(f.operator)) {
                valStr = getPresetRangeDisplay(f.operator);
              } else if (f.operator === "is_any_of" || f.operator === "in") {
                valStr = Array.isArray(f.value) ? f.value.join(", ") : String(f.value || "");
              } else if (f.operator === "is_none_of" || f.operator === "not_in") {
                valStr = `Excluding: ${Array.isArray(f.value) ? f.value.join(", ") : String(f.value || "")}`;
              } else if (f.operator === "is_empty") {
                valStr = "Empty / Not Set";
              } else if (f.operator === "is_not_empty") {
                valStr = "Has Value";
              }
              return (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#eff6ff",
                    color: "#1e40af",
                    border: "1px solid #bfdbfe",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 500
                  }}
                >
                  <strong style={{ fontWeight: 700 }}>{label}</strong>: <span>{f.operator.replace(/_/g, " ")}</span> {valStr ? <em style={{ fontStyle: "normal", background: "#dbeafe", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>{valStr}</em> : null}
                  <button
                    type="button"
                    onClick={() => {
                      const next = filters.filter((_, i) => i !== idx);
                      setFilters(next);
                      setPage(1);
                    }}
                    title="Remove filter"
                    style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: "0 2px", display: "inline-flex", alignItems: "center" }}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => { setFilters([]); setPage(1); }}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── 4. DATA TABLE CARD ── */}
      <div
        className="glass-card"
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Subtle loading indicator line */}
        {(loading || refreshing) && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "linear-gradient(90deg, #0284c7, #38bdf8, #0284c7)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite linear",
              zIndex: 25
            }}
          />
        )}

        {/* Floating loading feedback pill */}
        {loading && records.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "52px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.90)",
              backdropFilter: "blur(4px)",
              color: "#ffffff",
              padding: "7px 18px",
              borderRadius: "24px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 600,
              zIndex: 30,
              pointerEvents: "none"
            }}
          >
            <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
            <span>Fetching latest records...</span>
          </div>
        )}

        {/* Scrollable Container with sticky headers */}
        <div
          style={{
            overflowX: "auto",
            maxHeight: "calc(100vh - 380px)",
            minHeight: "360px",
            opacity: loading && records.length > 0 ? 0.65 : 1,
            transition: "opacity 0.2s ease"
          }}
        >
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "13px" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <tr>
                {/* Sticky Checkbox Column: Left 0 */}
                <th
                  style={{
                    width: "44px",
                    minWidth: "44px",
                    maxWidth: "44px",
                    padding: "10px 12px",
                    borderBottom: "1px solid #e2e8f0",
                    textAlign: "center",
                    position: "sticky",
                    left: 0,
                    background: "#f8fafc",
                    zIndex: 12,
                    boxShadow: "1px 0 0 #e2e8f0"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAllOnPageSelected}
                    onChange={handleSelectAllOnPage}
                    style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#0284c7" }}
                  />
                </th>

                {/* Sticky Appointment ID Column: Left 44px */}
                <th
                  onClick={() => handleSort("PUB_APPT_ID")}
                  style={{
                    minWidth: "155px",
                    padding: "10px 14px",
                    borderBottom: "1px solid #e2e8f0",
                    fontWeight: 700,
                    color: "#334155",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    position: "sticky",
                    left: "44px",
                    background: "#f8fafc",
                    zIndex: 11,
                    boxShadow: "3px 0 6px -2px rgba(0,0,0,0.08)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>Appointment ID</span>
                    {sortField === "PUB_APPT_ID" && (
                      <span style={{ color: "#0284c7", display: "inline-flex" }}>
                        {sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>

                {/* Dynamic Visible Columns */}
                {displayColumns
                  .filter((col) => col.key !== "PUB_APPT_ID")
                  .map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid #e2e8f0",
                        fontWeight: 700,
                        color: "#334155",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        userSelect: "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{col.label}</span>
                        {sortField === col.key && (
                          <span style={{ color: "#0284c7", display: "inline-flex" }}>
                            {sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}

                {/* Actions column */}
                <th style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, color: "#334155", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && records.length === 0 ? (
                // Skeleton loading rows
                Array.from({ length: 8 }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", textAlign: "center", position: "sticky", left: 0, width: "44px", minWidth: "44px", maxWidth: "44px", background: "#fff", zIndex: 4, boxShadow: "1px 0 0 #f1f5f9" }}>
                      <span className="skeleton-box" style={{ width: "16px", height: "16px", display: "inline-block" }} />
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", position: "sticky", left: "44px", minWidth: "155px", background: "#fff", zIndex: 3, boxShadow: "3px 0 6px -2px rgba(0,0,0,0.06)" }}>
                      <span className="skeleton-box" style={{ width: "95px", height: "18px", display: "inline-block" }} />
                    </td>
                    {displayColumns.filter((c) => c.key !== "PUB_APPT_ID").map((col, cIdx) => (
                      <td key={cIdx} style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9" }}>
                        <span className="skeleton-box" style={{ width: `${60 + (cIdx % 4) * 20}px`, height: "16px", display: "inline-block" }} />
                      </td>
                    ))}
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
                      <span className="skeleton-box" style={{ width: "45px", height: "16px", display: "inline-block" }} />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={displayColumns.length + 2} style={{ textAlign: "center", padding: "64px 20px" }}>
                    <div style={{ maxWidth: "380px", margin: "0 auto" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f0f9ff", color: "#0284c7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                        <SearchIcon size={22} />
                      </div>
                      <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
                        No matching records found
                      </h4>
                      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
                        We couldn&apos;t find any records matching your active search or filter criteria.
                      </p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setFilters([]);
                          setSearch("");
                          setQuickFilter("all");
                        }}
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // Table Rows
                records.map((row) => {
                  const isChecked = selectedIds.has(row._id);

                  return (
                    <tr
                      key={row._id}
                      style={{
                        background: isChecked ? "rgba(2, 132, 199, 0.05)" : "transparent",
                        transition: "background 0.12s ease"
                      }}
                      className="table-row-hover"
                    >
                      {/* Sticky Checkbox Cell: Left 0 */}
                      <td
                        style={{
                          width: "44px",
                          minWidth: "44px",
                          maxWidth: "44px",
                          padding: "10px 12px",
                          borderBottom: "1px solid #f1f5f9",
                          textAlign: "center",
                          position: "sticky",
                          left: 0,
                          background: isChecked ? "#f0f9ff" : "#ffffff",
                          zIndex: 4,
                          boxShadow: "1px 0 0 #f1f5f9"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(row._id)}
                          style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#0284c7" }}
                        />
                      </td>

                      {/* Sticky Appointment ID Column: Left 44px */}
                      <td
                        style={{
                          minWidth: "155px",
                          padding: "10px 14px",
                          borderBottom: "1px solid #f1f5f9",
                          fontWeight: 700,
                          color: "#0284c7",
                          whiteSpace: "nowrap",
                          position: "sticky",
                          left: "44px",
                          background: isChecked ? "#f0f9ff" : "#ffffff",
                          zIndex: 3,
                          boxShadow: "3px 0 6px -2px rgba(0,0,0,0.06)"
                        }}
                      >
                        <span
                          onClick={() => setSelectedRecord(row)}
                          style={{ cursor: "pointer", textDecoration: "underline", fontWeight: 700 }}
                          title="Click to view complete details"
                        >
                          {row.PUB_APPT_ID}
                        </span>
                      </td>

                      {/* Dynamic Columns */}
                      {displayColumns
                        .filter((col) => col.key !== "PUB_APPT_ID")
                        .map((col) => {
                          let val = row[col.key];
                          if ((val === undefined || val === null || val === "") && row.customFields) {
                            val = row.customFields[col.key] ??
                                  row.customFields[col.key.replace(/_/g, " ")] ??
                                  row.customFields[col.key.replace(/\s+/g, "_")] ??
                                  row.customFields[col.label] ??
                                  row.customFields[col.label?.toLowerCase()];
                          }

                          // Intelligent fallbacks between Lead and Inspection vehicle data
                          if (val === undefined || val === null || val === "") {
                            if (col.key === "INSP_MAKE") val = row.MAKE_NAME;
                            else if (col.key === "MAKE_NAME") val = row.INSP_MAKE;
                            else if (col.key === "INSP_MODEL") val = row.MODEL_NAME;
                            else if (col.key === "MODEL_NAME") val = row.INSP_MODEL;
                            else if (col.key === "INSP_YEAR") val = row.LEAD_YEAR;
                            else if (col.key === "LEAD_YEAR") val = row.INSP_YEAR;
                            else if (col.key === "INSP_REGION") val = row.APPT_REGION;
                            else if (col.key === "APPT_REGION") val = row.INSP_REGION;
                            else if (col.key === "LATEST_INSPECTION_STORE") val = row.LATEST_STORE_NAME;
                            else if (col.key === "LATEST_STORE_NAME") val = row.LATEST_INSPECTION_STORE;
                            else if (col.key === "ODOMETER_READING" && row.customFields) {
                              val = row.customFields["ODOMETER"] ?? row.customFields["Odometer"] ?? row.customFields["KM"] ?? row.customFields["KM_DRIVEN"];
                            }
                          }

                          // Specialized Renderers
                          if (col.key === "APPT_STATUS" || col.key === "OPS_STATUS") {
                            const badge = getStatusBadgeStyle(val);
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    background: badge.bg,
                                    color: badge.color,
                                    border: `1px solid ${badge.border}`
                                  }}
                                >
                                  {val || "—"}
                                </span>
                              </td>
                            );
                          }

                          if (col.key === "VERIFIED") {
                            const isV = Boolean(val);
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    background: isV ? "#dcfce7" : "#f1f5f9",
                                    color: isV ? "#16a34a" : "#64748b"
                                  }}
                                >
                                  {isV ? "Verified" : "No"}
                                </span>
                              </td>
                            );
                          }

                          if (col.type === "date") {
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", color: "#475569" }}>
                                {val ? new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                              </td>
                            );
                          }

                          if (col.key === "C24QUOTE" || col.key === "C24QUOTE_AT_BOUGHT" || col.key === "LATEST_TP" || col.key === "LATEST_HB") {
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", fontWeight: 600, color: "#0f172a" }}>
                                {val !== undefined && val !== null && val !== "" && !isNaN(Number(val)) ? `₹${Number(val).toLocaleString("en-IN")}` : "—"}
                              </td>
                            );
                          }

                          if (col.key === "ODOMETER_READING") {
                            return (
                              <td key={col.key} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                {val !== undefined && val !== null && val !== "" && !isNaN(Number(val)) ? `${Number(val).toLocaleString("en-IN")} km` : "—"}
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap", color: "#334155" }}>
                              {val !== undefined && val !== null && String(val).trim() !== "" ? String(val) : "—"}
                            </td>
                          );
                        })}

                      {/* Row Action: View Details */}
                      <td style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedRecord(row)}
                          style={{ padding: "3px 8px", fontSize: "11px" }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. SERVER-SIDE PAGINATION FOOTER ── */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            fontSize: "13px",
            color: "#64748b"
          }}
        >
          <div>
            Showing <strong style={{ color: "#0f172a" }}>{records.length > 0 ? (page - 1) * perPage + 1 : 0}</strong>–
            <strong style={{ color: "#0f172a" }}>{Math.min(page * perPage, filteredCount)}</strong> of{" "}
            <strong style={{ color: "#0f172a" }}>{filteredCount.toLocaleString("en-IN")}</strong> records
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Per page selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Rows per page:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            {/* Pagination controls with Lucide icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                title="First Page"
                style={{ padding: "5px 8px", opacity: page <= 1 ? 0.45 : 1, display: "inline-flex", alignItems: "center" }}
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
                style={{ padding: "5px 8px", opacity: page <= 1 ? 0.45 : 1, display: "inline-flex", alignItems: "center", gap: "2px" }}
              >
                <ChevronLeft size={14} />
                <span style={{ fontSize: "11px" }}>Prev</span>
              </button>

              <span style={{ padding: "4px 10px", fontWeight: 700, color: "#0f172a", fontSize: "12px" }}>
                {page} / {totalPages}
              </span>

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
                style={{ padding: "5px 8px", opacity: page >= totalPages ? 0.45 : 1, display: "inline-flex", alignItems: "center", gap: "2px" }}
              >
                <span style={{ fontSize: "11px" }}>Next</span>
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                title="Last Page"
                style={{ padding: "5px 8px", opacity: page >= totalPages ? 0.45 : 1, display: "inline-flex", alignItems: "center" }}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. ROW DETAILS DRAWER ── */}
      {selectedRecord && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(3px)",
            zIndex: 99999,
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              background: "#ffffff",
              height: "100%",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.25s ease-out"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc"
              }}
            >
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Dossier Specification
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "2px 0 0", color: "#0284c7" }}>
                  {selectedRecord.PUB_APPT_ID}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {/* Category Sections */}
              {(() => {
                const emDash = (val) => (val !== undefined && val !== null && val !== "" ? val : "—");
                const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
                const fmtCur = (n) => (n !== undefined && n !== null && n !== "" ? `₹${Number(n).toLocaleString("en-IN")}` : "—");
                const fmtNum = (n) => (n !== undefined && n !== null && n !== "" ? Number(n).toLocaleString("en-IN") : "—");

                const groups = [
                  {
                    title: "Appointment & Lifecycle",
                    fields: [
                      { label: "Appointment ID", val: emDash(selectedRecord.PUB_APPT_ID) },
                      { label: "Lead Date", val: fmtDate(selectedRecord.LEAD_DATE) },
                      { label: "Appointment Status", val: emDash(selectedRecord.APPT_STATUS) },
                      { label: "Verified", val: selectedRecord.VERIFIED ? "Yes" : "No" },
                      { label: "Appointment Region", val: emDash(selectedRecord.APPT_REGION) },
                      { label: "Original Appt Date (OAD)", val: fmtDate(selectedRecord.OAD) },
                      { label: "Customer Appt Date (CAD)", val: fmtDate(selectedRecord.CAD) },
                      { label: "Deal Closed Date (DCD)", val: fmtDate(selectedRecord.DCD) }
                    ]
                  },
                  {
                    title: "Vehicle Information",
                    fields: [
                      { label: "Make", val: emDash(selectedRecord.MAKE_NAME) },
                      { label: "Model", val: emDash(selectedRecord.MODEL_NAME) },
                      { label: "Model Year", val: emDash(selectedRecord.LEAD_YEAR) },
                      { label: "Inspection Make", val: emDash(selectedRecord.INSP_MAKE) },
                      { label: "Inspection Model", val: emDash(selectedRecord.INSP_MODEL) },
                      { label: "Inspection Year", val: emDash(selectedRecord.INSP_YEAR) },
                      { label: "Odometer Reading", val: selectedRecord.ODOMETER_READING ? `${Number(selectedRecord.ODOMETER_READING).toLocaleString("en-IN")} km` : "—" }
                    ]
                  },
                  {
                    title: "Store & Evaluation",
                    fields: [
                      { label: "Latest Store Name", val: emDash(selectedRecord.LATEST_STORE_NAME) },
                      { label: "Latest Store Type", val: emDash(selectedRecord.LATEST_STORE_TYPE) },
                      { label: "Inspection Store", val: emDash(selectedRecord.LATEST_INSPECTION_STORE) },
                      { label: "Inspection Region", val: emDash(selectedRecord.INSP_REGION) },
                      { label: "First Inspection Date", val: fmtDate(selectedRecord.FIRST_INSP_DATE) },
                      { label: "Latest Inspection Date", val: fmtDate(selectedRecord.LATEST_INSP_DATE) },
                      { label: "Inspection Rating", val: emDash(selectedRecord.INSP_RATING) }
                    ]
                  },
                  {
                    title: "Token, Purchase & Quotes",
                    fields: [
                      { label: "Token Date", val: fmtDate(selectedRecord.TOKEN_DATE) },
                      { label: "Stock-in Date", val: fmtDate(selectedRecord.STOCKIN_DATE) },
                      { label: "Auction Date", val: fmtDate(selectedRecord.LATEST_AUCTION_DATE) },
                      { label: "GS Bought", val: emDash(selectedRecord.GS_BOUGHT) },
                      { label: "C24 Quote", val: fmtCur(selectedRecord.C24QUOTE) },
                      { label: "Quote At Bought", val: fmtCur(selectedRecord.C24QUOTE_AT_BOUGHT) },
                      { label: "Latest Target Price (TP)", val: fmtCur(selectedRecord.LATEST_TP) },
                      { label: "Latest Highest Bid (HB)", val: fmtCur(selectedRecord.LATEST_HB) }
                    ]
                  },
                  {
                    title: "Associate & DSA Management",
                    fields: [
                      { label: "Retail Associate Email", val: emDash(selectedRecord.RETAIL_ASSOCIATE_EMAIL) },
                      { label: "PLL Email", val: emDash(selectedRecord.PLL_EMAIL) },
                      { label: "DSA Agent", val: emDash(selectedRecord.DSA_AGENT) },
                      { label: "DSA Name", val: emDash(selectedRecord.DSA_NAME) },
                      { label: "DSA CEP", val: emDash(selectedRecord.DSA_CEP) }
                    ]
                  },
                  {
                    title: "Operational Status & Flags",
                    fields: [
                      { label: "Ops Status", val: emDash(selectedRecord.OPS_STATUS) },
                      { label: "Growth Flag", val: emDash(selectedRecord.GROWTH_FLAG) },
                      { label: "GS Flag", val: emDash(selectedRecord.GSFLAG) },
                      { label: "Reg No Mismatch", val: emDash(selectedRecord.IS_REG_NO_MISMATCH) }
                    ]
                  },
                  {
                    title: "Operational Metrics",
                    fields: [
                      { label: "Appointments Count", val: fmtNum(selectedRecord.APPOINTMENTS) },
                      { label: "Inspections Count", val: fmtNum(selectedRecord.INSPECTIONS) },
                      { label: "Tokens Count", val: fmtNum(selectedRecord.TOKENS) },
                      { label: "Stock-ins Count", val: fmtNum(selectedRecord.STOCKINS) },
                      { label: "Pickups Count", val: fmtNum(selectedRecord.PICKUPS) },
                      { label: "Cancelled Appts", val: fmtNum(selectedRecord.CANCELLED_APPTS) },
                      { label: "Unverified Appts", val: fmtNum(selectedRecord.UNVERIFIED_APPTS) }
                    ]
                  }
                ];

                // Append any extra dynamic custom fields if present
                if (selectedRecord.customFields && typeof selectedRecord.customFields === "object") {
                  const customKeys = Object.keys(selectedRecord.customFields).filter(
                    (k) => selectedRecord.customFields[k] !== undefined && selectedRecord.customFields[k] !== null && selectedRecord.customFields[k] !== ""
                  );
                  if (customKeys.length > 0) {
                    groups.push({
                      title: "Additional Source Fields",
                      fields: customKeys.map((k) => ({
                        label: k.replace(/_/g, " "),
                        val: String(selectedRecord.customFields[k])
                      }))
                    });
                  }
                }

                return groups.map((group, gIdx) => (
                  <div key={gIdx} style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", margin: "0 0 10px", paddingBottom: "4px", borderBottom: "1px solid #e2e8f0" }}>
                      {group.title}
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {group.fields.map((f, fIdx) => (
                        <div key={fIdx} style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>{f.label}</div>
                          <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600, marginTop: "2px", wordBreak: "break-word" }}>
                            {String(f.val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. ADVANCED FILTER MODAL BUILDER ── */}
      {isFilterModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(5px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "920px",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#0284c7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Filter Data</h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Add conditions to narrow down records — all filters work together</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                style={{ background: "#e2e8f0", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter Rules List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px 36px 24px" }}>
              {/* Match Logic & Quick Shortcuts Toolbar */}
              <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px 18px", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>Match Logic:</span>
                    <div style={{ display: "inline-flex", borderRadius: "8px", border: "1px solid #cbd5e1", overflow: "hidden", background: "#fff" }}>
                      <button
                        type="button"
                        onClick={() => setFilterLogic("AND")}
                        style={{ border: "none", padding: "6px 14px", fontSize: "12px", fontWeight: 700, background: filterLogic === "AND" ? "#0284c7" : "#fff", color: filterLogic === "AND" ? "#fff" : "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {filterLogic === "AND" && <Check size={12} />}
                        ALL Conditions (AND)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterLogic("OR")}
                        style={{ border: "none", padding: "6px 14px", fontSize: "12px", fontWeight: 700, background: filterLogic === "OR" ? "#0284c7" : "#fff", color: filterLogic === "OR" ? "#fff" : "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {filterLogic === "OR" && <Check size={12} />}
                        ANY Condition (OR)
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Status & Operational Shortcuts with Lucide Icons */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>Quick Views:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = filters.filter((f) => f.field !== "APPT_STATUS");
                        next.push({ field: "APPT_STATUS", operator: "equals", value: "PURCHASED" });
                        setFilters(next);
                      }}
                      style={{ border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", padding: "4px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <Target size={13} color="#16a34a" />
                      <span>Purchased (13)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = filters.filter((f) => f.field !== "TOKEN_DATE");
                        next.push({ field: "TOKEN_DATE", operator: "is_not_empty", value: "" });
                        setFilters(next);
                      }}
                      style={{ border: "1px solid #fed7aa", background: "#fff7ed", color: "#c2410c", padding: "4px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <Tag size={13} color="#ea580c" />
                      <span>Has Token Date (14)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = filters.filter((f) => f.field !== "LATEST_AUCTION_DATE");
                        next.push({ field: "LATEST_AUCTION_DATE", operator: "is_not_empty", value: "" });
                        setFilters(next);
                      }}
                      style={{ border: "1px solid #e9d5ff", background: "#faf5ff", color: "#7e22ce", padding: "4px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <Gavel size={13} color="#9333ea" />
                      <span>Auctioned (469)</span>
                    </button>
                  </div>
                </div>

                {/* Lead Date Quick Presets */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} />
                    <span>Lead Date:</span>
                  </span>
                  {[
                    { key: "today", label: "Today" },
                    { key: "yesterday", label: "Yesterday" },
                    { key: "last_7_days", label: "Last 7D" },
                    { key: "this_week", label: "This Week" },
                    { key: "this_month", label: "This Month" },
                    { key: "last_month", label: "Last Month" },
                    { key: "this_year", label: "This Year" }
                  ].map((p) => {
                    const isActive = filters.some((f) => f.field === "LEAD_DATE" && f.operator === p.key);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          const next = [...filters];
                          const existingIdx = next.findIndex((f) => f.field === "LEAD_DATE");
                          const newRule = { field: "LEAD_DATE", operator: p.key, value: "", from: "", to: "" };
                          if (existingIdx >= 0) next[existingIdx] = newRule;
                          else next.push(newRule);
                          setFilters(next);
                        }}
                        style={{
                          border: isActive ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
                          background: isActive ? "#0284c7" : "#fff",
                          color: isActive ? "#fff" : "#334155",
                          padding: "3px 10px",
                          borderRadius: "14px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.12s ease"
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditions List Empty State */}
              {filters.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #cbd5e1" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <FilterX size={26} color="#64748b" />
                  </div>
                  <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#334155", fontSize: "14px" }}>No filters applied — displaying all dataset records</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Pick a quick view above or click &quot;Add Filter Condition&quot; below to filter any field</p>
                </div>
              ) : (
                filters.map((flt, idx) => {
                  const colDef = availableColumns.find((c) => c.key === flt.field) || availableColumns[0];
                  const colType = colDef?.type || "text";
                  const hasOptions = colDef?.options && colDef.options.length > 0;

                  return (
                    <div
                      key={idx}
                      style={{
                        marginBottom: "14px",
                        background: "#ffffff",
                        padding: "16px 18px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                      }}
                    >
                      {/* Condition Header Bar */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#0369a1", background: "#f0f9ff", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: "6px", textTransform: "uppercase" }}>
                          <SlidersHorizontal size={11} />
                          Condition #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = filters.filter((_, i) => i !== idx);
                            setFilters(next);
                          }}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                          title="Remove condition"
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>

                      {/* Structured 3-Column Grid for Field, Operator, and Value */}
                      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.25fr 1.65fr", gap: "12px", alignItems: "flex-end" }}>
                        {/* 1. Field Dropdown */}
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                            Field
                          </label>
                          <select
                            value={flt.field}
                            onChange={(e) => {
                              const next = [...filters];
                              next[idx].field = e.target.value;
                              const nextCol = availableColumns.find((c) => c.key === e.target.value);
                              if (nextCol?.type === "number") {
                                next[idx].operator = "equals";
                              } else if (nextCol?.type === "date") {
                                next[idx].operator = "between";
                                const d = getPresetDates("this_month");
                                next[idx].from = d.from;
                                next[idx].to = d.to;
                              } else if (nextCol?.options && nextCol.options.length > 0) {
                                next[idx].operator = "is_any_of";
                              } else {
                                next[idx].operator = "contains";
                              }
                              next[idx].value = "";
                              setFilters(next);
                            }}
                            style={{ width: "100%", height: "38px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#f8fafc", fontWeight: 600, color: "#0f172a" }}
                          >
                            {Array.from(new Set(availableColumns.map((c) => c.category || "General"))).map((cat) => (
                              <optgroup key={cat} label={cat}>
                                {availableColumns
                                  .filter((c) => (c.category || "General") === cat)
                                  .map((col) => (
                                    <option key={col.key} value={col.key}>
                                      {col.label} {col.type === "date" ? "(Date)" : col.type === "number" ? "(Num)" : ""}
                                    </option>
                                  ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        {/* 2. Operator Dropdown */}
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                            Operator
                          </label>
                          <select
                            value={flt.operator}
                            onChange={(e) => {
                              const next = [...filters];
                              next[idx].operator = e.target.value;
                              if (e.target.value === "between" && colType === "date" && !next[idx].from) {
                                const d = getPresetDates("this_month");
                                next[idx].from = d.from;
                                next[idx].to = d.to;
                              }
                              setFilters(next);
                            }}
                            style={{ width: "100%", height: "38px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#ffffff", color: "#0f172a" }}
                          >
                            {colType === "date" ? (
                              <>
                                <optgroup label="Range & Custom">
                                  <option value="between">Custom Date Range (Between)</option>
                                  <option value="equals">Exact Date</option>
                                  <option value="before">On or Before (≤ Date)</option>
                                  <option value="after">On or After (≥ Date)</option>
                                </optgroup>
                                <optgroup label="Calendar Presets">
                                  <option value="today">Today</option>
                                  <option value="yesterday">Yesterday</option>
                                  <option value="last_7_days">Last 7 Days</option>
                                  <option value="last_30_days">Last 30 Days</option>
                                  <option value="this_week">This Week</option>
                                  <option value="last_week">Last Week</option>
                                  <option value="this_month">This Month</option>
                                  <option value="last_month">Last Month</option>
                                  <option value="this_quarter">This Quarter</option>
                                  <option value="this_year">This Year</option>
                                  <option value="last_year">Last Year</option>
                                </optgroup>
                                <optgroup label="Null Checks">
                                  <option value="is_empty">Is Empty (No Date)</option>
                                  <option value="is_not_empty">Is Not Empty (Has Date)</option>
                                </optgroup>
                              </>
                            ) : colType === "number" ? (
                              <>
                                <optgroup label="Comparison">
                                  <option value="equals">Equals (=)</option>
                                  <option value="not_equals">Not Equals (≠)</option>
                                  <option value="greater_than">Greater Than (&gt;)</option>
                                  <option value="greater_than_or_equal">Greater Than or Equal (≥)</option>
                                  <option value="less_than">Less Than (&lt;)</option>
                                  <option value="less_than_or_equal">Less Than or Equal (≤)</option>
                                  <option value="between">Between (Min – Max)</option>
                                </optgroup>
                                <optgroup label="Null Checks">
                                  <option value="is_empty">Is Empty</option>
                                  <option value="is_not_empty">Is Not Empty</option>
                                </optgroup>
                              </>
                            ) : hasOptions ? (
                              <>
                                <optgroup label="Match Selection">
                                  <option value="is_any_of">Is Any Of (Multi-select)</option>
                                  <option value="equals">Exact Match</option>
                                  <option value="not_equals">Does Not Equal</option>
                                  <option value="is_none_of">Exclude (None Of)</option>
                                  <option value="contains">Contains Text</option>
                                </optgroup>
                                <optgroup label="Null Checks">
                                  <option value="is_empty">Is Empty</option>
                                  <option value="is_not_empty">Is Not Empty</option>
                                </optgroup>
                              </>
                            ) : colType === "boolean" ? (
                              <>
                                <option value="yes">Yes / True / Verified</option>
                                <option value="no">No / False / Unverified</option>
                                <option value="is_empty">Is Empty</option>
                                <option value="is_not_empty">Is Not Empty</option>
                              </>
                            ) : (
                              <>
                                <optgroup label="Text Matching">
                                  <option value="contains">Contains</option>
                                  <option value="equals">Exact Match</option>
                                  <option value="not_equals">Not Equals</option>
                                  <option value="does_not_contain">Does Not Contain</option>
                                  <option value="starts_with">Starts With</option>
                                  <option value="ends_with">Ends With</option>
                                </optgroup>
                                <optgroup label="Null Checks">
                                  <option value="is_empty">Is Empty</option>
                                  <option value="is_not_empty">Is Not Empty</option>
                                </optgroup>
                              </>
                            )}
                          </select>
                        </div>

                        {/* 3. Value / Criteria Input Area */}
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                            Value / Criteria
                          </label>
                          {(flt.operator === "between" || flt.operator === "custom_range") && colType === "date" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <input
                                  type="date"
                                  value={flt.from || ""}
                                  onChange={(e) => {
                                    const next = [...filters];
                                    next[idx].from = e.target.value;
                                    setFilters(next);
                                  }}
                                  style={{ flex: 1, height: "38px", padding: "6px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                                />
                                <ArrowRight size={14} color="#94a3b8" />
                                <input
                                  type="date"
                                  value={flt.to || ""}
                                  onChange={(e) => {
                                    const next = [...filters];
                                    next[idx].to = e.target.value;
                                    setFilters(next);
                                  }}
                                  style={{ flex: 1, height: "38px", padding: "6px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                                />
                              </div>
                              {/* Quick populate pills */}
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {[
                                  { k: "today", l: "Today" },
                                  { k: "last_7_days", l: "Last 7D" },
                                  { k: "this_month", l: "This Month" },
                                  { k: "last_month", l: "Last Month" }
                                ].map((btn) => (
                                  <button
                                    key={btn.k}
                                    type="button"
                                    onClick={() => {
                                      const d = getPresetDates(btn.k);
                                      const next = [...filters];
                                      next[idx].from = d.from;
                                      next[idx].to = d.to;
                                      setFilters(next);
                                    }}
                                    style={{ border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "4px", fontSize: "10px", padding: "2px 6px", cursor: "pointer", color: "#475569" }}
                                  >
                                    {btn.l}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (flt.operator === "between" && colType === "number") ? (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <input
                                type="number"
                                placeholder="Min value..."
                                value={flt.from || ""}
                                onChange={(e) => {
                                  const next = [...filters];
                                  next[idx].from = e.target.value;
                                  setFilters(next);
                                }}
                                style={{ flex: 1, height: "38px", padding: "6px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                              />
                              <ArrowRight size={14} color="#94a3b8" />
                              <input
                                type="number"
                                placeholder="Max value..."
                                value={flt.to || ""}
                                onChange={(e) => {
                                  const next = [...filters];
                                  next[idx].to = e.target.value;
                                  setFilters(next);
                                }}
                                style={{ flex: 1, height: "38px", padding: "6px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                              />
                            </div>
                          ) : ["today", "yesterday", "last_7_days", "last_30_days", "this_week", "last_week", "this_month", "last_month", "this_quarter", "this_year", "last_year"].includes(flt.operator) ? (
                            <div style={{ height: "38px", padding: "0 12px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", color: "#0369a1", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "7px" }}>
                              <Calendar size={14} color="#0284c7" />
                              <span>Active: {getPresetRangeDisplay(flt.operator)}</span>
                            </div>
                          ) : (flt.operator === "is_any_of" || flt.operator === "is_none_of") && hasOptions ? (
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", maxHeight: "120px", overflowY: "auto" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>
                                Toggle values:
                              </span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {colDef.options.map((opt) => {
                                  const arr = Array.isArray(flt.value) ? flt.value : (flt.value ? [flt.value] : []);
                                  const isSel = arr.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => {
                                        const next = [...filters];
                                        const nextArr = isSel ? arr.filter((x) => x !== opt) : [...arr, opt];
                                        next[idx].value = nextArr;
                                        setFilters(next);
                                      }}
                                      style={{
                                        border: isSel ? "1px solid #0284c7" : "1px solid #cbd5e1",
                                        background: isSel ? "#0284c7" : "#ffffff",
                                        color: isSel ? "#ffffff" : "#334155",
                                        borderRadius: "12px",
                                        padding: "2px 8px",
                                        fontSize: "11px",
                                        fontWeight: isSel ? 700 : 500,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "3px"
                                      }}
                                    >
                                      {isSel && <Check size={10} />}
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (flt.operator === "equals" || flt.operator === "not_equals") && hasOptions ? (
                            <select
                              value={flt.value || ""}
                              onChange={(e) => {
                                const next = [...filters];
                                next[idx].value = e.target.value;
                                setFilters(next);
                              }}
                              style={{ width: "100%", height: "38px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                            >
                              <option value="">Select Option...</option>
                              {colDef.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (flt.operator === "equals" || flt.operator === "before" || flt.operator === "after") && colType === "date" ? (
                            <input
                              type="date"
                              value={flt.value || ""}
                              onChange={(e) => {
                                const next = [...filters];
                                next[idx].value = e.target.value;
                                setFilters(next);
                              }}
                              style={{ width: "100%", height: "38px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                            />
                          ) : (flt.operator === "is_empty" || flt.operator === "is_not_empty" || flt.operator === "yes" || flt.operator === "no") ? (
                            <div style={{ height: "38px", padding: "0 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#64748b", fontSize: "12px", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                              <CheckCircle2 size={13} color="#94a3b8" />
                              <span>Evaluated automatically</span>
                            </div>
                          ) : (
                            <input
                              type={colType === "number" ? "number" : "text"}
                              placeholder={colType === "number" ? "Enter number..." : "Enter text value..."}
                              value={flt.value || ""}
                              onChange={(e) => {
                                const next = [...filters];
                                next[idx].value = e.target.value;
                                setFilters(next);
                              }}
                              style={{ width: "100%", height: "38px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Add Rule Button & Clear All Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", flexWrap: "wrap", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const defaultCol = availableColumns.find((c) => c.key === "LEAD_DATE")?.key || availableColumns[0]?.key;
                    setFilters([...filters, { field: defaultCol, operator: "this_month", value: "", from: "", to: "" }]);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontWeight: 700, padding: "8px 16px", borderRadius: "8px", border: "1px solid #0284c7", color: "#0284c7", background: "#f0f9ff" }}
                >
                  <Plus size={15} />
                  <span>Add Filter Condition</span>
                </button>

                {filters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters([])}
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "none", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    <Trash2 size={13} />
                    <span>Clear All ({filters.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {filters.length} condition{filters.length === 1 ? "" : "s"} configured ({filterLogic})
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setPage(1);
                    setIsFilterModalOpen(false);
                  }}
                  style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Filter size={14} />
                  <span>Apply Filters ({filters.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. COLUMN VISIBILITY MODAL ── */}
      {isColumnModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setIsColumnModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "620px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ColumnsIcon />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Column Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsColumnModalOpen(false)}
                title="Close"
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>
                Select which columns to display on the table ({visibleColumns.size} visible of {availableColumns.length} available).
              </p>

              {/* Column Search Bar */}
              <div style={{ marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="Search columns..."
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    background: "#f8fafc"
                  }}
                />
              </div>

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const allKeys = new Set(availableColumns.map((c) => c.key));
                    setVisibleColumns(allKeys);
                    localStorage.setItem("data_management_visible_cols", JSON.stringify(Array.from(allKeys)));
                  }}
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                >
                  Select All ({availableColumns.length})
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const minKeys = new Set(["PUB_APPT_ID", "LEAD_DATE"]);
                    setVisibleColumns(minKeys);
                    localStorage.setItem("data_management_visible_cols", JSON.stringify(Array.from(minKeys)));
                  }}
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                >
                  Clear All
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={resetColumnsToDefault}
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                >
                  Reset Default (16)
                </button>
              </div>

              {/* Grouped by Dynamic Category */}
              {Array.from(new Set(availableColumns.map((c) => c.category || "General"))).map((category) => {
                let cols = availableColumns.filter((c) => (c.category || "General") === category);
                if (columnSearch.trim()) {
                  const q = columnSearch.toLowerCase().trim();
                  cols = cols.filter((c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
                }
                if (cols.length === 0) return null;

                const selectedInCat = cols.filter((c) => visibleColumns.has(c.key));

                return (
                  <div key={category} style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h5 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#0284c7", margin: 0 }}>
                        {category} ({selectedInCat.length}/{cols.length})
                      </h5>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {cols.map((col) => {
                        const isChecked = visibleColumns.has(col.key);
                        return (
                          <label
                            key={col.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "13px",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: isChecked ? "#f0f9ff" : "#f8fafc",
                              border: isChecked ? "1px solid #bae6fd" : "1px solid #e2e8f0",
                              cursor: "pointer",
                              userSelect: "none"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleColumnVisibility(col.key)}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ fontWeight: isChecked ? 600 : 400, color: isChecked ? "#0369a1" : "#334155" }}>
                              {col.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={resetColumnsToDefault}
              >
                Reset to Default
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsColumnModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. IMPORT DATA MODAL ── */}
      {isImportModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => !importLoading && setIsImportModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <UploadIcon />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Import Large Dataset (CSV / XLSX)</h3>
              </div>
              <button
                type="button"
                disabled={importLoading}
                onClick={() => setIsImportModalOpen(false)}
                title="Close"
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {!importValidation && !importSummary ? (
                // Step 1: Upload Dropzone
                <div>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    style={{
                      border: "2px dashed #0284c7",
                      borderRadius: "10px",
                      background: "#f0f9ff",
                      padding: "36px 20px",
                      textAlign: "center",
                      cursor: "pointer",
                      marginBottom: "16px"
                    }}
                    onClick={() => document.getElementById("file-input-field")?.click()}
                  >
                    <input
                      id="file-input-field"
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      style={{ display: "none" }}
                      onChange={handleFileDrop}
                    />
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#e0f2fe", color: "#0284c7", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                      <UploadIcon />
                    </div>
                    <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#0369a1", margin: "0 0 8px" }}>
                      Click to browse or drag &amp; drop dataset
                    </h4>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <FileSpreadsheet size={13} /> Excel (.xlsx)
                      </span>
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <FileSpreadsheet size={13} /> Excel (.xls)
                      </span>
                      <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <FileText size={13} /> CSV (.csv)
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                      Supports all Excel workbooks &amp; CSV files up to 50MB (50,000+ records)
                    </p>
                  </div>
                </div>
              ) : importValidation && !importSummary ? (
                // Step 2: Validation Summary & Options
                <div>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
                      <CheckIcon />
                      <span>Spreadsheet Validated Successfully</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#14532d", lineHeight: 1.6 }}>
                      • <strong>{importValidation.totalRows?.toLocaleString("en-IN")}</strong> data rows detected<br />
                      • <strong>{importValidation.columnsCount}</strong> columns detected<br />
                      • Unique ID Column: <strong>{importValidation.idColumn}</strong>
                    </div>
                  </div>

                  {/* Duplicate Handling Option */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "6px" }}>
                      Duplicate Records Policy (by {importValidation.idColumn}):
                    </label>
                    <select
                      value={importDuplicateHandling}
                      onChange={(e) => setImportDuplicateHandling(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                    >
                      <option value="update">Update Existing (Recommended - updates existing match)</option>
                      <option value="skip">Skip Existing (Ignores duplicates, inserts new only)</option>
                      <option value="create">Create New (Assigns a unique suffix)</option>
                    </select>
                  </div>

                  {/* Archive Old Table to History Option */}
                  <div
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px"
                    }}
                  >
                    <input
                      type="checkbox"
                      id="archive-old-table-chk"
                      checked={archiveOldTableOnImport}
                      onChange={(e) => setArchiveOldTableOnImport(e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        marginTop: "2px",
                        cursor: "pointer",
                        accentColor: "#0284c7"
                      }}
                    />
                    <label htmlFor="archive-old-table-chk" style={{ cursor: "pointer", fontSize: "13px", color: "#1e3a8a", margin: 0, lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                        <Clock size={14} style={{ color: "#0284c7" }} />
                        <span>Purani Active Table ko History me save karein (With Date &amp; Time)</span>
                        <span style={{ fontSize: "11px", background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px" }}>Recommended</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#3b82f6", marginTop: "3px" }}>
                        New table import hote hi purani table timestamp ke sath History me archive ho jayegi. Aap use kabhi bhi History me jakar date ke sath dekh ya restore kar sakte hain.
                      </div>
                    </label>
                  </div>

                  {/* Warnings if any */}
                  {importValidation.warnings?.length > 0 && (
                    <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#854d0e", display: "block", marginBottom: "4px" }}>
                        Validation Notices ({importValidation.warnings.length}):
                      </span>
                      <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#713f12" }}>
                        {importValidation.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                // Step 3: Success Summary
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#dcfce7", color: "#15803d", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                    <CheckIcon />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                    Dataset Imported Successfully!
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
                    {importSummary?.totalRows} records were ingested into the operational database.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", maxWidth: "360px", margin: "0 auto 20px" }}>
                    <div style={{ background: "#f0f9ff", padding: "10px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0284c7" }}>{importSummary?.insertedCount}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>New Inserted</div>
                    </div>
                    <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#16a34a" }}>{importSummary?.updatedCount}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Updated</div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#64748b" }}>{importSummary?.skippedCount}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Skipped</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              {importSummary ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Close &amp; View Table
                </button>
              ) : importValidation ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={importLoading}
                    onClick={() => { setImportValidation(null); setImportFile(null); }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={importLoading}
                    onClick={handleExecuteImport}
                  >
                    {importLoading ? "Ingesting Data..." : `Confirm & Import (${importValidation.totalRows} Rows)`}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 10. EXPORT MODAL ── */}
      {isExportModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setIsExportModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Export Dataset</h3>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                title="Close"
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Choose your export scope and format. Active filters and column visibility will be preserved.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleExport("xlsx", "filtered")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "#16a34a", borderColor: "#15803d" }}
              >
                <FileSpreadsheet size={16} />
                <span>Export Filtered Excel (XLSX) ({filteredCount.toLocaleString("en-IN")} records)</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleExport("xlsx", "all")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px" }}
              >
                <FileSpreadsheet size={16} />
                <span>Export Entire Dataset Excel (XLSX) ({totalRecords.toLocaleString("en-IN")} records)</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleExport("csv", "filtered")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px" }}
              >
                <FileCsvIcon />
                <span>Export Filtered CSV ({filteredCount.toLocaleString("en-IN")} records)</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleExport("csv", "all")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px" }}
              >
                <FileCsvIcon />
                <span>Export Entire Dataset CSV ({totalRecords.toLocaleString("en-IN")} records)</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleExport("pdf", "filtered")}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px" }}
              >
                <FilePdfIcon />
                <span>Export Filtered PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 11. SAVED VIEWS MODAL ── */}
      {isSavedViewsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setIsSavedViewsOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "80vh",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookmarkIcon />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Saved Filter Views</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedViewsOpen(false)}
                title="Close"
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {/* Save current view */}
              <div style={{ marginBottom: "20px", padding: "14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                  Save Current Filter Combination:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="e.g. Jaipur Completed Appts..."
                    style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!newViewName.trim()}
                    onClick={handleSaveCurrentView}
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Existing views */}
              <h5 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", margin: "0 0 10px" }}>
                Saved Presets ({savedViews.length})
              </h5>

              {savedViews.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>
                  No saved views yet. Configure filters and save them above.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {savedViews.map((v) => (
                    <div
                      key={v._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{v.name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {v.filters?.length || 0} filters • {v.logic || "AND"} • {v.visibleColumns?.length || 0} columns
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApplySavedView(v)}
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDeleteSavedView(v._id)}
                          title="Delete view"
                          style={{ padding: "4px 8px", color: "#ef4444", display: "flex", alignItems: "center" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 12. IMPORTED TABLES HISTORY MODAL ── */}
      {isHistoryModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(3px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setIsHistoryModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "920px",
              background: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "88vh",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    Table Import History (Purani Tables ka Itihas)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                    Purani tables date aur time ke sath history me archived hain. Aap kisi bhi snapshot ko view ya restore kar sakte hain.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                title="Close"
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
              {historyLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
                  <p style={{ margin: 0, fontSize: "13px" }}>Loading table history...</p>
                </div>
              ) : historyBatches.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  <Archive size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#334155", margin: "0 0 6px" }}>
                    No Table History Available
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    Nayi spreadsheet import karne par purani table automatically history me save ho jayegi.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {historyBatches.map((batch) => {
                    const isActive = batch.isCurrentActive === true;
                    const isCurrentlyViewing = selectedHistoryBatch?._id === batch._id;

                    return (
                      <div
                        key={batch._id}
                        style={{
                          border: isCurrentlyViewing ? "2px solid #f59e0b" : isActive ? "1.5px solid #86efac" : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          background: isCurrentlyViewing ? "#fffbeb" : isActive ? "#f0fdf4" : "#ffffff",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "12px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "260px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                              {batch.fileName || "Imported Dataset"}
                            </span>
                            {isActive ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />
                                Current Active Table
                              </span>
                            ) : (
                              <span style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
                                Archived in History
                              </span>
                            )}
                            {isCurrentlyViewing && (
                              <span style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                                Currently Viewing
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#64748b" }}>
                            <span>
                              Import Date: <strong style={{ color: "#334155" }}>{formatDateTime(batch.createdAt)}</strong>
                            </span>
                            {batch.archivedAt && (
                              <span>
                                Archived Date: <strong style={{ color: "#334155" }}>{formatDateTime(batch.archivedAt)}</strong>
                              </span>
                            )}
                            <span>
                              Rows: <strong style={{ color: "#334155" }}>{(batch.totalRows || 0).toLocaleString("en-IN")}</strong>
                            </span>
                            {batch.performedByName && (
                              <span>
                                By: <strong style={{ color: "#334155" }}>{batch.performedByName}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {isActive && !isCurrentlyViewing ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedHistoryBatch(null);
                                setIsHistoryModalOpen(false);
                              }}
                              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                            >
                              <Eye size={13} />
                              <span>View Active</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setSelectedHistoryBatch(batch);
                                setIsHistoryModalOpen(false);
                              }}
                              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                              title="View this historical table"
                            >
                              <Eye size={13} />
                              <span>View Snapshot</span>
                            </button>
                          )}

                          {!isActive && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleRestoreBatch(batch)}
                              style={{
                                background: "#16a34a",
                                color: "#ffffff",
                                border: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 600
                              }}
                              title="Is table ko wapas current active table banayein"
                            >
                              <RotateCcw size={13} />
                              <span>Restore to Active</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownloadBatchCSV(batch)}
                            title="Download snapshot CSV"
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 8px" }}
                          >
                            <Download size={13} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDeleteBatch(batch)}
                            title="Delete this historical snapshot"
                            style={{ padding: "6px 8px", color: "#ef4444" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "12px 22px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Total History Batches: <strong>{historyBatches.length}</strong>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
