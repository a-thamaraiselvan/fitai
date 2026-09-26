const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dietRoutes = require('./routes/diet');
const workoutRoutes = require('./routes/workout');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const gymCalendarRoutes = require('./routes/gym-calendar');
const aiRoutes = require('./routes/ai');
const waterRoutes = require('./routes/water');
const chartsRoutes = require('./routes/charts');
const integrationRoutes = require('./routes/integration');
const { initDatabase } = require('./config/database');


const app = express();

// Trust proxy for Nginx reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) 
    : ['https://fitai.novacodex.in', 'http://localhost:5173', 'http://192.168.5.135:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  skip: (req) => req.path === '/api/health'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1/Auth', authRoutes);
app.use('/api/v1/Diet', dietRoutes);
app.use('/api/v1/Workout', workoutRoutes);
app.use('/api/v1/Admin', adminRoutes);
app.use('/api/v1/Dashboard', dashboardRoutes);
app.use('/api/v1/GymCalendar', gymCalendarRoutes);
app.use('/api/v1/Ai', aiRoutes);
app.use('/api/v1/Water', waterRoutes);
app.use('/api/v1/Charts', chartsRoutes);
app.use('/api/v1/Integration', integrationRoutes);
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

// Ensure database is ready before starting server
(async () => {
  try {
    await initDatabase(); // <-- Call database initialization
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
})();