import express from 'express';
import { getProfile, getUserPoints } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get Profile
router.get('/profile', authenticateToken, getProfile);

// Get Real-Time Points (SINGLE SOURCE)
router.get('/points', authenticateToken, getUserPoints);

export default router;
