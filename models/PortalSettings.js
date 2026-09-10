import mongoose from "mongoose";
export default mongoose.model(
  "PortalSettings",
  new mongoose.Schema(
    {
      _id: { type: String, default: "portal" },
      employerApprovalMode: {
        type: String,
        enum: ["auto", "manual"],
        required: true,
      },
    },
    { timestamps: true },
  ),
);
