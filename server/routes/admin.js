const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getConnection();
    const [rows] = await db.execute(
      'SELECT id, email, name, height, weight, fitness_goals, is_approved, created_at FROM users WHERE role = "user" ORDER BY created_at DESC'
    );

    const users = rows.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      height: user.height,
      weight: user.weight,
      fitnessGoals: user.fitness_goals,
      isApproved: user.is_approved,
      registrationDate: user.created_at
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Approve user
router.put('/users/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const db = getConnection();
    const [result] = await db.execute(
      'UPDATE users SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = "user"',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Failed to approve user' });
  }
});

// Reject user
router.put('/users/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const db = getConnection();
    const [result] = await db.execute(
      'UPDATE users SET is_approved = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = "user"',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User rejected successfully' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Failed to reject user' });
  }
});

// Get admin dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getConnection();
    
    // Get user statistics
    const [userStats] = await db.execute(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN is_approved = TRUE THEN 1 ELSE 0 END) as approvedUsers,
        SUM(CASE WHEN is_approved = FALSE THEN 1 ELSE 0 END) as pendingUsers
      FROM users 
      WHERE role = 'user'
    `);

    // Get today's activity
    const today = new Date().toISOString().split('T')[0];
    const [activityStats] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM diet_entries WHERE date = ?) as todayDietEntries,
        (SELECT COUNT(*) FROM workout_entries WHERE date = ?) as todayWorkouts,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = ? AND role = 'user') as todayRegistrations
    `, [today, today, today]);

    res.json({
      users: userStats[0],
      todayActivity: activityStats[0]
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

module.exports = router;