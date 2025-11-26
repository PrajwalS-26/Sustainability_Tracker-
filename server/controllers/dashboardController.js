// server/controllers/dashboardController.js
import pool from "../config/database.js";

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1) Fetch user + final total_points from DB
    const [[userRow]] = await pool.execute(
      `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.total_points,       
        u.date_joined,
        COUNT(a.activity_id) AS total_activities,
        COALESCE(SUM(a.calculated_emission), 0) AS total_emission
      FROM user u
      LEFT JOIN activity a ON u.user_id = a.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
      `,
      [userId]
    );

    if (!userRow) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2) Weekly emissions
    const [[weekly]] = await pool.execute(
      `
      SELECT
        (SELECT COALESCE(SUM(calculated_emission), 0)
         FROM activity
         WHERE user_id = ?
           AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) AS this_week,
        (SELECT COALESCE(SUM(calculated_emission), 0)
         FROM activity
         WHERE user_id = ?
           AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
           AND activity_date <  DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) AS last_week
      `,
      [userId, userId]
    );

    const thisWeek = Number(weekly.this_week) || 0;
    const lastWeek = Number(weekly.last_week) || 0;
    const delta = lastWeek - thisWeek;

    // 3) Weekly points calculation
    let weeklyPoints = 0;
    if (lastWeek > 0 && delta > 0) {
      weeklyPoints = Math.round((delta / lastWeek) * 50);
      if (weeklyPoints < 5) weeklyPoints = 5;
      if (weeklyPoints > 50) weeklyPoints = 50;
    }

    // 4) Award on Monday only
    const today = new Date();
    const isMonday = today.getDay() === 4;

    let pointsAwardedNow = 0;

    if (isMonday && weeklyPoints > 0) {
      await pool.execute(
        `UPDATE user SET total_points = total_points + ? WHERE user_id = ?`,
        [weeklyPoints, userId]
      );

      userRow.total_points += weeklyPoints;
      pointsAwardedNow = weeklyPoints;
    }

    // 5) Recent activities
    const [recentActivities] = await pool.execute(
      `
      SELECT a.activity_id, a.activity_date, a.consumption_value,
             a.calculated_emission, a.points_earned,
             ef.activity_name, ef.category, ef.unit
      FROM activity a
      JOIN emission_factor ef ON a.factor_id = ef.factor_id
      WHERE a.user_id = ?
      ORDER BY a.activity_date DESC
      LIMIT 5
      `,
      [userId]
    );

    // 6) Category breakdown
    const [categoryBreakdown] = await pool.execute(
      `
      SELECT ef.category,
             COUNT(a.activity_id) AS activity_count,
             COALESCE(SUM(a.calculated_emission), 0) AS total_emission
      FROM activity a
      JOIN emission_factor ef ON a.factor_id = ef.factor_id
      WHERE a.user_id = ?
      GROUP BY ef.category
      `,
      [userId]
    );

    // 7) Return all data
    const dashboardData = {
      user: {
        first_name: userRow.first_name,
        last_name: userRow.last_name,
        total_points: userRow.total_points, // ✅ FINAL POINTS
        date_joined: userRow.date_joined,
      },

      stats: {
        total_activities: userRow.total_activities,
        total_emission: Number(userRow.total_emission).toFixed(2),

        // ❌ removed total_points_earned (WRONG)
        total_points_earned: userRow.total_points, // keep UI same name

        this_week_emission: thisWeek.toFixed(2),
        last_week_emission: lastWeek.toFixed(2),
        change_percentage:
          lastWeek > 0
            ? (((lastWeek - thisWeek) / lastWeek) * 100).toFixed(1)
            : 0,
      },

      weekly: {
        this_week_kg: thisWeek.toFixed(2),
        last_week_kg: lastWeek.toFixed(2),
        delta_kg: delta.toFixed(2),
        points_award: pointsAwardedNow,
      },

      recent_activities: recentActivities,
      category_breakdown: categoryBreakdown,
    };

    return res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ success: false, message: "Dashboard fetch failed" });
  }
};
