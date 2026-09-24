const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fitai',
  port: process.env.DB_PORT || 3306,
  // waitForConnections: true,
  // connectionLimit: 10,
  // queueLimit: 0,
  // acquireTimeout: 60000,
  // timeout: 60000,
};

let pool;

const initDatabase = async () => {
  try {
    // Create connection without database to create the database if it doesn't exist
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempConnection.end();

    // Create the main connection pool
    pool = mysql.createPool(dbConfig);

    // Test the connection
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    
    // Create tables
    await createTables(connection);
    connection.release();

  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const createTables = async (connection) => {
  try {
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        profile_picture VARCHAR(500),
        height INT,
        weight INT,
        fitness_goals TEXT,
        role ENUM('user', 'admin') DEFAULT 'user',
        is_approved BOOLEAN DEFAULT FALSE,
        is_suspended BOOLEAN DEFAULT FALSE,
        notifications_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Migration: Add notifications_enabled column to existing users table
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE');
      console.log('Added notifications_enabled column to users table');
    } catch (error) {
      if (error.errno !== 1060) console.error('Migration error:', error);
    }

    // Migration: Add is_suspended column to existing users table
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE');
      console.log('Added is_suspended column to users table');
    } catch (error) {
      if (error.errno !== 1060) console.error('Migration error:', error);
    }

    // Migration: Add organization_id column
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN organization_id VARCHAR(255) NOT NULL DEFAULT \'\'');
      console.log('Added organization_id column to users table');
    } catch (error) {
      if (error.errno !== 1060) console.error('Migration error:', error);
    }

    // Migration: Add must_reset_password column
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN must_reset_password BOOLEAN DEFAULT FALSE');
      console.log('Added must_reset_password column to users table');
    } catch (error) {
      if (error.errno !== 1060) console.error('Migration error:', error);
    }

    // Migration: Add gym_member_id column
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN gym_member_id VARCHAR(255) DEFAULT NULL');
      console.log('Added gym_member_id column to users table');
    } catch (error) {
      if (error.errno !== 1060) console.error('Migration error:', error);
    }

    // Add indexes
    try {
      await connection.execute('CREATE INDEX idx_users_org ON users(organization_id)');
    } catch (error) {
      if (error.errno !== 1061) console.error('Index error:', error);
    }
    try {
      await connection.execute('CREATE INDEX idx_users_gym_member ON users(gym_member_id)');
    } catch (error) {
      if (error.errno !== 1061) console.error('Index error:', error);
    }

    // Diet entries table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS diet_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        food_name VARCHAR(255) NOT NULL,
        calories INT NOT NULL,
        protein INT DEFAULT 0,
        carbs INT DEFAULT 0,
        fat INT DEFAULT 0,
        quantity INT DEFAULT 1,
        meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Workout entries table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS workout_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        exercise_name VARCHAR(255) NOT NULL,
        sets INT DEFAULT 0,
        reps INT DEFAULT 0,
        weight INT DEFAULT 0,
        duration INT DEFAULT 0,
        workout_type ENUM('strength', 'cardio', 'flexibility', 'sports') NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Workout sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        start_time DATETIME NOT NULL,
        duration INT DEFAULT 0,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Gym calendar table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gym_calendar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('gym', 'rest', 'missed') NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_date (user_id, date)
      )
    `);

    // Water entries table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS water_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount INT NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // AI notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('water', 'workout', 'diet', 'motivation') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const getConnection = () => {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
};

module.exports = {
  initDatabase,
  getConnection
};