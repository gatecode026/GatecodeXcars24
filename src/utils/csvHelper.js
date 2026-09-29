/**
 * Robust CSV utilities for parsing, template generation, and exporting
 */

/**
 * Parses raw CSV text into headers and an array of row objects
 * Handles quoted cells with commas, double-quote escaping, and mixed newlines.
 * 
 * @param {string} text - Raw CSV string
 * @returns {{ headers: string[], rows: Record<string, string>[], rawRows: string[][] }}
 */
export function parseCsv(text) {
  if (!text || typeof text !== "string") {
    return { headers: [], rows: [], rawRows: [] };
  }

  // Remove UTF-8 BOM if present
  let cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

  const lines = [];
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i++; // skip next quote
        } else {
          // End of quoted cell
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // skip \n
        }
        currentRow.push(currentCell.trim());
        lines.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        lines.push(currentRow);
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  // Push the final cell and row if not empty
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    lines.push(currentRow);
  }

  // Filter out completely empty lines
  const validLines = lines.filter(
    (row) => row.length > 0 && row.some((c) => c && c.trim().length > 0)
  );

  if (validLines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  const rawHeaders = validLines[0].map((h) => (h || "").trim());
  const rawRows = validLines.slice(1);

  const rows = rawRows.map((row) => {
    const obj = {};
    rawHeaders.forEach((header, idx) => {
      obj[header] = (row[idx] !== undefined ? row[idx] : "").trim();
    });
    return obj;
  });

  return {
    headers: rawHeaders,
    rows,
    rawRows
  };
}

/**
 * Escapes a cell value for RFC-compliant CSV
 */
export function escapeCsvCell(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Converts headers and row data into a CSV string
 */
export function buildCsvString(headers, rows) {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map((row) => {
    if (Array.isArray(row)) {
      return row.map(escapeCsvCell).join(",");
    }
    return headers.map((h) => escapeCsvCell(row[h] ?? "")).join(",");
  });
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Triggers a browser download of a CSV file
 */
export function downloadCsvFile(filename, csvContent) {
  if (typeof window === "undefined") return;
  // Prepend UTF-8 BOM so Excel opens it with proper character encoding
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convenience helper to download a pre-formatted template
 */
export function downloadCsvTemplate(filename, headers, sampleRows = []) {
  const content = buildCsvString(headers, sampleRows);
  downloadCsvFile(filename, content);
}

/**
 * Convenience helper to export any dataset to CSV
 */
export function exportTableToCsv(filename, headers, rows) {
  const content = buildCsvString(headers, rows);
  downloadCsvFile(filename, content);
}

