const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');

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
      'SELECT id, email, name, profile_picture, height, weight, fitness_goals, role, is_approved FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Check if user is approved (except for admin)
    if (user.email !== 'admin@gmail.com' && !user.is_approved) {
      return res.status(403).json({ message: 'Account not approved' });
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
  isApproved: user.is_approved
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