import express from 'express';
import multer from 'multer';
import {
  getCrewProfile,
  saveCrewProfile,
  updateProfileStatus,
  getProfileDocument
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { jobseekerOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 25
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (JPEG, PNG, WebP) are allowed'));
    }
  }
});

router.use(protect, jobseekerOnly);

router.get('/', getCrewProfile);
router.post('/', (req, res, next) => {
  profileUpload.any()(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, saveCrewProfile);
router.patch('/status', updateProfileStatus);
router.get('/documents/additional/:index', getProfileDocument);
router.get('/documents/:docType', getProfileDocument);

export default router;
