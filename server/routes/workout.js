const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get today's workout entries
router.get('/entries/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const db = getConnection();
    const [rows] = await db.execute(
      'SELECT * FROM workout_entries WHERE user_id = ? AND date = ? ORDER BY created_at DESC',
      [userId, today]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching workout entries:', error);
    res.status(500).json({ message: 'Failed to fetch workout entries' });
  }
});

// Add workout exercise
router.post('/exercises', authenticateToken, async (req, res) => {
  try {
    const { exerciseName, sets, reps, weight, duration, workoutType } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (!exerciseName || !workoutType) {
      return res.status(400).json({ message: 'Exercise name and workout type are required' });
    }

    const db = getConnection();
    const [result] = await db.execute(
      'INSERT INTO workout_entries (user_id, exercise_name, sets, reps, weight, duration, workout_type, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, exerciseName, sets || 0, reps || 0, weight || 0, duration || 0, workoutType, today]
    );

    // Get the inserted entry
    const [newEntry] = await db.execute('SELECT * FROM workout_entries WHERE id = ?', [result.insertId]);

    res.status(201).json(newEntry[0]);
  } catch (error) {
    console.error('Error adding workout exercise:', error);
    res.status(500).json({ message: 'Failed to add workout exercise' });
  }
});

// Save workout session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { name, startTime, duration } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const db = getConnection();
    const [result] = await db.execute(
      'INSERT INTO workout_sessions (user_id, name, start_time, duration, date) VALUES (?, ?, ?, ?, ?)',
      [userId, name, startTime, duration, today]
    );

    res.status(201).json({ id: result.insertId, message: 'Workout session saved successfully' });
  } catch (error) {
    console.error('Error saving workout session:', error);
    res.status(500).json({ message: 'Failed to save workout session' });
  }
});

// Get workout entries for date range
router.get('/entries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM workout_entries WHERE user_id = ?';
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
    console.error('Error fetching workout entries:', error);
    res.status(500).json({ message: 'Failed to fetch workout entries' });
  }
});

// Get workout sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = 'SELECT * FROM workout_sessions WHERE user_id = ?';
    let params = [userId];

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC, start_time DESC';

    const db = getConnection();
    const [rows] = await db.execute(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching workout sessions:', error);
    res.status(500).json({ message: 'Failed to fetch workout sessions' });
  }
});

// Delete workout entry
router.delete('/entries/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;

    const db = getConnection();
    const [result] = await db.execute(
      'DELETE FROM workout_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Workout entry not found' });
    }

    res.json({ message: 'Workout entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout entry:', error);
    res.status(500).json({ message: 'Failed to delete workout entry' });
  }
});

module.exports = router;