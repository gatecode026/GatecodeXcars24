"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

const AlertTriangleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TrashIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "info"
  loading = false,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onCancel]);

  if (!isOpen || typeof document === "undefined") return null;

  const isDanger = variant === "danger";

  return createPortal(
    <div
      className="confirm-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
        animation: "confirmFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      onClick={onCancel}
    >
      <div
        className="confirm-modal-card"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-card, #ffffff)",
          color: "var(--text-primary, #0f172a)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          padding: "24px",
          position: "relative",
          animation: "confirmScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted, #94a3b8)",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#0f172a";
            e.currentTarget.style.background = "#f1f5f9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted, #94a3b8)";
            e.currentTarget.style.background = "transparent";
          }}
          title="Close dialog"
        >
          <CloseIcon />
        </button>

        {/* Header Icon + Title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isDanger ? "#fee2e2" : "#fef3c7",
              color: isDanger ? "#dc2626" : "#d97706",
              boxShadow: isDanger ? "0 0 0 4px #fef2f2" : "0 0 0 4px #fffbeb"
            }}
          >
            {isDanger ? <TrashIcon /> : <AlertTriangleIcon />}
          </div>

          <div style={{ paddingRight: "20px" }}>
            <h3
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--text-heading, #0f172a)",
                margin: "0 0 6px 0",
                lineHeight: 1.3
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "13.5px",
                color: "var(--text-muted, #64748b)",
                margin: 0,
                lineHeight: 1.5
              }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-color, #f1f5f9)"
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            style={{
              padding: "9px 18px",
              fontSize: "13.5px",
              fontWeight: 600,
              borderRadius: "8px",
              cursor: "pointer",
              border: "1px solid var(--border-color, #e2e8f0)",
              background: "var(--bg-secondary, #f8fafc)",
              color: "var(--text-primary, #334155)"
            }}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            style={{
              padding: "9px 20px",
              fontSize: "13.5px",
              fontWeight: 600,
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              border: "none",
              background: isDanger
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#ffffff",
              boxShadow: isDanger
                ? "0 4px 12px rgba(239, 68, 68, 0.3)"
                : "0 4px 12px rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "transform 0.15s ease, opacity 0.15s ease",
              opacity: loading ? 0.7 : 1
            }}
            onClick={onConfirm}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid #ffffff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.6s linear infinite"
                  }}
                />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isDanger && <TrashIcon />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
