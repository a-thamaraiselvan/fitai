const { validateIntegrationKey } = require('../middleware/integrationAuth');
const { getConnection } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const express = require('express');

const router = express.Router();

router.post('/CreateUser', validateIntegrationKey, async (req, res) => {
  try {
    const { email, name, organizationId, gymMemberId } = req.body;
    
    if (!email || !name || !organizationId || !gymMemberId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const db = getConnection();
    
    // Check if user exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    const plainPassword = crypto.randomBytes(4).toString('hex'); // 8-char random string
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    if (existing.length > 0) {
      await db.execute(
        'UPDATE users SET password = ?, name = ?, organization_id = ?, gym_member_id = ?, is_approved = TRUE, is_suspended = FALSE, must_reset_password = TRUE WHERE id = ?',
        [hashedPassword, name, organizationId, gymMemberId, existing[0].id]
      );
      return res.status(200).json({
        message: 'User credentials reset successfully',
        userId: existing[0].id,
        user: {
          email,
          name,
          organizationId,
          gymMemberId
        },
        plainPassword
      });
    }

    const [result] = await db.execute(
      'INSERT INTO users (email, password, name, organization_id, gym_member_id, is_approved, must_reset_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, organizationId, gymMemberId, true, true]
    );

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId,
      user: {
        email,
        name,
        organizationId,
        gymMemberId
      },
      plainPassword
    });
  } catch (error) {
    console.error('Integration CreateUser error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

router.get('/GetUsersByOrg/:orgId', validateIntegrationKey, async (req, res) => {
  try {
    const db = getConnection();
    const [users] = await db.execute(
      'SELECT id, email, name, profile_picture, height, weight, fitness_goals, role, is_approved, is_suspended, gym_member_id, created_at FROM users WHERE organization_id = ?',
      [req.params.orgId]
    );
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/GetUserCountByOrg/:orgId', validateIntegrationKey, async (req, res) => {
  try {
    const db = getConnection();
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = ?',
      [req.params.orgId]
    );
    res.json({ count: result[0].count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user count' });
  }
});

router.get('/GetAllOrgStats', validateIntegrationKey, async (req, res) => {
  try {
    const db = getConnection();
    const [stats] = await db.execute(
      'SELECT organization_id as organizationId, organization_id, COUNT(*) as userCount FROM users WHERE organization_id IS NOT NULL AND organization_id != \'\' GROUP BY organization_id'
    );
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch org stats' });
  }
});

router.put('/SuspendUser/:userId', validateIntegrationKey, async (req, res) => {
  try {
    const { suspend } = req.body;
    const db = getConnection();
    await db.execute('UPDATE users SET is_suspended = ? WHERE id = ?', [!!suspend, req.params.userId]);
    res.json({ message: 'User suspension toggled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to suspend user' });
  }
});

router.put('/ResetPassword/:userId', validateIntegrationKey, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'newPassword is required' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const db = getConnection();
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.userId]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

router.delete('/DeleteUser/:userId', validateIntegrationKey, async (req, res) => {
  try {
    const db = getConnection();
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
