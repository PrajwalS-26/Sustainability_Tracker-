// server/routes/adminRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import requireAdmin from '../middleware/adminMiddleware.js';
import {
  getAdminStats,
  listUsers,
  deleteUser,
  listChallengesAdmin,
  addChallengeAdmin,
  updateChallengeAdmin,
  deleteChallengeAdmin,
  listRewardsAdmin,
  addRewardAdmin,
  updateRewardAdmin,
  deleteRewardAdmin
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require valid token + admin role
router.use(authenticateToken, requireAdmin);

// stats
router.get('/stats', getAdminStats);

// users
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);

// challenges
router.get('/challenges', listChallengesAdmin);
router.post('/challenges', addChallengeAdmin);
router.put('/challenges/:id', updateChallengeAdmin);
router.delete('/challenges/:id', deleteChallengeAdmin);

// rewards
router.get('/rewards', listRewardsAdmin);
router.post('/rewards', addRewardAdmin);
router.put('/rewards/:id', updateRewardAdmin);
router.delete('/rewards/:id', deleteRewardAdmin);

export default router;
