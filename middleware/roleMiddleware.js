// Role-based middleware
import Job from '../models/Job.js';

export const employerOnly = (req, res, next) => {
  if (req.user && req.user.userType === 'employer') {
    next();
  } else {
    res.status(403).json({ message: 'Employer access only' });
  }
};

export const jobseekerOnly = (req, res, next) => {
  if (req.user && req.user.userType === 'jobseeker') {
    next();
  } else {
    res.status(403).json({ message: 'Jobseeker access only' });
  }
};

export const jobOwnerOnly = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized as job owner' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 