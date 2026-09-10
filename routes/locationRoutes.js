import express from 'express';
import {
  getCountries,
  getCitiesByCountry,
  getPortsByCity,
  getAllLocations,
  addLocation,
  searchLocations,
  getPopularLocations,
  getAllPorts,
  fetchYachtPortsFromAPI,
  syncYachtPortsFromAPI
} from '../controllers/locationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/countries', getCountries);
router.get('/cities/:country', getCitiesByCountry);
router.get('/ports/:country/:city', getPortsByCity);
router.get('/all-ports', getAllPorts);
router.get('/api-ports', fetchYachtPortsFromAPI);
router.get('/search', searchLocations);
router.get('/popular', getPopularLocations);

// Mutations are restricted to explicitly configured staff accounts.
const staffOnly=(req,res,next)=> (process.env.ADMIN_EMAILS || '').split(',').map(s=>s.trim()).includes(req.user.email)?next():res.status(403).json({message:'Staff access required'});
// Protected routes (admin only)
router.get('/all', protect, staffOnly, getAllLocations);
router.post('/add', protect, staffOnly, addLocation);
router.post('/sync-api', protect, staffOnly, syncYachtPortsFromAPI);

export default router;
