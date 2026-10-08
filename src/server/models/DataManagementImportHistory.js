import mongoose from "mongoose";

const dataManagementImportHistorySchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    totalRows: { type: Number, default: 0 },
    insertedCount: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    duplicateHandling: {
      type: String,
      enum: ["update", "skip", "create"],
      default: "update"
    },
    status: {
      type: String,
      enum: ["Processing", "Completed", "Failed"],
      default: "Completed"
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    performedByName: { type: String, default: "Admin" },
    columnsDetected: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    errors: { type: [String], default: [] }
  },
  {
    timestamps: true,
    collection: "data_management_import_histories"
  }
);

dataManagementImportHistorySchema.index({ createdAt: -1 });

export const DataManagementImportHistory =
  mongoose.models.DataManagementImportHistory ||
  mongoose.model("DataManagementImportHistory", dataManagementImportHistorySchema);
