import { useEffect } from "react";

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <span className="toast-icon">
        {type === "success" ? (
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        )}
      </span>
      <span className="toast-text">{message}</span>
    </div>
  );
};

export default Toast;
