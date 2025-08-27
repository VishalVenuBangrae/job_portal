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

// Protected routes (admin only)
router.get('/all', protect, getAllLocations);
router.post('/add', protect, addLocation);
router.post('/sync-api', protect, syncYachtPortsFromAPI);

export default router;
