// dataManagementController.js
import { ensureDB } from "../config/db.js";
import { DataManagementRecord } from "../models/DataManagementRecord.js";
import { DataManagementImportHistory } from "../models/DataManagementImportHistory.js";
import { DataManagementView } from "../models/DataManagementView.js";
import { ActivityLog } from "../models/ActivityLog.js";
import {
  DATA_MANAGEMENT_COLUMNS,
  buildMongoQuery,
  buildMongoSort
} from "../services/dataManagementQueryService.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── 1. GET RECORDS (PAGINATED & FILTERED) ──────────────────────────────────
export const getDataManagementRecords = async (req, res) => {
  try {
    await ensureDB();

    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const perPage = Math.min(200, Math.max(5, parseInt(req.query.perPage || 50, 10)));
    const search = req.query.search || "";
    const logic = req.query.logic || "AND";
    const statusQuickFilter = req.query.statusQuickFilter || "";

    let filters = [];
    if (req.query.filters) {
      try {
        filters = typeof req.query.filters === "string" ? JSON.parse(req.query.filters) : req.query.filters;
      } catch (_) {
        filters = [];
      }
    }

    let sort = {};
    if (req.query.sort) {
      try {
        sort = typeof req.query.sort === "string" ? JSON.parse(req.query.sort) : req.query.sort;
      } catch (_) {
        sort = {};
      }
    }

    const query = buildMongoQuery({ search, filters, logic, statusQuickFilter });
    const sortObj = buildMongoSort(sort);

    const [totalRecords, filteredRecords, records] = await Promise.all([
      DataManagementRecord.countDocuments({ isDeleted: false }),
      DataManagementRecord.countDocuments(query),
      DataManagementRecord.find(query)
        .sort(sortObj)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page,
        perPage,
        total: totalRecords,
        filtered: filteredRecords,
        totalPages: Math.ceil(filteredRecords / perPage) || 1
      },
      columns: DATA_MANAGEMENT_COLUMNS
    });
  } catch (error) {
    console.error("getDataManagementRecords error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve data management records: " + error.message
    });
  }
};

// ─── 2. GET COLUMNS & DISTINCT FILTER OPTIONS ───────────────────────────────
export const getDataManagementColumns = async (req, res) => {
  try {
    await ensureDB();

    // Fetch distinct values for key filter dropdowns from actual database
    const [statusList, regionList, makeList, inspMakeList, opsStatusList, growthList, dsaList, storeList] = await Promise.all([
      DataManagementRecord.distinct("APPT_STATUS", { isDeleted: false }).catch(() => []),
      DataManagementRecord.distinct("APPT_REGION", { isDeleted: false }).catch(() => []),
      DataManagementRecord.distinct("MAKE_NAME", { isDeleted: false }).catch(() => []),
      DataManagementRecord.distinct("INSP_MAKE", { isDeleted: false }).catch(() => []),
      DataManagementRecord.distinct("OPS_STATUS", { isDeleted: false }).catch(() => []),
      DataManagementRecord.distinct("GROWTH_FLAG", { isDeleted: false }).catch(() => []),
      DataManagementRecord.distinct("DSA_NAME", { isDeleted: false }).catch(() => []),
      DataManagementRecord.distinct("LATEST_STORE_NAME", { isDeleted: false }).catch(() => [])
    ]);

    // Discover any dynamic custom fields present across documents
    const sampleDocs = await DataManagementRecord.find({ customFields: { $exists: true, $ne: {} } })
      .select("customFields")
      .limit(100)
      .lean();
    
    const customFieldKeys = new Set();
    sampleDocs.forEach((d) => {
      if (d.customFields) {
        Object.keys(d.customFields).forEach((k) => {
          if (k !== "__EMPTY" && !k.startsWith("__EMPTY") && !DATA_MANAGEMENT_COLUMNS.some((c) => c.key === k)) {
            customFieldKeys.add(k);
          }
        });
      }
    });

    const enrichedColumns = DATA_MANAGEMENT_COLUMNS.map((col) => {
      const copy = { ...col };
      if (col.key === "APPT_STATUS" && statusList.length > 0) {
        copy.options = statusList.filter(Boolean);
      } else if (col.key === "APPT_REGION") {
        copy.options = regionList.filter(Boolean);
      } else if (col.key === "MAKE_NAME") {
        copy.options = makeList.filter(Boolean).slice(0, 100);
      } else if (col.key === "INSP_MAKE") {
        copy.options = inspMakeList.filter(Boolean).slice(0, 100);
      } else if (col.key === "OPS_STATUS") {
        copy.options = opsStatusList.filter(Boolean);
      } else if (col.key === "GROWTH_FLAG") {
        copy.options = growthList.filter(Boolean);
      } else if (col.key === "DSA_NAME") {
        copy.options = dsaList.filter(Boolean).slice(0, 100);
      } else if (col.key === "LATEST_STORE_NAME") {
        copy.options = storeList.filter(Boolean).slice(0, 100);
      }
      return copy;
    });

    // Add dynamically discovered custom fields
    customFieldKeys.forEach((k) => {
      enrichedColumns.push({
        key: k,
        label: k.replace(/_/g, " "),
        type: "text",
        category: "Custom Fields",
        defaultVisible: false,
        filterable: true,
        sortable: true,
        exportable: true
      });
    });

    return res.status(200).json({
      success: true,
      columns: enrichedColumns
    });
  } catch (error) {
    console.error("getDataManagementColumns error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load columns: " + error.message
    });
  }
};

