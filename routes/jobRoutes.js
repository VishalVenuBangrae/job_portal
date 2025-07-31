import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyToJob,
  getAppliedJobs,
  getPostedJobs,
  getJobApplications,
  updateApplicationStatus
} from '../controllers/jobController.js';
import { protect } from '../middleware/authMiddleware.js';
import { employerOnly, jobseekerOnly, jobOwnerOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public
router.get('/', getJobs);

// Protected (employer)
router.post('/', protect, employerOnly, createJob);
router.get('/posted', protect, employerOnly, getPostedJobs);

// Protected (jobseeker)
router.get('/applied', protect, jobseekerOnly, getAppliedJobs);

// Update application status (employer only)
router.put('/applications/:applicationId/status', protect, employerOnly, updateApplicationStatus);

// Protected (jobseeker) - with file upload
router.post('/:id/apply', protect, jobseekerOnly, (req, res, next) => {
  // Get upload middleware from app.locals
  const upload = req.app.locals.upload;
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, applyToJob);

// View applications for a job (employer, owner only)
router.get('/:id/applications', protect, employerOnly, jobOwnerOnly, getJobApplications);

// Job CRUD operations (employer only)
router.get('/:id', getJobById);
router.put('/:id', protect, employerOnly, jobOwnerOnly, updateJob);
router.delete('/:id', protect, employerOnly, jobOwnerOnly, deleteJob);

export default router; 