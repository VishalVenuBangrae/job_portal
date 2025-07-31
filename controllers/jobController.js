// Job controller stubs
import Job from '../models/Job.js';
import User from '../models/User.js';

export const createJob = async (req, res) => {
  try {
    const { title, company, location, description, requirements, salary, jobType, jobCategory, position } = req.body;
    if (!title || !company || !location || !description || !salary || !jobType || !jobCategory || !position) {
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
      jobCategory,
      position,
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
    
    const { email, phone, coverLetter } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let resumeData = null;
    if (req.file) {
      resumeData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype
      };
    } else {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    // Add application to job
    job.applications.push({ 
      applicant: req.user._id, 
      applicantName: req.user.name, // Store applicant name
      email, 
      phone, 
      resume: resumeData, 
      coverLetter 
    });
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
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get detailed application information
    const appliedJobsWithDetails = await Promise.all(
      user.appliedJobs.map(async (job) => {
        const jobDoc = await Job.findById(job._id);
        if (!jobDoc) {
          return null;
        }
        
        const application = jobDoc.applications.find(app => 
          app.applicant.toString() === req.user._id.toString()
        );
        
        return {
          ...job.toObject(),
          appliedAt: application ? application.appliedAt : null,
          status: application ? application.status : 'pending'
        };
      })
    );
    
    // Filter out null values
    const validJobs = appliedJobsWithDetails.filter(job => job !== null);
    
    res.json(validJobs);
  } catch (error) {
    console.error('getAppliedJobs error:', error.message);
    res.status(500).json({ 
      message: 'Error fetching applied jobs'
    });
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
      select: 'name email phone profile.resume'
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Return all application details
    res.json(job.applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { applicationId } = req.params;
    
    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the job that contains this application
    const job = await Job.findOne({
      'applications._id': applicationId,
      employer: req.user._id
    });

    if (!job) {
      return res.status(404).json({ message: 'Application not found or not authorized' });
    }
    
    // Update the application status
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    
    // Save without validation to avoid issues with old job data
    await job.save({ validateBeforeSave: false });
    
    res.json({ message: 'Application status updated successfully', application });
  } catch (error) {
    console.error('updateApplicationStatus error:', error.message);
    res.status(500).json({ 
      message: 'Error updating application status'
    });
  }
}; 