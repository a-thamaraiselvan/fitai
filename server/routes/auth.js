const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, height, weight, fitnessGoals } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const db = getConnection();

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Determine if this is the admin user
    const isAdmin = email === 'admin@gmail.com';
    const role = isAdmin ? 'admin' : 'user';
    const isApproved = isAdmin; // Admin is auto-approved

    // Insert user
    const [result] = await db.execute(
      'INSERT INTO users (email, password, name, height, weight, fitness_goals, role, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, height, weight, fitnessGoals, role, isApproved]
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId,
      isAdmin: isAdmin
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = getConnection();

    // Get user
    const [rows] = await db.execute(
      'SELECT id, email, password, name, profile_picture, height, weight, fitness_goals, role, is_approved FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is approved (except for admin)
    if (email !== 'admin@gmail.com' && !user.is_approved) {
      return res.status(403).json({ message: 'Account pending approval. Please wait for admin approval.' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture,
        height: user.height,
        weight: user.weight,
        fitnessGoals: user.fitness_goals,
        role: user.role,
        isApproved: user.is_approved
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, height, weight, fitnessGoals } = req.body;
    const userId = req.user.id;

    const db = getConnection();

    await db.execute(
      'UPDATE users SET name = ?, height = ?, weight = ?, fitness_goals = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, height, weight, fitnessGoals, userId]
    );

    // Get updated user data
    const [rows] = await db.execute(
      'SELECT id, email, name, profile_picture, height, weight, fitness_goals, role, is_approved FROM users WHERE id = ?',
      [userId]
    );

    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture,
        height: user.height,
        weight: user.weight,
        fitnessGoals: user.fitness_goals,
        role: user.role,
        isApproved: user.is_approved
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Profile update failed' });
  }
});

// Upload profile picture
router.post('/upload-profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    const db = getConnection();

    // Delete old profile picture if exists
    const [oldUser] = await db.execute('SELECT profile_picture FROM users WHERE id = ?', [userId]);
    if (oldUser.length > 0 && oldUser[0].profile_picture) {
      const oldPath = path.join(__dirname, '..', oldUser[0].profile_picture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user with new profile picture
    await db.execute(
      'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [profilePictureUrl, userId]
    );

    res.json({ profilePicture: profilePictureUrl });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ message: 'Profile picture upload failed' });
  }
});

module.exports = router;