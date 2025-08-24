const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get nutrition chart data
router.get('/nutrition', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const db = getConnection();
    const [rows] = await db.execute(`
      SELECT 
        COALESCE(SUM(protein * quantity), 0) as protein,
        COALESCE(SUM(carbs * quantity), 0) as carbs,
        COALESCE(SUM(fat * quantity), 0) as fat
      FROM diet_entries 
      WHERE user_id = ? AND date = ?
    `, [userId, today]);

    const data = rows[0];
    const chartData = [
      { name: 'Protein', value: data.protein, color: '#10B981' },
      { name: 'Carbs', value: data.carbs, color: '#F59E0B' },
      { name: 'Fat', value: data.fat, color: '#EF4444' }
    ];

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching nutrition chart data:', error);
    res.status(500).json({ message: 'Failed to fetch nutrition data' });
  }
});

// Get weekly progress data
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const db = getConnection();
    
    // Get last 7 days data
    const weeklyData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];

      // Get calories for the day
      const [caloriesResult] = await db.execute(`
        SELECT COALESCE(SUM(calories * quantity), 0) as calories
        FROM diet_entries 
        WHERE user_id = ? AND date = ?
      `, [userId, dateStr]);

      // Get workouts for the day
      const [workoutsResult] = await db.execute(`
        SELECT COUNT(*) as workouts
        FROM workout_entries 
        WHERE user_id = ? AND date = ?
      `, [userId, dateStr]);

      // Get water intake for the day
      const [waterResult] = await db.execute(`
        SELECT COALESCE(SUM(amount), 0) / 1000 as water
        FROM water_entries 
        WHERE user_id = ? AND date = ?
      `, [userId, dateStr]);

      weeklyData.push({
        day: dayName,
        calories: caloriesResult[0].calories,
        workouts: workoutsResult[0].workouts,
        water: Math.round(waterResult[0].water * 10) / 10 // Round to 1 decimal
      });
    }

    res.json(weeklyData);
  } catch (error) {
    console.error('Error fetching weekly chart data:', error);
    res.status(500).json({ message: 'Failed to fetch weekly data' });
  }
});

// Get gym statistics
router.get('/gym-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const db = getConnection();
    const [rows] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM gym_calendar 
      WHERE user_id = ? 
        AND YEAR(date) = ? 
        AND MONTH(date) = ?
      GROUP BY status
    `, [userId, currentYear, currentMonth]);

    const gymData = [
      { name: 'Gym Days', value: 0, color: '#10B981' },
      { name: 'Rest Days', value: 0, color: '#F59E0B' },
      { name: 'Missed Days', value: 0, color: '#EF4444' }
    ];

    rows.forEach(row => {
      switch (row.status) {
        case 'gym':
          gymData[0].value = row.count;
          break;
        case 'rest':
          gymData[1].value = row.count;
          break;
        case 'missed':
          gymData[2].value = row.count;
          break;
      }
    });

    res.json(gymData);
  } catch (error) {
    console.error('Error fetching gym chart data:', error);
    res.status(500).json({ message: 'Failed to fetch gym data' });
  }
});

module.exports = router;