// ─── COMPREHENSIVE COLUMN ALIAS MAPPINGS FOR EXCEL / CSV IMPORT ───────────────
export const COLUMN_ALIASES = {
  PUB_APPT_ID: ["pub_appt_id", "pub appt id", "appointment id", "appt id", "appointment_id", "pubapptid", "appt_id", "id", "appointment"],
  LEAD_DATE: ["lead_date", "lead date", "lead created date", "created date", "lead_created_date", "date"],
  APPT_STATUS: ["appt_status", "appt status", "status", "appointment status", "appointment_status", "lead_status"],
  VERIFIED: ["verified", "is_verified", "is verified", "verification status", "verification_status"],
  OAD: ["oad", "original appointment date", "original appt date", "oad_date"],
  CAD: ["cad", "current appointment date", "current appt date", "customer appointment date", "cad_date"],
  DCD: ["dcd", "deal closed date", "deal close date", "dcd_date"],
  APPT_REGION: ["appt_region", "appt region", "region", "lead region", "city", "location", "hub_region"],

  MAKE_NAME: ["make_name", "make name", "make", "lead make", "brand", "car make", "manufacturer", "car_make"],
  MODEL_NAME: ["model_name", "model name", "model", "lead model", "car model", "variant", "car_model"],
  LEAD_YEAR: ["lead_year", "lead year", "year", "mfg year", "mfg_year", "manufacturing year", "reg year", "model_year", "model year"],
  
  INSP_MAKE: ["insp_make", "insp make", "inspection make", "inspection_make", "inspected make", "inspected_make"],
  INSP_MODEL: ["insp_model", "insp model", "inspection model", "inspection_model", "inspected model", "inspected_model"],
  INSP_YEAR: ["insp_year", "insp year", "inspection year", "inspection_year", "inspected year", "inspected_year"],
  ODOMETER_READING: ["odometer_reading", "odometer reading", "odometer", "odometer (km)", "km", "km driven", "kms run", "kms", "odometer_readings", "odometer_km"],

  LATEST_STORE_NAME: ["latest_store_name", "latest store name", "store name", "store", "latest store", "branch", "branch name", "center"],
  LATEST_STORE_TYPE: ["latest_store_type", "latest store type", "store type", "branch type"],
  LATEST_INSPECTION_STORE: ["latest_inspection_store", "latest inspection store", "inspection store", "insp store", "inspection branch"],
  INSP_REGION: ["insp_region", "insp region", "inspection region"],

  FIRST_INSP_DATE: ["first_insp_date", "first insp date", "first inspection date", "first_inspection_date"],
  LATEST_INSP_DATE: ["latest_insp_date", "latest insp date", "latest inspection date", "latest_inspection_date", "last inspection date"],
  INSP_RATING: ["insp_rating", "insp rating", "inspection rating", "rating"],

  TOKEN_DATE: ["token_date", "token date"],
  STOCKIN_DATE: ["stockin_date", "stockin date", "stock in date", "stock_in_date"],
  LATEST_AUCTION_DATE: ["latest_auction_date", "latest auction date", "auction date", "auction_date"],
  GS_BOUGHT: ["gs_bought", "gs bought", "bought", "gs bought flag", "gs_bought_flag"],
  C24QUOTE: ["c24quote", "c24 quote", "quote", "quote price", "cars24 quote", "cars24_quote"],
  C24QUOTE_AT_BOUGHT: ["c24quote_at_bought", "c24quote at bought", "quote at bought"],
  LATEST_TP: ["latest_tp", "latest tp", "tp", "target price", "latest target price"],
  LATEST_HB: ["latest_hb", "latest hb", "hb", "highest bid", "latest highest bid"],

  RETAIL_ASSOCIATE_EMAIL: ["retail_associate_email", "retail associate email", "retail email", "ra email", "ra_email"],
  PLL_EMAIL: ["pll_email", "pll email"],
  DSA_AGENT: ["dsa_agent", "dsa agent", "agent", "dsa executive"],
  DSA_NAME: ["dsa_name", "dsa name", "channel partner", "partner name"],
  DSA_CEP: ["dsa_cep", "dsa cep", "cep"],

  GROWTH_FLAG: ["growth_flag", "growth flag", "growth"],
  OPS_STATUS: ["ops_status", "ops status", "operation status", "operational status"],
  GSFLAG: ["gsflag", "gs flag"],
  IS_REG_NO_MISMATCH: ["is_reg_no_mismatch", "reg mismatch", "registration mismatch", "reg_no_mismatch"],

  APPOINTMENTS: ["appointments", "appointment", "appts", "appt count"],
  INSPECTIONS: ["inspections", "inspection", "insps", "insp count"],
  TOKENS: ["tokens", "token", "token count"],
  STOCKINS: ["stockins", "stockin", "stock ins", "stock in count"],
  PICKUPS: ["pickups", "pickup", "pickup count"],
  CANCELLED_APPTS: ["cancelled_appts", "cancelled appts", "cancelled appointments", "cancelled"],
  UNVERIFIED_APPTS: ["unverified_appts", "unverified appts", "unverified appointments", "unverified"]
};

