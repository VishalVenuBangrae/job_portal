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
  getJobApplications
} from '../controllers/jobController.js';
import { protect } from '../middleware/authMiddleware.js';
import { employerOnly, jobseekerOnly, jobOwnerOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected (employer)
router.post('/', protect, employerOnly, createJob);
router.put('/:id', protect, employerOnly, jobOwnerOnly, updateJob);
router.delete('/:id', protect, employerOnly, jobOwnerOnly, deleteJob);
router.get('/posted', protect, employerOnly, getPostedJobs);

// Protected (jobseeker)
router.post('/:id/apply', protect, jobseekerOnly, applyToJob);
router.get('/applied', protect, jobseekerOnly, getAppliedJobs);

// View applications for a job (employer, owner only)
router.get('/:id/applications', protect, employerOnly, jobOwnerOnly, getJobApplications);

export default router; 