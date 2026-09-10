import { approvalMode } from "../services/employerApproval.js";
import express from "express";
import rateLimit from "express-rate-limit";
import Notification from "../models/Notification.js";
import Issue from "../models/Issue.js";
import Job from "../models/Job.js";
import { protect } from "../middleware/authMiddleware.js";
import { endpoint, fail, escapeHtml } from "../services/http.js";
import { POSITIONS, TAGS } from "../services/matching.js";
import { sendEmail } from "../controllers/authController.js";
const router = express.Router();
router.get(
  "/options",
  endpoint(async (req, res) => {
    res.json({
      positions: POSITIONS,
      tags: TAGS,
      employerApprovalMode: await approvalMode(),
    });
  }),
);
router.use(protect);
router.get(
  "/notifications",
  endpoint(async (req, res) =>
    res.json(
      await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(100),
    ),
  ),
);
router.patch(
  "/notifications/:id",
  endpoint(async (req, res) => {
    await Notification.updateOne(
      { _id: req.params.id, user: req.user._id },
      { $set: { read: true } },
    );
    res.json({ message: "Marked as read" });
  }),
);
router.get(
  "/introductions",
  endpoint(async (req, res) => {
    const jobs = await Job.find({ "contacts.crew": req.user._id });
    res.json(
      jobs.map((j) => ({
        _id: j._id,
        position: j.position,
        location: j.location,
        startDate: j.startDate,
        endDate: j.endDate,
        status: j.status,
        outcome: j.contacts.find((c) => String(c.crew) === String(req.user._id))
          ?.crewOutcome,
      })),
    );
  }),
);
router.post(
  "/issues",
  rateLimit({ windowMs: 3600000, limit: 5 }),
  endpoint(async (req, res) => {
    const { subject, message } = req.body;
    if (
      typeof subject !== "string" ||
      subject.trim().length < 3 ||
      subject.length > 160 ||
      typeof message !== "string" ||
      message.trim().length < 10 ||
      message.length > 5000
    )
      fail(400, "Include a subject and a message of 10–5000 characters");
    const issue = await Issue.create({ user: req.user._id, subject, message });
    try {
      await sendEmail(
        process.env.ISSUE_RECIPIENTS ||
          "maya@nauticrewagency.com,jodie@nauticrewagency.com",
        `NCA issue: ${subject}`,
        `<p>From ${escapeHtml(req.user.email)}</p><p>${escapeHtml(message)}</p><p>Reference: ${issue._id}</p>`,
      );
      issue.emailDelivered = true;
      await issue.save();
    } catch {
      /* Retained for staff to review or retry; never lose the report. */
    }
    res.status(201).json({
      message: "Your report has been recorded.",
      reference: issue._id,
    });
  }),
);
export default router;
