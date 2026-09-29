"use client";
import { useState, useEffect, useRef, useMemo } from "react";

// Clean UI Icons
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MINUTES_LIST = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const HOURS_12 = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];

export const CustomDateTimePicker = ({
  value = "",
  onChange,
  mode = "datetime", // "date" | "datetime"
  placeholder,
  disabled = false,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date from value or fallback to current
  const parsed = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const now = useMemo(() => new Date(), []);

  // View state for the calendar
  const [viewYear, setViewYear] = useState(() => (parsed ? parsed.getFullYear() : now.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (parsed ? parsed.getMonth() : now.getMonth()));

  // Time selections
  const [selectedHour12, setSelectedHour12] = useState(() => {
    if (!parsed) return "10";
    const h = parsed.getHours();
    const h12 = h % 12 || 12;
    return String(h12).padStart(2, "0");
  });

  const [selectedMinute, setSelectedMinute] = useState(() => {
    if (!parsed) return "00";
    const m = parsed.getMinutes();
    const rounded = Math.round(m / 5) * 5;
    const clamped = rounded >= 60 ? 55 : rounded;
    return String(clamped).padStart(2, "0");
  });

  const [ampm, setAmpm] = useState(() => {
    if (!parsed) return "AM";
    return parsed.getHours() >= 12 ? "PM" : "AM";
  });

  // Sync internal view when value changes from outside
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      const h = parsed.getHours();
      const h12 = h % 12 || 12;
      setSelectedHour12(String(h12).padStart(2, "0"));
      const m = parsed.getMinutes();
      const rounded = Math.round(m / 5) * 5;
      const clamped = rounded >= 60 ? 55 : rounded;
      setSelectedMinute(String(clamped).padStart(2, "0"));
      setAmpm(h >= 12 ? "PM" : "AM");
    }
  }, [parsed]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Calendar dates matrix
  const daysMatrix = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        month: viewMonth - 1,
        year: viewYear,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      cells.push({
        day: i,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true
      });
    }

    // Next month days to fill 42 cells (6 rows)
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        month: viewMonth + 1,
        year: viewYear,
        isCurrentMonth: false
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const constructISOString = (targetDate, hour12Str, minStr, ampmStr) => {
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");

    if (mode === "date") {
      return `${year}-${month}-${day}`;
    }

    let h = parseInt(hour12Str, 10);
    if (ampmStr === "PM" && h < 12) h += 12;
    if (ampmStr === "AM" && h === 12) h = 0;
    const h24 = String(h).padStart(2, "0");

    return `${year}-${month}-${day}T${h24}:${minStr}`;
  };

  const handleSelectDay = (cell) => {
    const target = new Date(cell.year, cell.month, cell.day);
    const iso = constructISOString(target, selectedHour12, selectedMinute, ampm);
    if (onChange) onChange(iso);
    if (mode === "date") {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newHour12, newMin, newAmpm) => {
    setSelectedHour12(newHour12);
    setSelectedMinute(newMin);
    setAmpm(newAmpm);

    const baseDate = parsed || new Date();
    const iso = constructISOString(baseDate, newHour12, newMin, newAmpm);
    if (onChange) onChange(iso);
  };

  const handleSetToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());

    const h = today.getHours();
    const h12 = h % 12 || 12;
    const hStr = String(h12).padStart(2, "0");
    const m = today.getMinutes();
    const rounded = Math.round(m / 5) * 5;
    const mStr = String(rounded >= 60 ? 55 : rounded).padStart(2, "0");
    const aStr = h >= 12 ? "PM" : "AM";

    setSelectedHour12(hStr);
    setSelectedMinute(mStr);
    setAmpm(aStr);

    const iso = constructISOString(today, hStr, mStr, aStr);
    if (onChange) onChange(iso);
    if (mode === "date") setIsOpen(false);
  };

  const handleClear = () => {
    if (onChange) onChange("");
    setIsOpen(false);
  };

  // Formatted display text
  const displayText = useMemo(() => {
    if (!parsed) return "";
    if (mode === "date") {
      return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }, [parsed, mode]);

  return (
    <div className="custom-datetime-container" ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger Input Display */}
      <div
        className={`custom-picker-trigger ${isOpen ? "active" : ""} ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "8px 12px",
          borderRadius: "8px",
          border: isOpen ? "1px solid #0284c7" : "1px solid #cbd5e1",
          boxShadow: isOpen ? "0 0 0 3px rgba(2, 132, 199, 0.15)" : "none",
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          fontSize: "13.5px",
          color: displayText ? "#0f172a" : "#94a3b8",
          userSelect: "none"
        }}
      >
        <span style={{ color: "#0284c7", display: "flex", alignItems: "center", marginRight: "10px" }}>
          {mode === "datetime" ? <ClockIcon /> : <CalendarIcon />}
        </span>

        <span style={{ flex: 1, fontWeight: displayText ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayText || placeholder || (mode === "datetime" ? "Select date & time" : "Select date")}
        </span>

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              marginRight: "6px"
            }}
            title="Clear date"
          >
            <CloseIcon />
          </button>
        )}

        <span style={{ color: "#64748b", display: "flex", alignItems: "center", pointerEvents: "none" }}>
          <CalendarIcon />
        </span>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className="custom-picker-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 99999,
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 14px 35px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08)",
            padding: "16px",
            width: mode === "datetime" ? "520px" : "320px",
            maxWidth: "95vw",
            display: "flex",
            flexDirection: "column",
            animation: "pickerFadeIn 0.18s ease-out"
          }}
        >
          <div style={{ display: "flex", gap: "16px", flexWrap: mode === "datetime" ? "nowrap" : "wrap" }}>
            {/* Left Side: Calendar Month View */}
            <div style={{ flex: 1, minWidth: "280px" }}>
              {/* Calendar Month Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>

                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: "6px",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#475569"
                    }}
                    title="Previous month"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: "6px",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#475569"
                    }}
                    title="Next month"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "6px" }}>
                {DAY_NAMES.map((d) => (
                  <span key={d} style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", padding: "4px 0" }}>
                    {d}
                  </span>
                ))}
              </div>

              {/* Dates Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                {daysMatrix.map((cell, idx) => {
                  const isSelected =
                    parsed &&
                    parsed.getDate() === cell.day &&
                    parsed.getMonth() === cell.month &&
                    parsed.getFullYear() === cell.year;

                  const isToday =
                    now.getDate() === cell.day &&
                    now.getMonth() === cell.month &&
                    now.getFullYear() === cell.year;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDay(cell)}
                      style={{
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        border: isSelected ? "none" : isToday ? "1px solid #0284c7" : "none",
                        backgroundColor: isSelected ? "#0284c7" : "transparent",
                        color: isSelected
                          ? "#ffffff"
                          : cell.isCurrentMonth
                          ? "#1e293b"
                          : "#cbd5e1",
                        fontSize: "12.5px",
                        fontWeight: isSelected ? 700 : cell.isCurrentMonth ? 500 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "#f0f9ff";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Modern Time Picker (Only for datetime mode) */}
            {mode === "datetime" && (
              <div
                style={{
                  width: "180px",
                  borderLeft: "1px solid #e2e8f0",
                  paddingLeft: "16px",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                    Time
                  </span>

                  {/* AM / PM Toggle Pills */}
                  <div style={{ display: "flex", backgroundColor: "#f1f5f9", borderRadius: "6px", padding: "2px" }}>
                    <button
                      type="button"
                      onClick={() => handleTimeChange(selectedHour12, selectedMinute, "AM")}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        backgroundColor: ampm === "AM" ? "#0284c7" : "transparent",
                        color: ampm === "AM" ? "#ffffff" : "#64748b"
                      }}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTimeChange(selectedHour12, selectedMinute, "PM")}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        backgroundColor: ampm === "PM" ? "#0284c7" : "transparent",
                        color: ampm === "PM" ? "#ffffff" : "#64748b"
                      }}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* Hour and Minute Scroll Columns */}
                <div style={{ display: "flex", gap: "8px", flex: 1, minHeight: "180px" }}>
                  {/* Hours List */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textAlign: "center", marginBottom: "4px" }}>
                      Hour
                    </span>
                    <div
                      style={{
                        overflowY: "auto",
                        maxHeight: "170px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        paddingRight: "2px"
                      }}
                    >
                      {HOURS_12.map((h) => {
                        const isHSelected = selectedHour12 === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => handleTimeChange(h, selectedMinute, ampm)}
                            style={{
                              padding: "4px 0",
                              fontSize: "12px",
                              fontWeight: isHSelected ? 700 : 500,
                              borderRadius: "6px",
                              border: "none",
                              backgroundColor: isHSelected ? "#0284c7" : "transparent",
                              color: isHSelected ? "#ffffff" : "#1e293b",
                              cursor: "pointer"
                            }}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Minute List */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textAlign: "center", marginBottom: "4px" }}>
                      Min
                    </span>
                    <div
                      style={{
                        overflowY: "auto",
                        maxHeight: "170px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        paddingRight: "2px"
                      }}
                    >
                      {MINUTES_LIST.map((m) => {
                        const isMSelected = selectedMinute === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleTimeChange(selectedHour12, m, ampm)}
                            style={{
                              padding: "4px 0",
                              fontSize: "12px",
                              fontWeight: isMSelected ? 700 : 500,
                              borderRadius: "6px",
                              border: "none",
                              backgroundColor: isMSelected ? "#0284c7" : "transparent",
                              color: isMSelected ? "#ffffff" : "#1e293b",
                              cursor: "pointer"
                            }}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #f1f5f9",
              paddingTop: "12px",
              marginTop: "14px"
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "4px"
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSetToday}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0284c7",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "4px"
                }}
              >
                {mode === "datetime" ? "Now" : "Today"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-primary"
              style={{
                padding: "4px 14px",
                fontSize: "12px",
                borderRadius: "6px"
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateTimePicker;
