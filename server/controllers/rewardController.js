import pool from '../config/database.js';

/**
 * ✅ Get all available rewards
 */
export const getRewards = async (req, res) => {
  try {
    const [rewards] = await pool.execute(
      `SELECT reward_id, name, description, points_required, stock_count
       FROM reward
       WHERE stock_count > 0
       ORDER BY points_required ASC`
    );

    res.json({ success: true, data: rewards });
  } catch (error) {
    console.error('❌ Error fetching rewards:', error);
    res.status(500).json({ success: false, message: 'Failed to load rewards.' });
  }
};

/**
 * ✅ Redeem a reward
 */
export const redeemReward = async (req, res) => {
  const userId = req.user?.userId;
  const { reward_id } = req.body;

  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!reward_id) return res.status(400).json({ success: false, message: 'reward_id required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // lock reward row
    const [[rewardRow]] = await conn.execute(
      `SELECT reward_id, name, points_required, stock_count
       FROM reward WHERE reward_id = ? FOR UPDATE`,
      [reward_id]
    );
    if (!rewardRow) throw new Error('Reward not found');
    if (rewardRow.stock_count <= 0) throw new Error('Reward out of stock');

    // lock user row
    const [[userRow]] = await conn.execute(
      `SELECT user_id, total_points FROM user WHERE user_id = ? FOR UPDATE`,
      [userId]
    );
    if (!userRow) throw new Error('User not found');

    const available = Number(userRow.total_points || 0);
    if (available < rewardRow.points_required) throw new Error('Not enough points');

    // decrement stock
    await conn.execute(
      `UPDATE reward SET stock_count = stock_count - 1 WHERE reward_id = ?`,
      [rewardRow.reward_id]
    );

    // insert redemption
    await conn.execute(
      `INSERT INTO redemption (user_id, reward_id, points_spent) VALUES (?, ?, ?)`,
      [userId, rewardRow.reward_id, rewardRow.points_required]
    );

    // update user's total_points atomically
    await conn.execute(
      `UPDATE user SET total_points = total_points - ? WHERE user_id = ?`,
      [rewardRow.points_required, userId]
    );

    await conn.commit();
    conn.release();

    return res.json({ success: true, message: `Redeemed ${rewardRow.name}`, new_balance: available - rewardRow.points_required });

  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Redeem error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};



/**
 * ✅ Get redemption history for current user
 */
export const getRedemptionHistory = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT r.redemption_id, rw.name, rw.description, r.points_spent, r.redumption_date
       FROM redemption r
       JOIN reward rw ON r.reward_id = rw.reward_id
       WHERE r.user_id = ?
       ORDER BY r.redumption_date DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ Get redemption history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch redemption history' });
  }
};
