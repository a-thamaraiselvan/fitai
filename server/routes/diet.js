const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get today's diet entries
router.get('/entries/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const db = getConnection();
    const [rows] = await db.execute(
      'SELECT * FROM diet_entries WHERE user_id = ? AND date = ? ORDER BY created_at DESC',
      [userId, today]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching diet entries:', error);
    res.status(500).json({ message: 'Failed to fetch diet entries' });
  }
});

// Add diet entry
router.post('/entries', authenticateToken, async (req, res) => {
  try {
    const { foodName, calories, protein, carbs, fat, quantity, mealType } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (!foodName || !calories || !mealType) {
      return res.status(400).json({ message: 'Food name, calories, and meal type are required' });
    }

    const db = getConnection();
    const [result] = await db.execute(
      'INSERT INTO diet_entries (user_id, food_name, calories, protein, carbs, fat, quantity, meal_type, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, foodName, calories, protein || 0, carbs || 0, fat || 0, quantity || 1, mealType, today]
    );

    // Get the inserted entry
    const [newEntry] = await db.execute('SELECT * FROM diet_entries WHERE id = ?', [result.insertId]);

    res.status(201).json(newEntry[0]);
  } catch (error) {
    console.error('Error adding diet entry:', error);
    res.status(500).json({ message: 'Failed to add diet entry' });
  }
});

// Get diet entries for date range
router.get('/entries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM diet_entries WHERE user_id = ?';
    let params = [userId];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const db = getConnection();
    const [rows] = await db.execute(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching diet entries:', error);
    res.status(500).json({ message: 'Failed to fetch diet entries' });
  }
});

// Delete diet entry
router.delete('/entries/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;

    const db = getConnection();
    const [result] = await db.execute(
      'DELETE FROM diet_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Diet entry not found' });
    }

    res.json({ message: 'Diet entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting diet entry:', error);
    res.status(500).json({ message: 'Failed to delete diet entry' });
  }
});

module.exports = router;