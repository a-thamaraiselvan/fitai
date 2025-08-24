const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get start of current week (Monday)
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const db = getConnection();

    // Get today's calories
    const [caloriesResult] = await db.execute(`
      SELECT COALESCE(SUM(calories * quantity), 0) as todayCalories 
      FROM diet_entries 
      WHERE user_id = ? AND date = ?
    `, [userId, today]);

    // Get this week's workouts
    const [workoutsResult] = await db.execute(`
      SELECT COUNT(DISTINCT date) as weeklyWorkouts 
      FROM workout_entries 
      WHERE user_id = ? AND date >= ?
    `, [userId, weekStartStr]);

    // Calculate streak (consecutive days with either diet or workout entries)
    const [streakResult] = await db.execute(`
      SELECT COUNT(*) as streak FROM (
        SELECT DISTINCT date FROM (
          SELECT date FROM diet_entries WHERE user_id = ?
          UNION
          SELECT date FROM workout_entries WHERE user_id = ?
        ) as combined_dates
        WHERE date <= ?
        ORDER BY date DESC
      ) as recent_dates
    `, [userId, userId, today]);

    // Calculate goal progress (example: based on weekly workout target)
    const weeklyWorkoutGoal = 5; // Target 5 workouts per week
    const goalProgress = Math.min((workoutsResult[0].weeklyWorkouts / weeklyWorkoutGoal) * 100, 100);

    res.json({
      todayCalories: caloriesResult[0].todayCalories || 0,
      weeklyWorkouts: workoutsResult[0].weeklyWorkouts || 0,
      currentStreak: streakResult[0].streak || 0,
      goalProgress: Math.round(goalProgress)
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 10;

    const db = getConnection();

    // Get recent diet entries
    const [dietEntries] = await db.execute(`
      SELECT 'diet' as type, food_name as name, calories, date, created_at 
      FROM diet_entries 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [userId, Math.floor(limit / 2)]);

    // Get recent workout entries
    const [workoutEntries] = await db.execute(`
      SELECT 'workout' as type, exercise_name as name, sets, reps, weight, date, created_at 
      FROM workout_entries 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [userId, Math.floor(limit / 2)]);

    // Combine and sort by date
    const combinedActivity = [...dietEntries, ...workoutEntries]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    res.json(combinedActivity);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
});

module.exports = router;