import { profileReady } from "../services/profileReadiness.js";
import { resolveCoordinates } from "../services/locationResolver.js";
// Job controller stubs
import Job from "../models/Job.js";
import User from "../models/User.js";
import { publicJob, openJob, TAGS } from "../services/matching.js";
export const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      description,
      requirements,
      salary,
      jobType,
      jobCategory,
      position,
      vesselFlag,
      startDate,
      endDate,
      crewNeeded,
      department,
      tags = [],
      requiredCertificates = [],
    } = req.body;
    if (
      !title ||
      !location ||
      !description ||
      !salary ||
      !jobType ||
      !position ||
      !vesselFlag
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }
    if (
      !req.user.vessel?.name ||
      !(req.user.vessel.callSign || req.user.vessel.mmsi)
    )
      return res
        .status(400)
        .json({ message: "Complete your vessel identity in Settings first" });
    if (
      !startDate ||
      !endDate ||
      !Number.isFinite(Date.parse(startDate)) ||
      !Number.isFinite(Date.parse(endDate)) ||
      new Date(startDate) > new Date(endDate) ||
      new Date(endDate) < new Date(new Date().toISOString().slice(0, 10)) ||
      !Number.isInteger(crewNeeded) ||
      crewNeeded < 1 ||
      crewNeeded > 100
    )
      return res
        .status(400)
        .json({
          message: "Valid job dates and crew count (1–100) are required",
        });
    if (
      !TAGS[department] ||
      !Array.isArray(tags) ||
      tags.some((t) => !TAGS[department].includes(t)) ||
      !Array.isArray(requiredCertificates) ||
      requiredCertificates.some((c) => !["stcw", "eng1"].includes(c))
    )
      return res
        .status(400)
        .json({ message: "Select a department and valid skills/certificates" });
    // Validate location structure
    if (!location.country || !location.city || !location.displayName) {
      return res
        .status(400)
        .json({
          message: "Location must include country, city, and display name",
        });
    }
    location.coordinates = await resolveCoordinates(location);
    const job = new Job({
      title,
      company,
      location,
      description,
      requirements,
      salary,
      jobType,
      jobCategory: jobCategory || jobType,
      position,
      vesselFlag,
      startDate,
      endDate,
      crewNeeded,
      department,
      tags,
      requiredCertificates,
      employer: req.user._id,
    });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getJobs = async (req, res) => {
  try {
    const {
      country,
      city,
      port,
      jobCategory,
      position,
      jobType,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    // Build filter object
    const filter = {
      status: "active",
      endDate: { $gte: new Date(new Date().toISOString().slice(0, 10)) },
    };
    const safeRegex = (value) =>
      String(value)
        .slice(0, 120)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Location filters
    if (country) {
      filter["location.country"] = {
        $regex: safeRegex(country),
        $options: "i",
      };
    }
    if (city) {
      filter["location.city"] = { $regex: safeRegex(city), $options: "i" };
    }
    if (port) {
      filter["location.port"] = { $regex: safeRegex(port), $options: "i" };
    }
    // Job filters
    if (jobCategory) {
      filter.jobCategory = jobCategory;
    }
    if (position) {
      filter.position = position;
    }
    if (jobType) {
      filter.jobType = jobType;
    }
    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: safeRegex(search), $options: "i" } },
        { description: { $regex: safeRegex(search), $options: "i" } },
        {
          "location.displayName": { $regex: safeRegex(search), $options: "i" },
        },
      ];
    }
    // Sort options
    const sortOptions = {};
    sortOptions[
      ["createdAt", "startDate", "title"].includes(sortBy)
        ? sortBy
        : "createdAt"
    ] = sortOrder === "desc" ? -1 : 1;
    const jobs = await Job.find(filter)
      .select("-applications -contacts -employer -company")
      .sort(sortOptions)
      .limit(200);
    res.json(jobs.map(publicJob));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).select(
      "-applications -contacts -employer -company",
    );
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(publicJob(job));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateJob = async (req, res) => {
  try {
    const allowed = [
      "status",
      "title",
      "description",
      "location",
      "salary",
      "jobType",
      "position",
      "vesselFlag",
      "startDate",
      "endDate",
      "crewNeeded",
      "department",
      "tags",
      "requiredCertificates",
    ];
    if (Object.keys(req.body).some((k) => !allowed.includes(k)))
      return res.status(400).json({ message: "Unsupported job update" });
    const existing = await Job.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Job not found" });
    const details = Object.keys(req.body).some((k) => k !== "status");
    if (details && (existing.contacts.length || existing.applications.length))
      return res
        .status(409)
        .json({
          message:
            "This job already has crew activity. Close it and post a new job for changed requirements.",
        });
    const status = req.body.status || existing.status;
    if (!["active", "closed", "filled", "cancelled"].includes(status))
      return res.status(400).json({ message: "Invalid job status" });
    if (
      status === "active" &&
      (!existing.endDate ||
        existing.endDate < new Date(new Date().toISOString().slice(0, 10)))
    )
      return res
        .status(400)
        .json({ message: "Expired jobs cannot be reopened" });
    const merged = { ...existing.toObject(), ...req.body };
    if (
      details &&
      (!merged.startDate ||
        !merged.endDate ||
        !Number.isFinite(Date.parse(merged.startDate)) ||
        !Number.isFinite(Date.parse(merged.endDate)) ||
        new Date(merged.startDate) > new Date(merged.endDate) ||
        !Number.isInteger(merged.crewNeeded) ||
        merged.crewNeeded < 1 ||
        merged.crewNeeded > 100 ||
        !TAGS[merged.department] ||
        !Array.isArray(merged.tags) ||
        merged.tags.some((t) => !TAGS[merged.department].includes(t)))
    )
      return res
        .status(400)
        .json({
          message: "Invalid job dates, crew count or department skills",
        });
    if (req.body.location)
      req.body.location.coordinates = await resolveCoordinates(
        req.body.location,
      );
    const filter = { _id: req.params.id, employer: req.user._id };
    if (details) {
      filter["contacts.0"] = { $exists: false };
      filter["applications.0"] = { $exists: false };
    }
    const job = await Job.findOneAndUpdate(
      filter,
      { $set: { ...req.body, status } },
      { new: true, runValidators: true },
    );
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const applyToJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (!profileReady(req.user.crewProfile))
      return res
        .status(403)
        .json({ message: "Complete your crew profile first" });
    if (!openJob(job))
      return res
        .status(409)
        .json({ message: "This job is no longer accepting applications" });
    // Prevent duplicate applications
    if (
      job.applications.some(
        (app) => app.applicant.toString() === req.user._id.toString(),
      )
    ) {
      return res.status(400).json({ message: "Already applied to this job" });
    }
    const { email, phone, coverLetter } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    let resumeData = null;
    if (req.file) {
      resumeData = {
        data: req.file.buffer,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
      };
    } else {
      return res.status(400).json({ message: "Resume file is required" });
    }
    // Add application to job
    job.applications.push({
      applicant: req.user._id,
      applicantName: req.user.name, // Store applicant name
      email: req.user.email,
      phone: req.user.phone,
      resume: resumeData,
      coverLetter,
    });
    const application = job.applications[job.applications.length - 1];
    const saved = await Job.updateOne(
      {
        _id: job._id,
        status: "active",
        "applications.applicant": { $ne: req.user._id },
      },
      { $push: { applications: application.toObject() } },
    );
    if (!saved.modifiedCount)
      return res.status(409).json({ message: "Already applied or job closed" });
    // Add job to user's appliedJobs
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { appliedJobs: job._id },
    });
    res.json({ message: "Applied to job successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAppliedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "appliedJobs",
      populate: { path: "employer", select: "name email" },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Get detailed application information
    const appliedJobsWithDetails = await Promise.all(
      user.appliedJobs.map(async (job) => {
        const jobDoc = await Job.findById(job._id);
        if (!jobDoc) {
          return null;
        }
        const application = jobDoc.applications.find(
          (app) => app.applicant.toString() === req.user._id.toString(),
        );
        return {
          ...publicJob(job),
          appliedAt: application ? application.appliedAt : null,
          status: application ? application.status : "pending",
        };
      }),
    );
    // Filter out null values
    const validJobs = appliedJobsWithDetails.filter((job) => job !== null);
    res.json(validJobs);
  } catch (error) {
    console.error("getAppliedJobs error:", error.message);
    res.status(500).json({
      message: "Error fetching applied jobs",
    });
  }
};
export const getPostedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .select("-applications.resume.data")
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: "applications.applicant",
      select: "name",
    });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    // Return all application details
    res.json(
      job.applications.map((a) => ({
        _id: a._id,
        applicant: a.applicant,
        status: a.status,
        appliedAt: a.appliedAt,
        coverLetter: a.coverLetter,
        email: openJob(job) ? a.email : undefined,
        phone: openJob(job) ? a.phone : undefined,
        hasResume: openJob(job) && !!a.resume?.data,
      })),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getResumeFile = async (req, res) => {
  try {
    const { applicationId } = req.params;
    // Find the job that contains this application
    const job = await Job.findOne({
      "applications._id": applicationId,
      employer: req.user._id,
    });
    if (!job) {
      return res
        .status(404)
        .json({ message: "Application not found or not authorized" });
    }
    if (!openJob(job))
      return res
        .status(403)
        .json({ message: "Document access is closed for this job" });
    // Get the application
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (!application.resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    // Handle both old and new resume formats
    let resumeData, originalName, mimetype;
    if (application.resume.data) {
      // New format - data stored in database
      resumeData = application.resume.data;
      originalName = application.resume.originalName;
      mimetype = application.resume.mimetype;
    } else if (application.resume.filename) {
      // Old format - file stored on disk
      return res.status(404).json({
        message:
          "This resume was uploaded before the system update. Please contact the applicant to re-upload their resume.",
        code: "OLD_FORMAT",
      });
    } else {
      return res.status(404).json({ message: "Resume not found" });
    }
    // Set appropriate headers
    res.set({
      "Content-Type": mimetype,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(originalName || "resume.pdf")}`,
      "Content-Length": resumeData.length,
    });
    // Send the file data
    res.send(resumeData);
  } catch (error) {
    console.error("getResumeFile error:", error.message);
    res.status(500).json({
      message: "Error retrieving resume file",
    });
  }
};
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { applicationId } = req.params;
    if (!["pending", "reviewed", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    // Find the job that contains this application
    const job = await Job.findOne({
      "applications._id": applicationId,
      employer: req.user._id,
    });
    if (!job) {
      return res
        .status(404)
        .json({ message: "Application not found or not authorized" });
    }
    // Update the application status
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    application.status = status;
    // Save without validation to avoid issues with old job data
    await job.save({ validateBeforeSave: false });
    res.json({ message: "Application status updated successfully", status });
  } catch (error) {
    console.error("updateApplicationStatus error:", error.message);
    res.status(500).json({
      message: "Error updating application status",
    });
  }
};
export const deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    // Find the job that contains this application
    const job = await Job.findOne({
      "applications._id": applicationId,
      employer: req.user._id,
    });
    if (!job) {
      return res
        .status(404)
        .json({ message: "Application not found or not authorized" });
    }
    // Get the application
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    // Only allow deletion of rejected applications
    if (application.status !== "rejected") {
      return res
        .status(400)
        .json({ message: "Only rejected applications can be deleted" });
    }
    // Remove the application from the job
    job.applications.pull(applicationId);
    await job.save({ validateBeforeSave: false });
    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("deleteApplication error:", error.message);
    res.status(500).json({
      message: "Error deleting application",
    });
  }
};
