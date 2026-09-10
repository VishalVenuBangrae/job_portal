import express from "express";
import User from "../models/User.js";
import PortalSettings from "../models/PortalSettings.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  approvalMode,
  approvalStatus,
  staffOnly,
} from "../services/employerApproval.js";
import { endpoint, fail } from "../services/http.js";
const router = express.Router();
router.use(protect, staffOnly);
router.get(
  "/employers",
  endpoint(async (req, res) => {
    const mode = await approvalMode();
    const employers = await User.find({ userType: "employer" })
      .select(
        "name email phone vessel emailVerified employerApproval createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      mode,
      employers: employers.map((u) => ({
        ...u,
        approvalStatus: approvalStatus(u, mode),
      })),
    });
  }),
);
router.patch(
  "/approval-mode",
  endpoint(async (req, res) => {
    const mode = req.body.mode;
    if (!["auto", "manual"].includes(mode))
      fail(400, "Choose automatic or manual approval");
    await PortalSettings.findByIdAndUpdate(
      "portal",
      { $set: { employerApprovalMode: mode } },
      { upsert: true, runValidators: true },
    );
    res.json({ mode });
  }),
);
router.patch(
  "/employers/:id",
  endpoint(async (req, res) => {
    const { status, note = "" } = req.body;
    if (
      !["approved", "pending", "rejected"].includes(status) ||
      typeof note !== "string" ||
      note.length > 1000
    )
      fail(400, "Invalid approval decision");
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, userType: "employer" },
      {
        $set: {
          employerApproval: {
            status,
            source: "staff",
            reviewedAt: new Date(),
            reviewedBy: req.user._id,
            note,
          },
        },
      },
      { new: true, runValidators: true },
    );
    if (!user) fail(404, "Employer not found");
    await Notification.create({
      user: user._id,
      message:
        status === "approved"
          ? "Your vessel account has been approved. You can now post jobs and contact matched crew."
          : status === "pending"
            ? "Your vessel account is awaiting NCA review."
            : "Your vessel account has not been approved. Contact NCA support for assistance.",
    });
    res.json({ status });
  }),
);
export default router;
