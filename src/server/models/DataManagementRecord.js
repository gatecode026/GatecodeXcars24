import mongoose from "mongoose";

const dataManagementRecordSchema = new mongoose.Schema(
  {
    // ─── 1. APPOINTMENT ───
    PUB_APPT_ID: { type: String, required: true, trim: true, index: true },
    LEAD_DATE: { type: Date, default: null, index: true },
    APPT_STATUS: { type: String, trim: true, default: "Pending", index: true },
    VERIFIED: { type: Boolean, default: false, index: true },
    OAD: { type: Date, default: null }, // Original Appointment Date
    CAD: { type: Date, default: null }, // Customer Appointment Date
    DCD: { type: Date, default: null }, // Deal Closed Date
    APPT_REGION: { type: String, trim: true, default: "", index: true },

    // ─── 2. VEHICLE ───
    MAKE_NAME: { type: String, trim: true, default: "", index: true },
    MODEL_NAME: { type: String, trim: true, default: "", index: true },
    LEAD_YEAR: { type: Number, default: null, index: true },
    INSP_MAKE: { type: String, trim: true, default: "" },
    INSP_MODEL: { type: String, trim: true, default: "" },
    INSP_YEAR: { type: Number, default: null },
    ODOMETER_READING: { type: Number, default: null },

    // ─── 3. STORE ───
    LATEST_STORE_NAME: { type: String, trim: true, default: "", index: true },
    LATEST_STORE_TYPE: { type: String, trim: true, default: "" },
    LATEST_INSPECTION_STORE: { type: String, trim: true, default: "" },
    INSP_REGION: { type: String, trim: true, default: "", index: true },

    // ─── 4. INSPECTION ───
    FIRST_INSP_DATE: { type: Date, default: null },
    LATEST_INSP_DATE: { type: Date, default: null },
    INSP_RATING: { type: String, trim: true, default: "" },

    // ─── 5. TOKEN / PURCHASE ───
    TOKEN_DATE: { type: Date, default: null, index: true },
    STOCKIN_DATE: { type: Date, default: null, index: true },
    LATEST_AUCTION_DATE: { type: Date, default: null },
    GS_BOUGHT: { type: String, trim: true, default: "" },
    C24QUOTE: { type: Number, default: null },
    C24QUOTE_AT_BOUGHT: { type: Number, default: null },
    LATEST_TP: { type: Number, default: null },
    LATEST_HB: { type: Number, default: null },

    // ─── 6. EMPLOYEE / ASSOCIATE ───
    RETAIL_ASSOCIATE_EMAIL: { type: String, trim: true, lowercase: true, default: "", index: true },
    PLL_EMAIL: { type: String, trim: true, lowercase: true, default: "", index: true },
    DSA_AGENT: { type: String, trim: true, default: "", index: true },
    DSA_NAME: { type: String, trim: true, default: "", index: true },
    DSA_CEP: { type: String, trim: true, default: "" },

    // ─── 7. OPERATIONAL ───
    GROWTH_FLAG: { type: String, trim: true, default: "" },
    OPS_STATUS: { type: String, trim: true, default: "", index: true },
    GSFLAG: { type: String, trim: true, default: "" },
    IS_REG_NO_MISMATCH: { type: String, trim: true, default: "No" },

    // ─── 8. METRICS ───
    APPOINTMENTS: { type: Number, default: 0 },
    INSPECTIONS: { type: Number, default: 0 },
    TOKENS: { type: Number, default: 0 },
    STOCKINS: { type: Number, default: 0 },
    PICKUPS: { type: Number, default: 0 },
    CANCELLED_APPTS: { type: Number, default: 0 },
    UNVERIFIED_APPTS: { type: Number, default: 0 },

    // ─── 9. DYNAMIC / CUSTOM FIELDS ───
    // Stores any additional or unmapped columns from imported spreadsheets
    customFields: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },

    // ─── 10. AUDIT & HISTORY METADATA ───
    importedAt: { type: Date, default: Date.now, index: true },
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    importBatchId: { type: mongoose.Schema.Types.ObjectId, ref: "DataManagementImportHistory", default: null, index: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null, index: true }
  },
  {
    timestamps: true,
    collection: "data_management_records"
  }
);

// Compound indexes for frequent query patterns
dataManagementRecordSchema.index({ isDeleted: 1, isArchived: 1, LEAD_DATE: -1 });
dataManagementRecordSchema.index({ isDeleted: 1, APPT_STATUS: 1 });
dataManagementRecordSchema.index({ isDeleted: 1, APPT_REGION: 1 });
dataManagementRecordSchema.index({ isDeleted: 1, MAKE_NAME: 1, MODEL_NAME: 1 });
dataManagementRecordSchema.index({ isDeleted: 1, LATEST_STORE_NAME: 1 });
dataManagementRecordSchema.index({ isDeleted: 1, DSA_NAME: 1 });
dataManagementRecordSchema.index({ isDeleted: 1, OPS_STATUS: 1 });

export const DataManagementRecord =
  mongoose.models.DataManagementRecord ||
  mongoose.model("DataManagementRecord", dataManagementRecordSchema);