export const resolveFieldValue = (row, targetKey, customMapping = {}) => {
  if (!row || typeof row !== "object") return undefined;

  // 1. Explicit user mapping from frontend
  if (customMapping[targetKey] && row[customMapping[targetKey]] !== undefined) {
    return row[customMapping[targetKey]];
  }

  // 2. Direct exact key match
  if (row[targetKey] !== undefined && row[targetKey] !== null && row[targetKey] !== "") {
    return row[targetKey];
  }

  // 3. Search aliases
  const aliases = COLUMN_ALIASES[targetKey] || [];
  const rowKeys = Object.keys(row);

  for (const alias of aliases) {
    const foundKey = rowKeys.find((k) => {
      const cleanK = k.trim().toLowerCase().replace(/[\s_-]+/g, " ");
      const cleanAlias = alias.trim().toLowerCase().replace(/[\s_-]+/g, " ");
      return cleanK === cleanAlias;
    });

    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== "") {
      return row[foundKey];
    }
  }

  return undefined;
};

// ─── 3. VALIDATE IMPORT ─────────────────────────────────────────────────────
export const validateDataImport = async (req, res) => {
  try {
    await ensureDB();
    const { rows = [] } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rows provided for validation or file is empty."
      });
    }

    const firstRow = rows[0] || {};
    const columnsDetected = Object.keys(firstRow).filter((k) => k !== "__EMPTY" && !k.startsWith("__EMPTY"));
    const totalRows = rows.length;

    // Check unique key: PUB_APPT_ID or APPT_ID
    const idKey = columnsDetected.find((k) =>
      /^(pub_?appt_?id|appt_?id|appointment_?id)$/i.test(k.trim())
    ) || "PUB_APPT_ID";

    const seenInFile = new Set();
    const duplicateIdsInFile = new Set();
    const extractedIds = [];
    let emptyOdometerCount = 0;
    let invalidDatesCount = 0;

    rows.forEach((row) => {
      const rawId = String(resolveFieldValue(row, "PUB_APPT_ID") || row[idKey] || "").trim();
      if (rawId) {
        if (seenInFile.has(rawId)) {
          duplicateIdsInFile.add(rawId);
        } else {
          seenInFile.add(rawId);
          extractedIds.push(rawId);
        }
      }
      const odo = resolveFieldValue(row, "ODOMETER_READING");
      if (odo === undefined || odo === null || odo === "") {
        emptyOdometerCount++;
      }
      const lDate = resolveFieldValue(row, "LEAD_DATE");
      if (lDate) {
        const d = new Date(lDate);
        if (isNaN(d.getTime())) invalidDatesCount++;
      }
    });

    // Detect duplicates already in database
    const existingInDb = await DataManagementRecord.find({
      PUB_APPT_ID: { $in: extractedIds.slice(0, 5000) },
      isDeleted: false
    }).select("PUB_APPT_ID").lean();

    const existingDbSet = new Set(existingInDb.map((r) => r.PUB_APPT_ID));

    // Mapped vs unmapped column stats
    const mappedCols = columnsDetected.filter((k) => {
      const cleanCol = k.trim().toLowerCase().replace(/[\s_-]+/g, " ");
      return DATA_MANAGEMENT_COLUMNS.some((c) => {
        if (c.key.toLowerCase() === k.toLowerCase().replace(/\s+/g, "_") || c.key.toLowerCase() === k.toLowerCase() || c.label.toLowerCase() === k.toLowerCase()) {
          return true;
        }
        const aliases = COLUMN_ALIASES[c.key] || [];
        return aliases.some((a) => a.replace(/[\s_-]+/g, " ") === cleanCol);
      });
    });
    const unmappedCols = columnsDetected.filter((k) => !mappedCols.includes(k));

    const warnings = [];
    if (duplicateIdsInFile.size > 0) {
      warnings.push(`${duplicateIdsInFile.size} duplicate IDs found inside the uploaded file.`);
    }
    if (existingDbSet.size > 0) {
      warnings.push(`${existingDbSet.size} records already exist in the database (will be updated or handled based on policy).`);
    }
    if (emptyOdometerCount > 0 && emptyOdometerCount < totalRows) {
      warnings.push(`${emptyOdometerCount} rows have empty Odometer reading.`);
    }
    if (invalidDatesCount > 0) {
      warnings.push(`${invalidDatesCount} rows contain invalid or unparseable dates.`);
    }

    return res.status(200).json({
      success: true,
      totalRows,
      columnsCount: columnsDetected.length,
      columnsDetected,
      mappedCount: mappedCols.length,
      unmappedCount: unmappedCols.length,
      unmappedColumns: unmappedCols,
      idColumn: idKey,
      duplicateCountInFile: duplicateIdsInFile.size,
      duplicateCountInDb: existingDbSet.size,
      warnings,
      previewRows: rows.slice(0, 5)
    });
  } catch (error) {
    console.error("validateDataImport error:", error);
    return res.status(500).json({
      success: false,
      message: "Validation failed: " + error.message
    });
  }
};

