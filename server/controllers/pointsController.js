import pool from "../config/database.js";

export const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [[row]] = await pool.execute(
      `SELECT total_points FROM user WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, points: row.total_points || 0 });
  } catch (error) {
    console.error("❌ Points fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch points" });
  }
};
