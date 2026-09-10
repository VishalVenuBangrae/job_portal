import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const fileDocSchema = {
  data: Buffer,
  contentType: String,
  originalName: String,
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
    },
    userType: {
      type: String,
      enum: ["jobseeker", "employer"],
      required: true,
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
      trim: true,
    },
    // For job seekers
    profile: {
      resetCode: String,
      resetCodeExpiry: Date,
      phone: String,
      location: String,
      skills: [String],
      experience: String,
      education: String,
      resume: {
        data: Buffer,
        contentType: String,
      },
    },
    vessel: { name: String, callSign: String, mmsi: String, imo: String },
    termsAcceptedAt: Date,
    termsVersion: String,
    tokenVersion: { type: Number, default: 0 },
    emailVerificationExpiry: Date,
    resetEmailCode: String,
    resetEmailCodeExpiry: Date,
    // For job seekers - track applied jobs
    appliedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    // For employers - track posted jobs
    postedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: String,
    crewProfile: {
      profileComplete: { type: Boolean, default: false },
      profileStatus: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
      },
      profileLastActive: { type: Date, default: Date.now },
      profileReminderSentAt: Date,
      primaryPosition: String,
      travelKm: { type: Number, min: 0, max: 2000 },
      availability: {
        mode: {
          type: String,
          enum: ["now", "dates", "weekdays", "unavailable"],
        },
        start: Date,
        end: Date,
        weekdays: [Number],
      },
      workTypes: [String],
      workEligibilityCountries: [String],
      yachtSize: String,
      dayRate: String,
      contactPreferences: [String],
      firstName: String,
      lastName: String,
      phoneWhatsApp: { type: Boolean, default: false },
      alternatePhone: String,
      alternatePhoneWhatsApp: { type: Boolean, default: false },
      positions: [
        {
          type: String,
          enum: [
            "Captain",
            "Bosun",
            "Chef",
            "Interior",
            "Chief Stew",
            "Engineer",
            "Deck hand",
            "Deckhand",
            "Mate",
            "Exterior",
            "Stewardess",
          ],
        },
      ],
      currentLocation: {
        city: String,
        state: String,
        country: String,
        port: String,
        coordinates: { latitude: Number, longitude: Number },
        displayName: String,
      },
      duration: {
        type: String,
        enum: [
          "1 day",
          "2 days",
          "3 days",
          "4 days",
          "5 days",
          "6 days",
          "7 days",
        ],
      },
      nationality: { type: String, enum: ["US", "Non-US"] },
      usWorkAuthorization: {
        type: String,
        enum: ["B1/B2", "Green Card", "Other", "Not applicable"],
      },
      experience: [
        {
          type: String,
          enum: ["Green", "6 months - 1 year", "1 year +"],
        },
      ],
      keywords: [String],
      documents: {
        photo: fileDocSchema,
        cv: fileDocSchema,
        stcw: fileDocSchema,
        eng1: fileDocSchema,
        references: fileDocSchema,
        passport: fileDocSchema,
        driversLicense: fileDocSchema,
        additionalCertificates: [
          {
            name: String,
            data: Buffer,
            contentType: String,
            originalName: String,
          },
        ],
      },
    },
  },
  {
    timestamps: true,
  },
);

// Password validation and hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  // Password strength validation (relaxed for development)
  const password = this.password;
  const minLength = 6; // Reduced from 8 for development

  if (password.length < minLength) {
    return next(new Error("Password must be at least 6 characters long"));
  }

  // Optional: Uncomment for stricter password requirements in production
  /*
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUppercase) {
        return next(new Error('Password must contain at least one uppercase letter'));
    }
    if (!hasLowercase) {
        return next(new Error('Password must contain at least one lowercase letter'));
    }
    if (!hasNumbers) {
        return next(new Error('Password must contain at least one number'));
    }
    if (!hasSpecialChars) {
        return next(new Error('Password must contain at least one special character'));
    }
    */

  // Hash password with higher salt rounds for security
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
