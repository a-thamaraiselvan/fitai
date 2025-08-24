const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get today's water intake
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const db = getConnection();
    const [entries] = await db.execute(
      'SELECT * FROM water_entries WHERE user_id = ? AND date = ? ORDER BY created_at DESC',
      [userId, today]
    );

    const [total] = await db.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM water_entries WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    res.json({
      entries: entries.map(entry => ({
        ...entry,
        time: new Date(entry.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      })),
      total: total[0].total
    });
  } catch (error) {
    console.error('Error fetching water data:', error);
    res.status(500).json({ message: 'Failed to fetch water data' });
  }
});

// Add water entry
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const db = getConnection();
    await db.execute(
      'INSERT INTO water_entries (user_id, amount, date) VALUES (?, ?, ?)',
      [userId, amount, today]
    );

    res.json({ message: 'Water entry added successfully' });
  } catch (error) {
    console.error('Error adding water entry:', error);
    res.status(500).json({ message: 'Failed to add water entry' });
  }
});

// Delete water entry
router.delete('/entries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const db = getConnection();
    const [result] = await db.execute(
      'DELETE FROM water_entries WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Water entry not found' });
    }

    res.json({ message: 'Water entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting water entry:', error);
    res.status(500).json({ message: 'Failed to delete water entry' });
  }
});

// Get weekly water stats
router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get last 7 days
    const db = getConnection();
    const [rows] = await db.execute(`
      SELECT 
        DATE(date) as date,
        COALESCE(SUM(amount), 0) as total
      FROM water_entries 
      WHERE user_id = ? 
        AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND date <= CURDATE()
      GROUP BY DATE(date)
      ORDER BY date
    `, [userId]);

    // Fill in missing days with 0
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = rows.find(row => row.date === dateStr);
      weeklyData.push(dayData ? dayData.total : 0);
    }

    res.json(weeklyData);
  } catch (error) {
    console.error('Error fetching weekly water stats:', error);
    res.status(500).json({ message: 'Failed to fetch weekly water stats' });
  }
});

module.exports = router;