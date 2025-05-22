import express from "express";
import { testDB, testAuth } from "../controllers/testController.js";
import { protect } from "../middleware/authMiddleware.js";

//router object

const router = express.Router();

//routes
router.get('/db', testDB);
router.get('/auth', protect, testAuth);

//export 
export default router;