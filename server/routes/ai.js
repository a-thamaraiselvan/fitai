const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Analyze meal image
router.post('/analyze-meal', authenticateToken, async (req, res) => {
  try {
    const { image, mealType } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Remove data URL prefix
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      Analyze this food image and provide detailed nutritional information. 
      Return the response in JSON format with the following structure:
      {
        "foods": [
          {
            "name": "food name",
            "calories": number,
            "protein": number (in grams),
            "carbs": number (in grams),
            "fat": number (in grams),
            "confidence": number (0-1)
          }
        ],
        "totalCalories": number,
        "totalProtein": number,
        "totalCarbs": number,
        "totalFat": number
      }
      
      Be as accurate as possible with portion sizes and nutritional values.
      If you can't identify a food item clearly, set confidence below 0.6.
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let analysis;
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      analysis = {
        foods: [
          {
            name: 'Unknown Food',
            calories: 200,
            protein: 10,
            carbs: 25,
            fat: 8,
            confidence: 0.3
          }
        ],
        totalCalories: 200,
        totalProtein: 10,
        totalCarbs: 25,
        totalFat: 8
      };
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing meal:', error);
    res.status(500).json({ message: 'Failed to analyze meal' });
  }
});

// Generate AI notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getConnection();

    // Get user's recent activity
    const today = new Date().toISOString().split('T')[0];
    
    const [waterData] = await db.execute(
      'SELECT COALESCE(SUM(amount), 0) as totalWater FROM water_entries WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    const [workoutData] = await db.execute(
      'SELECT COUNT(*) as workoutCount FROM workout_entries WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    const [caloriesData] = await db.execute(
      'SELECT COALESCE(SUM(calories * quantity), 0) as totalCalories FROM diet_entries WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    // Get existing notifications
    const [existingNotifications] = await db.execute(
      'SELECT * FROM ai_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    const notifications = [];

    // Generate notifications based on user data
    const waterIntake = waterData[0].totalWater;
    const workoutCount = workoutData[0].workoutCount;
    const caloriesIntake = caloriesData[0].totalCalories;

    // Water notification
    if (waterIntake < 1000) {
      const messages = [
        "Hey broo! 💧 You're drinking less water today. Stay hydrated, thangalesh!",
        "Kuding broo! 🚰 Your body needs more water. Drink up for better performance!",
        "Water intake low da! 💦 Keep sipping throughout the day, thangalesh!"
      ];
      
      notifications.push({
        id: `water-${Date.now()}`,
        type: 'water',
        title: 'Hydration Alert!',
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(),
        read: false
      });
    }

    // Workout motivation
    if (workoutCount === 0) {
      const messages = [
        "No workout today? 💪 Come on broo, let's crush those goals! Thangalesh br!",
        "Missing the gym today? 🏋️‍♂️ Even 15 minutes counts, kuding!",
        "Your muscles are waiting! 💪 Time to show them some love, thangalesh!"
      ];
      
      notifications.push({
        id: `workout-${Date.now()}`,
        type: 'workout',
        title: 'Workout Reminder',
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(),
        read: false
      });
    }

    // Diet notification
    if (caloriesIntake < 800) {
      const messages = [
        "Eating too little today? 🍽️ Fuel your body properly, thangalesh br!",
        "Low calorie intake detected! 🥗 Your body needs energy to perform, kuding!",
        "Don't skip meals broo! 🍎 Proper nutrition is key to your fitness journey!"
      ];
      
      notifications.push({
        id: `diet-${Date.now()}`,
        type: 'diet',
        title: 'Nutrition Alert',
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(),
        read: false
      });
    }

    // Motivational messages
    const motivationalMessages = [
      "You're doing great! 🌟 Keep pushing forward, thangalesh br!",
      "Every small step counts! 👣 Proud of your progress, kuding!",
      "Consistency is key! 🔑 You've got this, broo!",
      "Your future self will thank you! 🙏 Keep going, thangalesh!"
    ];

    if (Math.random() > 0.7) { // 30% chance for motivational message
      notifications.push({
        id: `motivation-${Date.now()}`,
        type: 'motivation',
        title: 'Daily Motivation',
        message: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
        timestamp: new Date(),
        read: false
      });
    }

    // Store new notifications in database
    for (const notification of notifications) {
      try {
        await db.execute(
          'INSERT INTO ai_notifications (id, user_id, type, title, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [notification.id, userId, notification.type, notification.title, notification.message, new Date()]
        );
      } catch (error) {
        console.error('Error storing notification:', error);
      }
    }

    // Return all notifications (existing + new)
    const [allNotifications] = await db.execute(
      'SELECT * FROM ai_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    res.json(allNotifications);
  } catch (error) {
    console.error('Error generating AI notifications:', error);
    res.status(500).json({ message: 'Failed to generate notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const db = getConnection();
    await db.execute(
      'UPDATE ai_notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Delete notification
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const db = getConnection();
    await db.execute(
      'DELETE FROM ai_notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

module.exports = router;