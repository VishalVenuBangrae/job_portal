import { approvedEmployer } from "../services/employerApproval.js";
// Role-based middleware
import Job from "../models/Job.js";

export const employerOnly = async (req, res, next) => {
  try {
    if (await approvedEmployer(req.user)) {
      next();
    } else {
      res
        .status(403)
        .json({
          message: "An approved employer account is required",
          code: "EMPLOYER_APPROVAL_REQUIRED",
        });
    }
  } catch (e) {
    next(e);
  }
};

export const jobseekerOnly = (req, res, next) => {
  if (req.user && req.user.userType === "jobseeker") {
    next();
  } else {
    res.status(403).json({ message: "Jobseeker access only" });
  }
};

export const jobOwnerOnly = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized as job owner" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
