"use client";

import React from "react";

// INR Currency Formatter (Indian Numbering System)
export const formatINR = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "₹0";
  return (
    "₹" +
    Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  );
};

// Percentage Formatter
export const formatPct = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0.0%";
  return `${Number(value).toFixed(1)}%`;
};

// Month Names
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Status badge styling helper
export const getStatusBadge = (status) => {
  const s = String(status || "").trim();
  switch (s) {
    case "Target Exceeded":
      return {
        bg: "rgba(16, 185, 129, 0.12)",
        color: "#059669",
        border: "rgba(16, 185, 129, 0.3)",
        label: "Target Exceeded"
      };
    case "Target Met":
      return {
        bg: "rgba(2, 132, 199, 0.12)",
        color: "#0284c7",
        border: "rgba(2, 132, 199, 0.3)",
        label: "Target Met"
      };
    case "In Progress":
      return {
        bg: "rgba(99, 102, 241, 0.12)",
        color: "#6366f1",
        border: "rgba(99, 102, 241, 0.3)",
        label: "In Progress"
      };
    case "Target Missed":
    case "Target Pending":
      return {
        bg: "rgba(239, 68, 68, 0.12)",
        color: "#dc2626",
        border: "rgba(239, 68, 68, 0.3)",
        label: s
      };
    case "Sunday":
    case "Holiday":
    case "Non-Working Day":
      return {
        bg: "rgba(148, 163, 184, 0.12)",
        color: "#64748b",
        border: "rgba(148, 163, 184, 0.3)",
        label: s
      };
    default:
      return {
        bg: "rgba(241, 245, 249, 0.8)",
        color: "#475569",
        border: "rgba(203, 213, 225, 0.6)",
        label: s || "Pending"
      };
  }
};
