const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');

// In-memory cache for gym membership status checks (TTL: 30 seconds)
const memberStatusCache = new Map();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database to ensure they still exist and are approved
    const db = getConnection();
    const [rows] = await db.execute(
      'SELECT id, email, name, profile_picture, height, weight, fitness_goals, role, is_approved, is_suspended, organization_id, gym_member_id, must_reset_password FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Check if user is approved (except for admin)
    if (user.email !== 'athamaraiselvan694@gmail.com' && !user.is_approved) {
      return res.status(403).json({ message: 'Account not approved' });
    }

    // Check if user is suspended
    if (user.is_suspended) {
      return res.status(403).json({ message: 'Account has been suspended. Please contact the administrator.' });
    }

    // Verify gym membership status for organization users
    if (user.organization_id || user.gym_member_id) {
      const now = Date.now();
      const cached = memberStatusCache.get(user.id);

      if (cached && (now - cached.timestamp < 30000)) {
        if (!cached.allowed) {
          return res.status(403).json({
            message: cached.message || 'Your gym membership has expired or is inactive. Please renew your membership to continue using FitAI.'
          });
        }
      } else {
        try {
          const gymApiUrl = process.env.GYM_MGMT_API_URL || 'http://localhost:5000/api/v1';
          const gymRes = await fetch(`${gymApiUrl}/fitai/CheckMemberStatus`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-integration-key': process.env.FITAI_INTEGRATION_SECRET
            },
            body: JSON.stringify({
              email: user.email,
              organizationId: user.organization_id,
              gymMemberId: user.gym_member_id
            })
          });

          if (gymRes.ok) {
            const gymData = await gymRes.json();
            memberStatusCache.set(user.id, {
              allowed: gymData.allowed,
              message: gymData.message,
              timestamp: now
            });

            if (gymData.success && !gymData.allowed) {
              return res.status(403).json({
                message: gymData.message || 'Your gym membership has expired or is inactive. Please renew your membership to continue using FitAI.'
              });
            }
          }
        } catch (err) {
          console.error('Membership check error in FitAI auth middleware:', err.message);
        }
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || null,
      profilePicture: user.profile_picture || null,
      height: user.height || null,
      weight: user.weight || null,
      fitnessGoals: user.fitness_goals || null,
      role: user.role,
      isApproved: user.is_approved,
      organizationId: user.organization_id,
      gymMemberId: user.gym_member_id
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};