// ─── 4. IMPORT DATA (BATCH EXECUTION) ───────────────────────────────────────
export const importDataManagementRecords = async (req, res) => {
  try {
    await ensureDB();
    const {
      rows = [],
      duplicateHandling = "update", // "update" | "skip" | "create"
      fileName = "data_upload.csv",
      fileSize = 0,
      columnMapping = {}
    } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rows provided for import."
      });
    }

    const userId = req.user?._id || req.user?.id || null;
    const userName = req.user?.name || req.user?.email || "Admin";

    const cleanCols = Object.keys(rows[0] || {}).filter((k) => k !== "__EMPTY" && !k.startsWith("__EMPTY"));

    // 1. Create Import History record in 'Processing' state
    const historyDoc = await DataManagementImportHistory.create({
      fileName,
      fileSize,
      totalRows: rows.length,
      duplicateHandling,
      status: "Processing",
      performedBy: userId,
      performedByName: userName,
      columnsDetected: cleanCols
    });

    const parsedRecords = [];
    const idColumn = cleanCols.find((k) =>
      /^(pub_?appt_?id|appt_?id|appointment_?id)$/i.test(k.trim())
    ) || "PUB_APPT_ID";

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let pubId = String(resolveFieldValue(r, "PUB_APPT_ID", columnMapping) || r[columnMapping.PUB_APPT_ID || idColumn] || "").trim();
      if (!pubId) {
        pubId = `AP-${Date.now()}-${i + 1}`;
      }

      // Map standard fields safely
      const cleanDate = (val) => {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };

      const cleanNum = (val) => {
        if (val === undefined || val === null || val === "") return null;
        const n = Number(String(val).replace(/[^0-9.-]+/g, ""));
        return isNaN(n) ? null : n;
      };

      const cleanBool = (val) => {
        if (typeof val === "boolean") return val;
        const s = String(val || "").trim().toLowerCase();
        return s === "true" || s === "yes" || s === "1" || s === "verified";
      };

      const makeVal = String(resolveFieldValue(r, "MAKE_NAME", columnMapping) || "").trim();
      const modelVal = String(resolveFieldValue(r, "MODEL_NAME", columnMapping) || "").trim();
      const leadYearVal = cleanNum(resolveFieldValue(r, "LEAD_YEAR", columnMapping));

      const inspMakeVal = String(resolveFieldValue(r, "INSP_MAKE", columnMapping) || "").trim();
      const inspModelVal = String(resolveFieldValue(r, "INSP_MODEL", columnMapping) || "").trim();
      const inspYearVal = cleanNum(resolveFieldValue(r, "INSP_YEAR", columnMapping));

      const apptRegionVal = String(resolveFieldValue(r, "APPT_REGION", columnMapping) || "").trim();
      const inspRegionVal = String(resolveFieldValue(r, "INSP_REGION", columnMapping) || "").trim();

      const storeNameVal = String(resolveFieldValue(r, "LATEST_STORE_NAME", columnMapping) || "").trim();
      const inspStoreVal = String(resolveFieldValue(r, "LATEST_INSPECTION_STORE", columnMapping) || "").trim();

      const record = {
        PUB_APPT_ID: pubId,
        LEAD_DATE: cleanDate(resolveFieldValue(r, "LEAD_DATE", columnMapping)),
        APPT_STATUS: String(resolveFieldValue(r, "APPT_STATUS", columnMapping) || "Pending").trim(),
        VERIFIED: cleanBool(resolveFieldValue(r, "VERIFIED", columnMapping)),
        OAD: cleanDate(resolveFieldValue(r, "OAD", columnMapping)),
        CAD: cleanDate(resolveFieldValue(r, "CAD", columnMapping)),
        DCD: cleanDate(resolveFieldValue(r, "DCD", columnMapping)),
        APPT_REGION: apptRegionVal || inspRegionVal,

        // Symmetrical fallback between lead & inspection vehicle attributes
        MAKE_NAME: makeVal || inspMakeVal,
        MODEL_NAME: modelVal || inspModelVal,
        LEAD_YEAR: leadYearVal || inspYearVal,
        INSP_MAKE: inspMakeVal || makeVal,
        INSP_MODEL: inspModelVal || modelVal,
        INSP_YEAR: inspYearVal || leadYearVal,
        ODOMETER_READING: cleanNum(resolveFieldValue(r, "ODOMETER_READING", columnMapping)),

        LATEST_STORE_NAME: storeNameVal || inspStoreVal,
        LATEST_STORE_TYPE: String(resolveFieldValue(r, "LATEST_STORE_TYPE", columnMapping) || "").trim(),
        LATEST_INSPECTION_STORE: inspStoreVal || storeNameVal,
        INSP_REGION: inspRegionVal || apptRegionVal,

        FIRST_INSP_DATE: cleanDate(resolveFieldValue(r, "FIRST_INSP_DATE", columnMapping)),
        LATEST_INSP_DATE: cleanDate(resolveFieldValue(r, "LATEST_INSP_DATE", columnMapping)),
        INSP_RATING: String(resolveFieldValue(r, "INSP_RATING", columnMapping) || "").trim(),

        TOKEN_DATE: cleanDate(resolveFieldValue(r, "TOKEN_DATE", columnMapping)),
        STOCKIN_DATE: cleanDate(resolveFieldValue(r, "STOCKIN_DATE", columnMapping)),
        LATEST_AUCTION_DATE: cleanDate(resolveFieldValue(r, "LATEST_AUCTION_DATE", columnMapping)),
        GS_BOUGHT: String(resolveFieldValue(r, "GS_BOUGHT", columnMapping) || "").trim(),
        C24QUOTE: cleanNum(resolveFieldValue(r, "C24QUOTE", columnMapping)),
        C24QUOTE_AT_BOUGHT: cleanNum(resolveFieldValue(r, "C24QUOTE_AT_BOUGHT", columnMapping)),
        LATEST_TP: cleanNum(resolveFieldValue(r, "LATEST_TP", columnMapping)),
        LATEST_HB: cleanNum(resolveFieldValue(r, "LATEST_HB", columnMapping)),

        RETAIL_ASSOCIATE_EMAIL: String(resolveFieldValue(r, "RETAIL_ASSOCIATE_EMAIL", columnMapping) || "").trim().toLowerCase(),
        PLL_EMAIL: String(resolveFieldValue(r, "PLL_EMAIL", columnMapping) || "").trim().toLowerCase(),
        DSA_AGENT: String(resolveFieldValue(r, "DSA_AGENT", columnMapping) || "").trim(),
        DSA_NAME: String(resolveFieldValue(r, "DSA_NAME", columnMapping) || "").trim(),
        DSA_CEP: String(resolveFieldValue(r, "DSA_CEP", columnMapping) || "").trim(),

        GROWTH_FLAG: String(resolveFieldValue(r, "GROWTH_FLAG", columnMapping) || "").trim(),
        OPS_STATUS: String(resolveFieldValue(r, "OPS_STATUS", columnMapping) || "").trim(),
        GSFLAG: String(resolveFieldValue(r, "GSFLAG", columnMapping) || "").trim(),
        IS_REG_NO_MISMATCH: String(resolveFieldValue(r, "IS_REG_NO_MISMATCH", columnMapping) || "No").trim(),

        APPOINTMENTS: cleanNum(resolveFieldValue(r, "APPOINTMENTS", columnMapping)) || 0,
        INSPECTIONS: cleanNum(resolveFieldValue(r, "INSPECTIONS", columnMapping)) || 0,
        TOKENS: cleanNum(resolveFieldValue(r, "TOKENS", columnMapping)) || 0,
        STOCKINS: cleanNum(resolveFieldValue(r, "STOCKINS", columnMapping)) || 0,
        PICKUPS: cleanNum(resolveFieldValue(r, "PICKUPS", columnMapping)) || 0,
        CANCELLED_APPTS: cleanNum(resolveFieldValue(r, "CANCELLED_APPTS", columnMapping)) || 0,
        UNVERIFIED_APPTS: cleanNum(resolveFieldValue(r, "UNVERIFIED_APPTS", columnMapping)) || 0,

        importedAt: new Date(),
        importedBy: userId,
        importBatchId: historyDoc._id,
        isDeleted: false
      };

      // Collect custom fields that aren't mapped
      const customFields = {};
      const knownKeys = new Set([
        ...DATA_MANAGEMENT_COLUMNS.map((c) => c.key),
        ...Object.values(COLUMN_ALIASES).flat(),
        "__EMPTY"
      ]);

      for (const [k, v] of Object.entries(r)) {
        const cleanK = k.trim().toLowerCase().replace(/[\s_-]+/g, " ");
        const isKnown = [...knownKeys].some((kk) => kk.toLowerCase().replace(/[\s_-]+/g, " ") === cleanK);
        if (!isKnown && !k.startsWith("__EMPTY") && v !== undefined && v !== null && v !== "") {
          customFields[k] = v;
        }
      }
      record.customFields = customFields;
      parsedRecords.push(record);
    }

    // Perform Bulk Write
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const BATCH_SIZE = 1000;
    for (let i = 0; i < parsedRecords.length; i += BATCH_SIZE) {
      const batch = parsedRecords.slice(i, i + BATCH_SIZE);
      const operations = [];

      for (const rec of batch) {
        if (duplicateHandling === "skip") {
          operations.push({
            updateOne: {
              filter: { PUB_APPT_ID: rec.PUB_APPT_ID },
              update: { $setOnInsert: rec },
              upsert: true
            }
          });
        } else if (duplicateHandling === "create") {
          operations.push({
            insertOne: {
              document: { ...rec, PUB_APPT_ID: `${rec.PUB_APPT_ID}_${Date.now()}` }
            }
          });
        } else {
          // Default: "update"
          operations.push({
            updateOne: {
              filter: { PUB_APPT_ID: rec.PUB_APPT_ID },
              update: { $set: rec },
              upsert: true
            }
          });
        }
      }

      const result = await DataManagementRecord.bulkWrite(operations, { ordered: false });
      insertedCount += result.upsertedCount || result.insertedCount || 0;
      updatedCount += result.modifiedCount || 0;
      if (duplicateHandling === "skip") {
        skippedCount += (result.matchedCount || 0) - (result.modifiedCount || 0);
      }
    }

    // Update history
    historyDoc.status = "Completed";
    historyDoc.insertedCount = insertedCount;
    historyDoc.updatedCount = updatedCount;
    historyDoc.skippedCount = skippedCount;
    await historyDoc.save();

    // Log Activity
    await ActivityLog.create({
      performedBy: userId,
      performedByName: userName,
      performedByRole: req.user?.role || "admin",
      actionType: "DATA_IMPORT",
      title: "Dataset Imported into Data Management",
      details: `Imported ${parsedRecords.length} rows from '${fileName}' (${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped).`,
      metadata: {
        fileName,
        totalRows: parsedRecords.length,
        insertedCount,
        updatedCount,
        batchId: historyDoc._id
      }
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `Import completed: ${parsedRecords.length} records processed (${insertedCount} new, ${updatedCount} updated, ${skippedCount} skipped).`,
      summary: {
        totalRows: parsedRecords.length,
        insertedCount,
        updatedCount,
        skippedCount,
        batchId: historyDoc._id
      }
    });
  } catch (error) {
    console.error("importDataManagementRecords error:", error);
    return res.status(500).json({
      success: false,
      message: "Data import failed: " + error.message
    });
  }
};

