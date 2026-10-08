import mongoose from "mongoose";

const dataManagementViewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isShared: { type: Boolean, default: true },
    filters: {
      type: [
        {
          field: { type: String, required: true },
          operator: { type: String, required: true },
          value: { type: mongoose.Schema.Types.Mixed },
          from: { type: mongoose.Schema.Types.Mixed },
          to: { type: mongoose.Schema.Types.Mixed }
        }
      ],
      default: []
    },
    logic: { type: String, enum: ["AND", "OR"], default: "AND" },
    search: { type: String, default: "" },
    sort: {
      field: { type: String, default: "LEAD_DATE" },
      direction: { type: String, enum: ["asc", "desc"], default: "desc" }
    },
    visibleColumns: { type: [String], default: [] },
    perPage: { type: Number, default: 50 }
  },
  {
    timestamps: true,
    collection: "data_management_views"
  }
);

dataManagementViewSchema.index({ createdBy: 1, createdAt: -1 });

export const DataManagementView =
  mongoose.models.DataManagementView ||
  mongoose.model("DataManagementView", dataManagementViewSchema);
