// Job controller stubs
import Job from '../models/Job.js';
import User from '../models/User.js';

export const createJob = async (req, res) => {
  try {
    const { title, company, location, description, requirements, salary, jobType } = req.body;
    if (!title || !company || !location || !description || !salary || !jobType) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    const job = new Job({
      title,
      company,
      location,
      description,
      requirements,
      salary,
      jobType,
      employer: req.user._id
    });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('employer', 'name email');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('employer', 'name email');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const updates = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
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
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const applyToJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // Prevent duplicate applications
    if (job.applications.some(app => app.applicant.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }
    // Add application to job
    job.applications.push({ applicant: req.user._id });
    await job.save();
    // Add job to user's appliedJobs
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { appliedJobs: job._id } });
    res.json({ message: 'Applied to job successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAppliedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'appliedJobs',
      populate: { path: 'employer', select: 'name email' }
    });
    res.json(user.appliedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPostedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: 'applications.applicant',
      select: 'name email profile.resume'
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(job.applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 