/**
 * Dynamic PDF Loader Utility
 * Dynamically imports jsPDF and jspdf-autotable on demand so initial page load
 * and navigation bundle sizes are not weighed down by ~1MB of PDF generation code.
 */
export const getPdfDoc = async (options = { orientation: "portrait", unit: "mm", format: "a4" }) => {
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default || autoTableModule;
  const doc = new jsPDF(options);
  return { doc, autoTable, jsPDF };
};
