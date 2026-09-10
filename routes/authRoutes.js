import { profileReady } from "../services/profileReadiness.js";
import Job from "../models/Job.js";
import express from "express";
import {
  register,
  login,
  upload,
  getUserResume,
  forgotPassword,
  resetPassword,
  verifyEmail,
  forgotPasswordEmail,
  resetPasswordEmail,
  resendVerificationEmail,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", upload.single("resume"), register);
router.post("/login", login);
router.get("/me", protect, (req, res) =>
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    userType: req.user.userType,
    vessel: req.user.vessel,
    profileComplete: profileReady(req.user.crewProfile),
    profileStatus: req.user.crewProfile?.profileStatus,
  }),
);
router.put("/vessel", protect, async (req, res, next) => {
  try {
    if (req.user.userType !== "employer") return res.sendStatus(403);
    const { name, callSign, mmsi, imo } = req.body;
    if (!name?.trim() || !(callSign?.trim() || /^\d{9}$/.test(mmsi || "")))
      return res
        .status(400)
        .json({
          message: "Vessel name and call sign or nine-digit MMSI are required",
        });
    if (
      (await Job.exists({ employer: req.user._id })) &&
      ["name", "callSign", "mmsi", "imo"].some(
        (k) => (req.body[k] || "") !== (req.user.vessel?.[k] || ""),
      )
    )
      return res
        .status(409)
        .json({
          message: "Contact NCA to change vessel identity after posting jobs",
        });
    req.user.vessel = { name, callSign, mmsi, imo };
    await req.user.save();
    res.json({ message: "Vessel saved" });
  } catch (e) {
    next(e);
  }
});
router.get("/users/:id/resume", protect, getUserResume);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password-email", forgotPasswordEmail);
router.post("/reset-password-email", resetPasswordEmail);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/change-password", protect, changePassword);

export default router;
