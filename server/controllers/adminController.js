// server/controllers/adminController.js
import pool from '../config/database.js';

/**
 * GET /api/admin/stats
 * Return summary stats for admin dashboard
 */
export const getAdminStats = async (req, res) => {
  try {
    // total users
    const [[{ total_users }]] = await pool.execute(`SELECT COUNT(*) AS total_users FROM user`);
    // total challenges
    const [[{ total_challenges }]] = await pool.execute(`SELECT COUNT(*) AS total_challenges FROM challenges`);
    // total rewards
    const [[{ total_rewards }]] = await pool.execute(`SELECT COUNT(*) AS total_rewards FROM reward`);
    // total activities
    const [[{ total_activities }]] = await pool.execute(`SELECT COUNT(*) AS total_activities FROM activity`);

    // recent activities (last 10)
    const [recentActivities] = await pool.execute(
      `SELECT a.activity_id, a.activity_date, a.calculated_emission, a.points_earned, ef.activity_name, u.first_name, u.last_name
       FROM activity a
       LEFT JOIN emission_factor ef ON a.factor_id = ef.factor_id
       LEFT JOIN user u ON a.user_id = u.user_id
       ORDER BY a.activity_date DESC, a.created_at DESC
       LIMIT 10`
    );

    return res.json({
      success: true,
      data: {
        total_users,
        total_challenges,
        total_rewards,
        total_activities,
        recentActivities
      }
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
};

/**
 * GET /api/admin/users
 */
export const listUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT user_id, first_name, last_name, email, user_type, total_points, date_joined
       FROM user
       ORDER BY date_joined DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ listUsers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

/**
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  const userId = req.params.id;
  try {
    // prevent deleting own admin accidentally
    if (Number(userId) === Number(req.user.userId)) {
      return res.status(400).json({ success: false, message: 'Cannot delete current admin account' });
    }

    await pool.execute(`DELETE FROM user WHERE user_id = ?`, [userId]);
    return res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('❌ deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

/* ------------------ Challenges management ------------------ */

/**
 * GET /api/admin/challenges
 */
export const listChallengesAdmin = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT challenge_id, challenge_name, category, start_date, end_date, is_active, participant_count, reward_points
       FROM challenges
       ORDER BY start_date DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ listChallengesAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch challenges' });
  }
};

/**
 * POST /api/admin/challenges
 */
export const addChallengeAdmin = async (req, res) => {
  const {
    challenge_name,
    description,
    category,
    target_reduction,
    reward_points,
    start_date,
    end_date,
    is_active = 1
  } = req.body;

  try {
    if (!challenge_name || !description || !category || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      `INSERT INTO challenges
        (challenge_name, description, category, target_reduction, reward_points, start_date, end_date, is_active, created_by_user_id, participant_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [challenge_name, description, category, target_reduction || 0, reward_points || 0, start_date, end_date, is_active, req.user.userId]
    );

    return res.json({ success: true, message: 'Challenge created', challenge_id: result.insertId });
  } catch (error) {
    console.error('❌ addChallengeAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add challenge' });
  }
};

/**
 * PUT /api/admin/challenges/:id
 */
export const updateChallengeAdmin = async (req, res) => {
  const challengeId = req.params.id;
  const {
    challenge_name,
    description,
    category,
    target_reduction,
    reward_points,
    start_date,
    end_date,
    is_active
  } = req.body;

  try {
    await pool.execute(
      `UPDATE challenges SET challenge_name = ?, description = ?, category = ?, target_reduction = ?, reward_points = ?, start_date = ?, end_date = ?, is_active = ?
       WHERE challenge_id = ?`,
      [challenge_name, description, category, target_reduction || 0, reward_points || 0, start_date, end_date, is_active, challengeId]
    );

    return res.json({ success: true, message: 'Challenge updated' });
  } catch (error) {
    console.error('❌ updateChallengeAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update challenge' });
  }
};

/**
 * DELETE /api/admin/challenges/:id
 */
export const deleteChallengeAdmin = async (req, res) => {
  const challengeId = req.params.id;
  try {
    await pool.execute(`DELETE FROM challenges WHERE challenge_id = ?`, [challengeId]);
    // Optionally delete user_challenges entries if you want:
    await pool.execute(`DELETE FROM user_challenges WHERE challenge_id = ?`, [challengeId]);
    return res.json({ success: true, message: 'Challenge deleted' });
  } catch (error) {
    console.error('❌ deleteChallengeAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete challenge' });
  }
};

/* ------------------ Rewards management ------------------ */

/**
 * GET /api/admin/rewards
 */
export const listRewardsAdmin = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT reward_id, name, description, points_required, stock_count FROM reward ORDER BY points_required ASC`
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ listRewardsAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch rewards' });
  }
};

/**
 * POST /api/admin/rewards
 */
export const addRewardAdmin = async (req, res) => {
  const { name, description, points_required, stock_count } = req.body;
  try {
    if (!name || !points_required) {
      return res.status(400).json({ success: false, message: 'Name and points_required are required' });
    }
    const [result] = await pool.execute(
      `INSERT INTO reward (name, description, points_required, stock_count) VALUES (?, ?, ?, ?)`,
      [name, description || null, points_required, stock_count || 0]
    );
    return res.json({ success: true, message: 'Reward added', reward_id: result.insertId });
  } catch (error) {
    console.error('❌ addRewardAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add reward' });
  }
};

/**
 * PUT /api/admin/rewards/:id
 */
export const updateRewardAdmin = async (req, res) => {
  const rewardId = req.params.id;
  const { name, description, points_required, stock_count } = req.body;
  try {
    await pool.execute(
      `UPDATE reward SET name = ?, description = ?, points_required = ?, stock_count = ? WHERE reward_id = ?`,
      [name, description || null, points_required, stock_count, rewardId]
    );
    return res.json({ success: true, message: 'Reward updated' });
  } catch (error) {
    console.error('❌ updateRewardAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update reward' });
  }
};

/**
 * DELETE /api/admin/rewards/:id
 */
export const deleteRewardAdmin = async (req, res) => {
  const rewardId = req.params.id;
  try {
    await pool.execute(`DELETE FROM reward WHERE reward_id = ?`, [rewardId]);
    // Optionally remove redemption entries for data consistency (or keep them)
    await pool.execute(`DELETE FROM redemption WHERE reward_id = ?`, [rewardId]);
    return res.json({ success: true, message: 'Reward deleted' });
  } catch (error) {
    console.error('❌ deleteRewardAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete reward' });
  }
};
