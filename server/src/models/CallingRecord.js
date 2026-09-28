import mongoose from "mongoose";

const callingRecordSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employeeName: { type: String, required: true },
    date: { type: Date, required: true },
    outgoingCalls: { type: Number, default: 0 },
    incomingCalls: { type: Number, default: 0 },
    connectedCalls: { type: Number, default: 0 },
    notConnectedCalls: { type: Number, default: 0 },
    interestedLeads: { type: Number, default: 0 },
    notInterestedLeads: { type: Number, default: 0 },
    followUpCalls: { type: Number, default: 0 },
    followUpLeads: { type: Number, default: 0 },
    conversionsDone: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

callingRecordSchema.virtual("totalCallsDone").get(function () {
  return (this.outgoingCalls || 0) + (this.incomingCalls || 0) + (this.followUpCalls || 0);
});

callingRecordSchema.set("toJSON", { virtuals: true });
callingRecordSchema.set("toObject", { virtuals: true });

callingRecordSchema.index({ employeeId: 1, date: -1 });

export const CallingRecord = mongoose.model("CallingRecord", callingRecordSchema);
