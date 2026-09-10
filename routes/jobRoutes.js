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
  updateApplicationStatus,
  getResumeFile,
  deleteApplication
} from '../controllers/jobController.js';
import { protect } from '../middleware/authMiddleware.js';
import { employerOnly, jobseekerOnly, jobOwnerOnly } from '../middleware/roleMiddleware.js';

import {getMatches,unlockCrew,getContacts,contactDocument,matchPhoto,setOutcome} from '../controllers/matchController.js';
const router = express.Router();

router.get('/:id/matches',protect,employerOnly,getMatches);
router.post('/:id/contacts/:crewId',protect,employerOnly,unlockCrew);
router.get('/:id/contacts',protect,employerOnly,getContacts);
router.get('/:id/contacts/:crewId/documents/:docType',protect,employerOnly,contactDocument);
router.get('/:id/matches/:crewId/photo',protect,employerOnly,matchPhoto);
router.post('/:id/outcomes/:crewId',protect,setOutcome);
// Public
router.get('/', getJobs);

// Protected (employer)
router.post('/', protect, employerOnly, createJob);
router.get('/posted', protect, employerOnly, getPostedJobs);

// Protected (jobseeker)
router.get('/applied', protect, jobseekerOnly, getAppliedJobs);

// Update application status (employer only)
router.put('/applications/:applicationId/status', protect, employerOnly, updateApplicationStatus);

// Delete application (employer only - only rejected applications)
router.delete('/applications/:applicationId', protect, employerOnly, deleteApplication);

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

// Serve resume file (protected - only job owner can access)
router.get('/applications/:applicationId/resume', protect, employerOnly, getResumeFile);

// Job CRUD operations (employer only)
router.get('/:id', getJobById);
router.put('/:id', protect, employerOnly, jobOwnerOnly, updateJob);
router.delete('/:id', protect, employerOnly, jobOwnerOnly, deleteJob);

export default router; 