"use client";
import { useState, useRef } from "react";
import { parseCsv, downloadCsvTemplate } from "../utils/csvHelper";

const UploadCloudIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function CsvImportModal({
  isOpen,
  onClose,
  title = "Import Records from CSV",
  description = "Upload a CSV file containing your data. Download the sample template to ensure your columns match.",
  templateFilename = "sample_template.csv",
  templateHeaders = [],
  templateSampleRows = [],
  requiredHeaders = [],
  onImport
}) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setErrorMsg("");
    setWarningMsg("");
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadCsvTemplate(templateFilename, templateHeaders, templateSampleRows);
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv") && !selectedFile.type.includes("csv") && !selectedFile.type.includes("text")) {
      setErrorMsg("Please upload a valid .csv file.");
      return;
    }

    setErrorMsg("");
    setWarningMsg("");
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const result = parseCsv(text);

        if (!result.headers || result.headers.length === 0 || !result.rows || result.rows.length === 0) {
          setErrorMsg("The selected CSV file appears to be empty or contains only headers.");
          setParsedData(null);
          return;
        }

        // Validate required headers (case-insensitive)
        if (requiredHeaders && requiredHeaders.length > 0) {
          const headerLowerMap = result.headers.map((h) => h.toLowerCase().trim());
          const missing = requiredHeaders.filter(
            (req) => !headerLowerMap.includes(req.toLowerCase().trim())
          );
          if (missing.length > 0) {
            setWarningMsg(`Notice: Missing recommended column(s): ${missing.join(", ")}. These will be filled with default values.`);
          }
        }

        setParsedData(result);
      } catch (err) {
        setErrorMsg("Failed to parse CSV file: " + (err.message || "Invalid formatting"));
        setParsedData(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the file. Please try again.");
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleConfirmImport = async () => {
    if (!parsedData || !parsedData.rows || parsedData.rows.length === 0) {
      setErrorMsg("No valid data rows found to import.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (onImport) {
        await onImport(parsedData.rows, parsedData.headers);
      }
      handleClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to import CSV data.");
    } finally {
      setLoading(false);
    }
  };

  const previewRows = parsedData?.rows?.slice(0, 5) || [];

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "760px",
          width: "92%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "14px",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.25)",
          overflow: "hidden"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--card-bg, #ffffff)"
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "600", color: "var(--text-main, #0f172a)" }}>
              {title}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "var(--text-muted, #64748b)" }}>
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted, #64748b)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            disabled={loading}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Template Download Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: "8px",
              background: "var(--bg-subtle, #f8fafc)",
              border: "1px solid var(--border, #e2e8f0)",
              marginBottom: "18px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  background: "rgba(37,99,235,0.08)",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <FileTextIcon />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main, #0f172a)" }}>
                  Need the standard format?
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted, #64748b)" }}>
                  Download the sample template with expected headers and sample values.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadTemplate}
              style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", gap: "6px", alignItems: "center" }}
            >
              <DownloadIcon />
              Download Template
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragOver ? "var(--primary, #2563eb)" : "var(--border, #cbd5e1)"}`,
              borderRadius: "10px",
              padding: "32px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: isDragOver ? "rgba(37,99,235,0.04)" : "var(--card-bg, #ffffff)",
              transition: "all 0.2s ease",
              marginBottom: "16px"
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(37,99,235,0.1)",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px"
              }}
            >
              <UploadCloudIcon />
            </div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main, #0f172a)", marginBottom: "4px" }}>
              {file ? file.name : "Click to upload or drag & drop CSV file here"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
              {file
                ? `${(file.size / 1024).toFixed(1)} KB — Click to choose a different file`
                : "Supports UTF-8 encoded .csv files up to 10MB"}
            </div>
          </div>

          {/* Warning Message */}
          {warningMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#fef9c3",
                color: "#854d0e",
                border: "1px solid #fde047",
                fontSize: "12px",
                marginBottom: "14px"
              }}
            >
              <AlertIcon />
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                fontSize: "12px",
                marginBottom: "14px"
              }}
            >
              <AlertIcon />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Section */}
          {parsedData && (
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckIcon />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main, #0f172a)" }}>
                    Ready to import: {parsedData.rows.length} row{parsedData.rows.length === 1 ? "" : "s"}
                  </span>
                </div>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted, #64748b)" }}>
                  Showing first {Math.min(5, parsedData.rows.length)} rows preview
                </span>
              </div>

              {/* Scrollable Preview Table */}
              <div
                style={{
                  border: "1px solid var(--border, #e2e8f0)",
                  borderRadius: "8px",
                  overflowX: "auto",
                  maxHeight: "220px",
                  background: "var(--card-bg, #ffffff)"
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-subtle, #f8fafc)", borderBottom: "1px solid var(--border, #e2e8f0)" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-muted, #64748b)", fontWeight: "600" }}>#</th>
                      {parsedData.headers.map((h, idx) => (
                        <th
                          key={idx}
                          style={{
                            padding: "8px 10px",
                            textAlign: "left",
                            color: "var(--text-muted, #64748b)",
                            fontWeight: "600",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        style={{
                          borderBottom: rowIdx < previewRows.length - 1 ? "1px solid var(--border, #f1f5f9)" : "none"
                        }}
                      >
                        <td style={{ padding: "7px 10px", color: "var(--text-muted, #94a3b8)", fontWeight: "500" }}>
                          {rowIdx + 1}
                        </td>
                        {parsedData.headers.map((h, colIdx) => (
                          <td
                            key={colIdx}
                            style={{
                              padding: "7px 10px",
                              color: "var(--text-main, #1e293b)",
                              whiteSpace: "nowrap",
                              maxWidth: "180px",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            {row[h] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border, #e2e8f0)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            background: "var(--bg-subtle, #f8fafc)"
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
            style={{ padding: "8px 16px", fontSize: "13px" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmImport}
            disabled={loading || !parsedData || parsedData.rows.length === 0}
            style={{
              padding: "8px 20px",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    border: "2px solid #ffffff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite"
                  }}
                />
                Importing...
              </>
            ) : (
              <>
                Confirm &amp; Import {parsedData?.rows?.length ? `(${parsedData.rows.length})` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
