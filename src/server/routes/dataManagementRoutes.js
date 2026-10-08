import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getDataManagementRecords,
  getDataManagementColumns,
  validateDataImport,
  importDataManagementRecords,
  getDataManagementImportHistory,
  getDataManagementRecordById,
  updateDataManagementRecord,
  deleteDataManagementRecord,
  bulkDeleteDataManagementRecords,
  exportDataManagementCSV,
  exportDataManagementXLSX,
  exportDataManagementPDF,
  getSavedViews,
  createSavedView,
  deleteSavedView
} from "../controllers/dataManagementController.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", getDataManagementRecords);
router.get("/columns", getDataManagementColumns);
router.post("/validate-import", validateDataImport);
router.post("/import", importDataManagementRecords);
router.get("/import-history", getDataManagementImportHistory);

router.post("/export/csv", exportDataManagementCSV);
router.post("/export/xlsx", exportDataManagementXLSX);
router.post("/export/pdf", exportDataManagementPDF);

router.get("/views", getSavedViews);
router.post("/views", createSavedView);
router.delete("/views/:id", deleteSavedView);

router.post("/bulk-delete", bulkDeleteDataManagementRecords);

router.get("/:id", getDataManagementRecordById);
router.put("/:id", updateDataManagementRecord);
router.delete("/:id", deleteDataManagementRecord);

export default router;
