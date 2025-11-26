import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Get total earned points from activity table
 */
router.get('/earned', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [[row]] = await pool.execute(
      `SELECT COALESCE(SUM(points_earned), 0) AS total
       FROM activity
       WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, total: row.total });
  } catch (error) {
    console.error('❌ Error fetching earned points:', error);
    res.status(500).json({ success: false, message: 'Failed to get earned points' });
  }
});

/**
 * Get total spent points from redemption table
 */
router.get('/spent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [[row]] = await pool.execute(
      `SELECT COALESCE(SUM(points_spent), 0) AS total
       FROM redemption
       WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, total: row.total });
  } catch (error) {
    console.error('❌ Error fetching spent points:', error);
    res.status(500).json({ success: false, message: 'Failed to get spent points' });
  }
});

export default router;
