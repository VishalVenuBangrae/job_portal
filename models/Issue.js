import mongoose from "mongoose";
export default mongoose.model(
  "Issue",
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      subject: String,
      message: String,
      emailDelivered: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