// ─── 5. GET IMPORT HISTORY ──────────────────────────────────────────────────
export const getDataManagementImportHistory = async (req, res) => {
  try {
    await ensureDB();
    const history = await DataManagementImportHistory.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 6. GET RECORD BY ID ────────────────────────────────────────────────────
export const getDataManagementRecordById = async (req, res) => {
  try {
    await ensureDB();
    const record = await DataManagementRecord.findById(req.params.id).lean();
    if (!record || record.isDeleted) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 7. UPDATE RECORD ───────────────────────────────────────────────────────
export const updateDataManagementRecord = async (req, res) => {
  try {
    await ensureDB();
    const { id } = req.params;
    const updates = { ...req.body, updatedBy: req.user?._id || req.user?.id };

    const record = await DataManagementRecord.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, data: record, message: "Record updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 8. DELETE RECORD ───────────────────────────────────────────────────────
export const deleteDataManagementRecord = async (req, res) => {
  try {
    await ensureDB();
    const { id } = req.params;
    const record = await DataManagementRecord.findByIdAndUpdate(id, { $set: { isDeleted: true } });
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    await ActivityLog.create({
      performedBy: req.user?._id || req.user?.id,
      performedByName: req.user?.name || "Admin",
      performedByRole: req.user?.role || "admin",
      actionType: "DATA_RECORD_DELETE",
      title: "Data Management Record Deleted",
      details: `Record ${record.PUB_APPT_ID} was removed.`,
      metadata: { recordId: id, pubApptId: record.PUB_APPT_ID }
    }).catch(() => {});

    return res.status(200).json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 9. BULK DELETE ─────────────────────────────────────────────────────────
export const bulkDeleteDataManagementRecords = async (req, res) => {
  try {
    await ensureDB();
    const { ids = [] } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No record IDs provided" });
    }

    const result = await DataManagementRecord.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: true } }
    );

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.modifiedCount} records.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 10. EXPORT CSV (STREAMING & IDENTICAL QUERY LOGIC) ──────────────────────
export const exportDataManagementCSV = async (req, res) => {
  try {
    await ensureDB();
    const { search = "", filters = [], logic = "AND", statusQuickFilter = "", columns = [], sort = {} } = req.body;

    const query = buildMongoQuery({ search, filters, logic, statusQuickFilter });
    const sortObj = buildMongoSort(sort);

    let targetColumns = DATA_MANAGEMENT_COLUMNS;
    if (Array.isArray(columns) && columns.length > 0) {
      targetColumns = columns.map((colKey) => {
        const found = DATA_MANAGEMENT_COLUMNS.find((c) => c.key === colKey);
        return found || { key: colKey, label: colKey.replace(/_/g, " "), type: "text" };
      });
    } else if (columns !== "all") {
      targetColumns = DATA_MANAGEMENT_COLUMNS.filter((c) => c.defaultVisible);
    }

    const records = await DataManagementRecord.find(query).sort(sortObj).lean();

    // Prepare CSV Header
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      if (val instanceof Date) str = val.toLocaleDateString("en-IN");
      if (typeof val === "boolean") str = val ? "Yes" : "No";
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headerLine = targetColumns.map((c) => escapeCsv(c.label)).join(",");
    const rowsLines = records.map((r) => {
      return targetColumns.map((c) => {
        const val = r[c.key] !== undefined ? r[c.key] : (r.customFields?.[c.key] || "");
        return escapeCsv(val);
      }).join(",");
    });

    const csvContent = "\uFEFF" + [headerLine, ...rowsLines].join("\r\n");

    // Audit log
    await ActivityLog.create({
      performedBy: req.user?._id || req.user?.id,
      performedByName: req.user?.name || "Admin",
      performedByRole: req.user?.role || "admin",
      actionType: "DATA_EXPORT_CSV",
      title: "Data Management Exported as CSV",
      details: `Exported ${records.length} records with ${targetColumns.length} columns.`,
      metadata: { recordCount: records.length, format: "csv" }
    }).catch(() => {});

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="GatecodeXcars24_Data_${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("exportDataManagementCSV error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 10B. EXPORT XLSX (EXCEL FORMAT) ─────────────────────────────────────────
export const exportDataManagementXLSX = async (req, res) => {
  try {
    await ensureDB();
    const { search = "", filters = [], logic = "AND", statusQuickFilter = "", columns = [], sort = {} } = req.body;

    const query = buildMongoQuery({ search, filters, logic, statusQuickFilter });
    const sortObj = buildMongoSort(sort);

    let targetColumns = DATA_MANAGEMENT_COLUMNS;
    if (Array.isArray(columns) && columns.length > 0) {
      targetColumns = columns.map((colKey) => {
        const found = DATA_MANAGEMENT_COLUMNS.find((c) => c.key === colKey);
        return found || { key: colKey, label: colKey.replace(/_/g, " "), type: "text" };
      });
    } else if (columns !== "all") {
      targetColumns = DATA_MANAGEMENT_COLUMNS.filter((c) => c.defaultVisible);
    }

    const records = await DataManagementRecord.find(query).sort(sortObj).lean();

    const sheetData = records.map((r) => {
      const row = {};
      targetColumns.forEach((c) => {
        let val = r[c.key] !== undefined ? r[c.key] : (r.customFields?.[c.key] ?? "");
        if (val instanceof Date) {
          val = val.toISOString().slice(0, 10);
        } else if (typeof val === "boolean") {
          val = val ? "Yes" : "No";
        }
        row[c.label] = val ?? "";
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    await ActivityLog.create({
      performedBy: req.user?._id || req.user?.id,
      performedByName: req.user?.name || "Admin",
      performedByRole: req.user?.role || "admin",
      actionType: "DATA_EXPORT_XLSX",
      title: "Data Management Exported as Excel (XLSX)",
      details: `Exported ${records.length} records with ${targetColumns.length} columns.`,
      metadata: { recordCount: records.length, format: "xlsx" }
    }).catch(() => {});

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="GatecodeXcars24_Data_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("exportDataManagementXLSX error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 11. EXPORT PDF (LANDSCAPE MULTI-PAGE TABLE) ────────────────────────────
export const exportDataManagementPDF = async (req, res) => {
  try {
    await ensureDB();
    const { search = "", filters = [], logic = "AND", statusQuickFilter = "", columns = [], sort = {} } = req.body;

    const query = buildMongoQuery({ search, filters, logic, statusQuickFilter });
    const sortObj = buildMongoSort(sort);

    // Limit to visible or key columns for readability in PDF landscape format
    const targetColumns = (Array.isArray(columns) && columns.length > 0)
      ? DATA_MANAGEMENT_COLUMNS.filter((c) => columns.includes(c.key)).slice(0, 10)
      : DATA_MANAGEMENT_COLUMNS.filter((c) => c.defaultVisible).slice(0, 9);

    const records = await DataManagementRecord.find(query).sort(sortObj).limit(500).lean();

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 14;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GatecodeXCars24 — Data Management Operational Report", pageWidth / 2, y, { align: "center" });
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const filterSummary = `Total Records: ${records.length} | Generated: ${new Date().toLocaleDateString("en-IN")}`;
    doc.text(filterSummary, pageWidth / 2, y, { align: "center" });
    y += 8;

    const headers = targetColumns.map((c) => c.label);
    const bodyRows = records.map((r) => {
      return targetColumns.map((c) => {
        const val = r[c.key] !== undefined ? r[c.key] : (r.customFields?.[c.key] || "-");
        if (val instanceof Date) return val.toLocaleDateString("en-IN");
        if (typeof val === "boolean") return val ? "Yes" : "No";
        return val || "-";
      });
    });

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: bodyRows,
      theme: "grid",
      headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 10, right: 10 }
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Audit log
    await ActivityLog.create({
      performedBy: req.user?._id || req.user?.id,
      performedByName: req.user?.name || "Admin",
      performedByRole: req.user?.role || "admin",
      actionType: "DATA_EXPORT_PDF",
      title: "Data Management Exported as PDF",
      details: `Generated PDF report with ${records.length} records.`,
      metadata: { recordCount: records.length, format: "pdf" }
    }).catch(() => {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="GatecodeXcars24_Report_${new Date().toISOString().slice(0, 10)}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("exportDataManagementPDF error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 12. SAVED VIEWS ────────────────────────────────────────────────────────
export const getSavedViews = async (req, res) => {
  try {
    await ensureDB();
    const views = await DataManagementView.find({
      $or: [{ createdBy: req.user?._id }, { isShared: true }]
    }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({ success: true, data: views });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createSavedView = async (req, res) => {
  try {
    await ensureDB();
    const { name, filters = [], logic = "AND", search = "", sort = {}, visibleColumns = [], perPage = 50 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "View name is required" });
    }

    const view = await DataManagementView.create({
      name: name.trim(),
      createdBy: req.user?._id || req.user?.id,
      filters,
      logic,
      search,
      sort,
      visibleColumns,
      perPage
    });

    return res.status(201).json({ success: true, data: view, message: "View saved successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSavedView = async (req, res) => {
  try {
    await ensureDB();
    await DataManagementView.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "View removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
