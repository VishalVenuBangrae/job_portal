import { profileReady } from "../services/profileReadiness.js";
import { resolveCoordinates } from "../services/locationResolver.js";
import User from "../models/User.js";
import { POSITIONS, TAGS } from "../services/matching.js";
import { sendDocument } from "../services/http.js";
const ALLOWED_POSITIONS = [...POSITIONS, "Deck hand"];
const ALLOWED_EXPERIENCE = ["Green", "6 months - 1 year", "1 year +"];
const ALLOWED_KEYWORDS = [
  "Interior Detailing",
  "Heads/Beds",
  "Laundry",
  "Inventory",
  "Galley",
  "Teak",
  "Tender Operation",
  "Exterior Detailing",
  "Polishing Stainless",
  ...Object.values(TAGS).flat(),
];
const ALLOWED_DURATION = [
  "1 day",
  "2 days",
  "3 days",
  "4 days",
  "5 days",
  "6 days",
  "7 days",
];
const parseJsonField = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};
const fileMeta = (doc) => {
  if (!doc?.data) return null;
  return {
    originalName: doc.originalName,
    contentType: doc.contentType,
    uploaded: true,
  };
};
export const getCrewProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    const cp = user.crewProfile || {};
    const emailVerificationRequired = true;
    res.json({
      email: user.email,
      emailVerified: user.emailVerified,
      emailVerificationRequired,
      phone: user.phone,
      profileComplete: profileReady(cp),
      profileStatus: cp.profileStatus || "active",
      profileLastActive: cp.profileLastActive,
      firstName: cp.firstName || "",
      lastName: cp.lastName || "",
      phoneWhatsApp: cp.phoneWhatsApp || false,
      alternatePhone: cp.alternatePhone || "",
      alternatePhoneWhatsApp: cp.alternatePhoneWhatsApp || false,
      positions: cp.positions || [],
      currentLocation: cp.currentLocation || {
        city: "",
        state: "",
        country: "",
        port: "",
        displayName: "",
      },
      duration: cp.duration || "",
      nationality: cp.nationality || "",
      usWorkAuthorization: cp.usWorkAuthorization || "",
      experience: cp.experience || [],
      keywords: cp.keywords || [],
      primaryPosition: cp.primaryPosition || "",
      travelKm: cp.travelKm ?? 0,
      availability: cp.availability || { mode: "unavailable" },
      workTypes: cp.workTypes || [],
      workEligibilityCountries: cp.workEligibilityCountries || [],
      yachtSize: cp.yachtSize || "",
      dayRate: cp.dayRate || "",
      contactPreferences: cp.contactPreferences || [],
      documents: {
        photo: fileMeta(cp.documents?.photo),
        cv: fileMeta(cp.documents?.cv),
        stcw: fileMeta(cp.documents?.stcw),
        eng1: fileMeta(cp.documents?.eng1),
        references: fileMeta(cp.documents?.references),
        passport: fileMeta(cp.documents?.passport),
        driversLicense: fileMeta(cp.documents?.driversLicense),
        additionalCertificates: (
          cp.documents?.additionalCertificates || []
        ).map((cert) => ({
          name: cert.name,
          originalName: cert.originalName,
          contentType: cert.contentType,
          uploaded: true,
        })),
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const saveCrewProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const {
      firstName,
      lastName,
      email,
      confirmEmail,
      phone,
      phoneWhatsApp,
      alternatePhone,
      alternatePhoneWhatsApp,
      locationCity,
      locationState,
      locationCountry,
      locationPort,
      duration,
      nationality,
      usWorkAuthorization,
      profileStatus,
    } = req.body;
    const positions = parseJsonField(req.body.positions);
    const experience = parseJsonField(req.body.experience);
    const keywords = parseJsonField(req.body.keywords);
    const additionalCertificateNames = parseJsonField(
      req.body.additionalCertificateNames,
    );
    const keepAdditionalIndices = parseJsonField(
      req.body.keepAdditionalIndices,
    );
    if (!firstName?.trim() || !lastName?.trim()) {
      return res
        .status(400)
        .json({ message: "First and last name are required" });
    }
    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (
      email.trim().toLowerCase() !== (confirmEmail || "").trim().toLowerCase()
    ) {
      return res.status(400).json({ message: "Email addresses do not match" });
    }
    if (email.trim().toLowerCase() !== user.email)
      return res
        .status(400)
        .json({
          message:
            "Your verified email cannot be changed through the profile form",
        });
    if (!phone?.trim()) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    if (!positions.length) {
      return res.status(400).json({ message: "Select at least one position" });
    }
    if (positions.length > 3) {
      return res
        .status(400)
        .json({ message: "You can select up to 3 positions" });
    }
    if (positions.some((p) => !ALLOWED_POSITIONS.includes(p))) {
      return res.status(400).json({ message: "Invalid position selected" });
    }
    const resolvedLocation = {
      city: (locationCity || "").trim(),
      state: (locationState || "").trim(),
      country: (locationCountry || "").trim(),
      port: (locationPort || "").trim(),
    };
    if (
      !resolvedLocation.city ||
      !resolvedLocation.country ||
      !resolvedLocation.port
    ) {
      return res
        .status(400)
        .json({
          message: "Current location must include city, country, and port",
        });
    }
    resolvedLocation.coordinates = await resolveCoordinates(resolvedLocation);
    resolvedLocation.displayName = [
      resolvedLocation.city,
      resolvedLocation.state ? `(${resolvedLocation.state})` : null,
      resolvedLocation.country,
      resolvedLocation.port,
    ]
      .filter(Boolean)
      .join(", ");
    if (!duration || !ALLOWED_DURATION.includes(duration)) {
      return res.status(400).json({ message: "Duration is required" });
    }
    if (!nationality || !["US", "Non-US"].includes(nationality)) {
      return res.status(400).json({ message: "Nationality is required" });
    }
    if (
      nationality === "Non-US" &&
      !["B1/B2", "Green Card", "Other", "Not applicable"].includes(
        usWorkAuthorization,
      )
    ) {
      return res
        .status(400)
        .json({ message: "Select your visa or residency status" });
    }
    if (!experience.length) {
      return res
        .status(400)
        .json({ message: "Select at least one experience level" });
    }
    if (experience.some((e) => !ALLOWED_EXPERIENCE.includes(e))) {
      return res.status(400).json({ message: "Invalid experience selection" });
    }
    if (keywords.some((k) => !ALLOWED_KEYWORDS.includes(k))) {
      return res.status(400).json({ message: "Invalid keyword selected" });
    }
    const primaryPosition = req.body.primaryPosition;
    const travelKm = Number(req.body.travelKm);
    let availability;
    try {
      availability =
        typeof req.body.availability === "string"
          ? JSON.parse(req.body.availability)
          : req.body.availability;
    } catch {
      return res.status(400).json({ message: "Invalid availability" });
    }
    const workTypes = parseJsonField(req.body.workTypes),
      workEligibilityCountries = parseJsonField(
        req.body.workEligibilityCountries,
      ),
      contactPreferences = parseJsonField(req.body.contactPreferences);
    if (
      !positions.includes(primaryPosition) ||
      !Number.isFinite(travelKm) ||
      travelKm < 0 ||
      travelKm > 2000
    )
      return res
        .status(400)
        .json({
          message:
            "Primary position and travel distance (0–2000 km) are required",
        });
    if (
      !availability ||
      !["now", "dates", "weekdays", "unavailable"].includes(availability.mode)
    )
      return res.status(400).json({ message: "Choose your availability" });
    if (
      availability.mode === "dates" &&
      (!availability.start ||
        !availability.end ||
        !Number.isFinite(Date.parse(availability.start)) ||
        !Number.isFinite(Date.parse(availability.end)) ||
        new Date(availability.start) > new Date(availability.end))
    )
      return res
        .status(400)
        .json({ message: "Provide a valid availability date range" });
    if (
      availability.mode === "weekdays" &&
      (!Array.isArray(availability.weekdays) ||
        !availability.weekdays.length ||
        availability.weekdays.some(
          (d) => !Number.isInteger(d) || d < 0 || d > 6,
        ))
    )
      return res.status(400).json({ message: "Choose available weekdays" });
    if (
      !workTypes.length ||
      workTypes.some(
        (t) => !["Daywork", "Freelance", "Delivery"].includes(t),
      ) ||
      !workEligibilityCountries.length ||
      workEligibilityCountries.some(
        (c) => typeof c !== "string" || !c.trim(),
      ) ||
      !req.body.yachtSize?.trim() ||
      !req.body.dayRate?.trim()
    )
      return res
        .status(400)
        .json({
          message:
            "Work types, eligible countries, yacht-size experience and rate are required",
        });
    if (
      !contactPreferences.length ||
      contactPreferences.some(
        (c) => !["phone", "text", "email", "whatsapp"].includes(c),
      )
    )
      return res
        .status(400)
        .json({ message: "Choose approved contact methods" });
    if (
      contactPreferences.includes("whatsapp") &&
      !["true", true].includes(phoneWhatsApp)
    )
      return res
        .status(400)
        .json({ message: "Mark your phone as available on WhatsApp first" });
    if (!user.crewProfile) user.crewProfile = {};
    if (!user.crewProfile.documents) user.crewProfile.documents = {};
    const files = req.files || [];
    const fileMap = {};
    files.forEach((file) => {
      fileMap[file.fieldname] = file;
    });
    const applyFile = (field, required = false) => {
      const file = fileMap[field];
      if (file) {
        user.crewProfile.documents[field] = {
          data: file.buffer,
          contentType: file.mimetype,
          originalName: file.originalname,
        };
      } else if (required && !user.crewProfile.documents[field]?.data) {
        throw new Error(`${field.toUpperCase()} upload is required`);
      }
    };
    try {
      if (
        fileMap.photo &&
        !["image/jpeg", "image/png", "image/webp"].includes(
          fileMap.photo.mimetype,
        )
      )
        throw new Error("Photo must be an image");
      applyFile("photo", true);
      applyFile("cv", true);
      applyFile("stcw", true);
      applyFile("eng1", true);
      applyFile("references", true);
      applyFile("passport", true);
      applyFile("driversLicense", false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    const existingCerts =
      user.crewProfile.documents.additionalCertificates || [];
    const keptCerts = existingCerts.filter((_, index) =>
      keepAdditionalIndices.includes(index),
    );
    const newCertFiles = files.filter(
      (f) => f.fieldname === "additionalCertificates",
    );
    const newCerts = newCertFiles.map((file, i) => ({
      name: additionalCertificateNames[i] || file.originalname,
      data: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
    }));
    user.crewProfile.documents.additionalCertificates = [
      ...keptCerts,
      ...newCerts,
    ];
    const documentBytes = Object.values(
      user.crewProfile.documents.toObject?.() || user.crewProfile.documents,
    ).reduce(
      (n, d) =>
        n +
        (Array.isArray(d)
          ? d.reduce((a, c) => a + (c.data?.length || 0), 0)
          : d?.data?.length || 0),
      0,
    );
    if (documentBytes > 12 * 1024 * 1024)
      return res
        .status(400)
        .json({
          message:
            "Keep total profile documents under 12 MB. Compress larger scans before uploading.",
        });
    user.name = `${firstName.trim()} ${lastName.trim()}`;
    user.email = email.trim().toLowerCase();
    user.phone = phone.trim();
    user.crewProfile.firstName = firstName.trim();
    user.crewProfile.lastName = lastName.trim();
    user.crewProfile.phoneWhatsApp =
      phoneWhatsApp === "true" || phoneWhatsApp === true;
    user.crewProfile.alternatePhone = alternatePhone?.trim() || "";
    user.crewProfile.alternatePhoneWhatsApp =
      alternatePhoneWhatsApp === "true" || alternatePhoneWhatsApp === true;
    user.crewProfile.positions = positions;
    user.crewProfile.currentLocation = resolvedLocation;
    user.crewProfile.duration = duration;
    user.crewProfile.nationality = nationality;
    user.crewProfile.usWorkAuthorization =
      nationality === "Non-US" ? usWorkAuthorization : undefined;
    user.crewProfile.experience = experience;
    user.crewProfile.keywords = keywords;
    Object.assign(user.crewProfile, {
      primaryPosition,
      travelKm,
      availability,
      workTypes,
      workEligibilityCountries: workEligibilityCountries.map((c) => c.trim()),
      yachtSize: req.body.yachtSize.trim(),
      dayRate: req.body.dayRate.trim(),
      contactPreferences,
    });
    user.crewProfile.profileComplete = true;
    user.crewProfile.profileStatus =
      availability.mode === "unavailable" || profileStatus === "inactive"
        ? "inactive"
        : "active";
    user.crewProfile.profileLastActive = new Date();
    user.crewProfile.profileReminderSentAt = undefined;
    await user.save();
    res.json({
      message: "Profile saved successfully",
      profileComplete: true,
      profileStatus: user.crewProfile.profileStatus,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Email already in use by another account" });
    }
    res.status(400).json({ message: error.message });
  }
};
export const updateProfileStatus = async (req, res) => {
  try {
    const { profileStatus } = req.body;
    if (!["active", "inactive"].includes(profileStatus)) {
      return res
        .status(400)
        .json({ message: "Status must be active or inactive" });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.crewProfile?.profileComplete) {
      return res
        .status(400)
        .json({ message: "Complete your profile before changing status" });
    }
    if (
      profileStatus === "active" &&
      user.crewProfile.availability?.mode === "unavailable"
    )
      return res
        .status(400)
        .json({ message: "Update your available dates in My Profile first" });
    user.crewProfile.profileStatus = profileStatus;
    user.crewProfile.profileLastActive = new Date();
    if (profileStatus === "active") {
      user.crewProfile.profileReminderSentAt = undefined;
    }
    await user.save();
    res.json({
      profileStatus: user.crewProfile.profileStatus,
      profileLastActive: user.crewProfile.profileLastActive,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const getProfileDocument = async (req, res) => {
  try {
    const { index } = req.params;
    const docType =
      req.params.docType || (index !== undefined ? "additional" : undefined);
    const user = await User.findById(req.user._id);
    if (!user?.crewProfile?.documents) {
      return res.status(404).json({ message: "Document not found" });
    }
    let doc;
    if (docType === "additional") {
      doc =
        user.crewProfile.documents.additionalCertificates?.[
          parseInt(index, 10)
        ];
    } else {
      doc = user.crewProfile.documents[docType];
    }
    if (!doc?.data) {
      return res.status(404).json({ message: "Document not found" });
    }
    sendDocument(res, doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
