import { approvalMode } from "../services/employerApproval.js";
import { profileReady } from "../services/profileReadiness.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import twilio from "twilio";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import validator from "validator";
import { sendDocument } from "../services/http.js";
dotenv.config();
// Generate JWT Token
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};
// Multer setup for resume upload
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype === "application/pdf"),
});
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
// Send SMS helper
const sendSMS = async (to, body) => {
  if (!twilioClient) throw new Error("SMS delivery is not configured");
  return twilioClient.messages.create({
    body,
    from: TWILIO_PHONE,
    to,
  });
};
// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// Check if email configuration is available
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;
export const sendEmail = async (to, subject, html) => {
  if (!isEmailConfigured) {
    if (process.env.NODE_ENV === "test")
      return { message: "Test delivery suppressed" };
    throw new Error("Email delivery is not configured");
  }
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};
// Helper to generate random code
const generateCode = () => crypto.randomInt(100000, 1000000).toString();
// @desc    Register a new user with email verification
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, firstName, lastName, password, userType, phone } = req.body;
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    if (
      !validator.isEmail(email) ||
      typeof password !== "string" ||
      password.length < 8 ||
      !["jobseeker", "employer"].includes(userType) ||
      !phone?.trim()
    )
      return res.status(400).json({
        message:
          "Valid email, phone, role and a password of at least 8 characters are required",
      });
    if (req.body.termsAccepted !== "true" && req.body.termsAccepted !== true)
      return res
        .status(400)
        .json({ message: "Please accept the terms for your account type" });
    const vessel = {
      name: req.body.vesselName?.trim(),
      callSign: req.body.callSign?.trim(),
      mmsi: req.body.mmsi?.trim(),
      imo: req.body.imo?.trim(),
    };
    if (
      userType === "employer" &&
      (!vessel.name || !(vessel.callSign || /^\d{9}$/.test(vessel.mmsi || "")))
    )
      return res.status(400).json({
        message: "Vessel name and call sign or nine-digit MMSI are required",
      });
    if (!isEmailConfigured && process.env.NODE_ENV !== "test")
      return res.status(503).json({
        message:
          "Email verification is temporarily unavailable. Please try again later.",
      });
    const resolvedName =
      name && name.trim()
        ? name.trim()
        : `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
    if (!resolvedName) {
      return res
        .status(400)
        .json({ message: "First and last name are required" });
    }
    let profile = {};
    if (userType === "jobseeker" && req.file) {
      profile.resume = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Generate email verification code
    const emailVerificationCode = generateCode();
    // Create user
    const user = await User.create({
      name: resolvedName,
      email,
      password,
      userType,
      phone,
      profile,
      vessel: userType === "employer" ? vessel : undefined,
      employerApproval:
        userType === "employer"
          ? {
              status:
                (await approvalMode()) === "auto" ? "approved" : "pending",
              source: "automatic",
              reviewedAt: new Date(),
            }
          : undefined,
      termsAcceptedAt: new Date(),
      termsVersion: "2026-09-draft",
      emailVerificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
      crewProfile: { firstName, lastName },
      emailVerified: false,
      emailVerificationCode,
    });
    // Send verification email (if configured)
    if (isEmailConfigured) {
      await sendEmail(
        email,
        "Verify your email",
        `<p>Your verification code is: <b>${emailVerificationCode}</b></p>`,
      );
    }
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      emailVerified: false,
      profileComplete: false,
      profileStatus: "active",
      message: isEmailConfigured
        ? "Account created. Please check your email for verification."
        : "Account created. Email verification not configured.",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified)
      return res.json({ message: "Email already verified" });
    if (
      typeof code !== "string" ||
      !user.emailVerificationCode ||
      user.emailVerificationCode !== code ||
      !user.emailVerificationExpiry ||
      Date.now() > user.emailVerificationExpiry
    ) {
      return res.status(400).json({ message: "Invalid verification code" });
    }
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    await user.save();
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// @desc    Forgot password (email)
// @route   POST /api/auth/forgot-password-email
// @access  Public
export const forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    const code = generateCode();
    user.resetEmailCode = code;
    user.resetEmailCodeExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendEmail(
      email,
      "Password Reset Code",
      `<p>Your password reset code is: <b>${code}</b></p>`,
    );
    res.json({ message: "Reset code sent via email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Reset password with email code
// @route   POST /api/auth/reset-password-email
// @access  Public
export const resetPasswordEmail = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
    });
    if (
      !user ||
      typeof code !== "string" ||
      !user.resetEmailCode ||
      user.resetEmailCode !== code ||
      !user.resetEmailCodeExpiry
    ) {
      return res.status(400).json({ message: "Invalid code or email" });
    }
    if (Date.now() > user.resetEmailCodeExpiry) {
      return res.status(400).json({ message: "Code expired" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.password = newPassword;
    user.resetEmailCode = undefined;
    user.resetEmailCodeExpiry = undefined;
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    // Find user
    const user = await User.findOne({
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // Restrict access if email not verified (only if email is configured)
    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }
    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    user.lastLoginAt = new Date();
    if (user.userType === "jobseeker")
      user.crewProfile.profileReminderSentAt = undefined;
    await user.save();
    const token = generateToken(user._id, user.tokenVersion);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      token: token,
      profileComplete: profileReady(user.crewProfile),
      profileStatus: user.crewProfile?.profileStatus || "active",
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};
export const getUserResume = async (req, res) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res
        .status(403)
        .json({ message: "Use job-specific Contact Crew to access a CV" });
    const user = await User.findById(req.params.id);
    if (
      !user ||
      !user.profile ||
      !user.profile.resume ||
      !user.profile.resume.data
    ) {
      return res.status(404).json({ message: "Resume not found" });
    }
    res.set("Content-Type", user.profile.resume.contentType);
    res.send(user.profile.resume.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Forgot password (send SMS code)
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "User not found" });
    // Generate code
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 min
    user.profile = user.profile || {};
    user.profile.resetCode = code;
    user.profile.resetCodeExpiry = expiry;
    await user.save();
    await sendSMS(phone, `Your password reset code is: ${code}`);
    res.json({ message: "Reset code sent via SMS" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Reset password with code
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    const user = await User.findOne({ phone });
    if (
      !user ||
      typeof code !== "string" ||
      !user.profile?.resetCode ||
      user.profile.resetCode !== code ||
      !user.profile.resetCodeExpiry
    ) {
      return res.status(400).json({ message: "Invalid code or phone number" });
    }
    if (Date.now() > user.profile.resetCodeExpiry) {
      return res.status(400).json({ message: "Code expired" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.password = newPassword;
    user.profile.resetCode = undefined;
    user.profile.resetCodeExpiry = undefined;
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified)
      return res.json({ message: "Email already verified" });
    const newCode = generateCode();
    user.emailVerificationCode = newCode;
    user.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendEmail(
      email,
      "Verify your email",
      `<p>Your new verification code is: <b>${newCode}</b></p>`,
    );
    res.json({ message: "Verification email resent" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// @desc    Change password (logged-in user)
// @route   POST /api/v1/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });
    if (typeof newPassword !== "string" || newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
