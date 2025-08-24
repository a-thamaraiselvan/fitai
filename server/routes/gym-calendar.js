const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get gym days for a specific month
router.get('/month/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.user.id;

    const db = getConnection();
    const [rows] = await db.execute(
      'SELECT * FROM gym_calendar WHERE user_id = ? AND YEAR(date) = ? AND MONTH(date) = ? ORDER BY date',
      [userId, year, month]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching gym calendar:', error);
    res.status(500).json({ message: 'Failed to fetch gym calendar' });
  }
});

// Update gym day status
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const { date, status, reason } = req.body;
    const userId = req.user.id;

    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status are required' });
    }

    const db = getConnection();
    
    // Check if entry exists
    const [existing] = await db.execute(
      'SELECT id FROM gym_calendar WHERE user_id = ? AND date = ?',
      [userId, date]
    );

    if (existing.length > 0) {
      // Update existing entry
      await db.execute(
        'UPDATE gym_calendar SET status = ?, reason = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND date = ?',
        [status, reason || null, userId, date]
      );
    } else {
      // Create new entry
      await db.execute(
        'INSERT INTO gym_calendar (user_id, date, status, reason) VALUES (?, ?, ?, ?)',
        [userId, date, status, reason || null]
      );
    }

    res.json({ message: 'Gym day updated successfully' });
  } catch (error) {
    console.error('Error updating gym day:', error);
    res.status(500).json({ message: 'Failed to update gym day' });
  }
});

// Get gym statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    const db = getConnection();
    let query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM gym_calendar 
      WHERE user_id = ?
    `;
    let params = [userId];

    if (year && month) {
      query += ' AND YEAR(date) = ? AND MONTH(date) = ?';
      params.push(year, month);
    }

    query += ' GROUP BY status';

    const [rows] = await db.execute(query, params);

    const stats = {
      gym: 0,
      rest: 0,
      missed: 0
    };

    rows.forEach(row => {
      stats[row.status] = row.count;
    });

    const total = stats.gym + stats.rest + stats.missed;
    const consistency = total > 0 ? Math.round((stats.gym / total) * 100) : 0;

    res.json({
      ...stats,
      total,
      consistency
    });
  } catch (error) {
    console.error('Error fetching gym stats:', error);
    res.status(500).json({ message: 'Failed to fetch gym stats' });
  }
});

module.exports = router;