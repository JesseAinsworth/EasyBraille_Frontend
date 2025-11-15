const express = require('express');
const User = require('../models/User');
const Translation = require('../models/Translation');
const KeyboardAction = require('../models/KeyboardAction');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All mobile routes require authentication
router.use(authenticateToken);

// ==========================================
// MOBILE-SPECIFIC ROUTES
// ==========================================

/**
 * @route   GET /api/mobile/dashboard
 * @desc    Get mobile dashboard data (optimized for mobile apps)
 * @access  Private
 * @mobile  Primary
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get user info
    const user = await User.findById(req.user.userId)
      .select('name avatar totalTranslations totalKeyboardPractice streakDays learningLevel lastActivityDate');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Get recent translations (last 5)
    const recentTranslations = await Translation.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('outputText translationType createdAt confidence');
    
    // Get recent keyboard stats (last 30 days)
    const keyboardStats = await KeyboardAction.getUserPracticeStats(req.user.userId, 30);
    
    // Get today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [todayTranslations, todayKeyboardSessions] = await Promise.all([
      Translation.countDocuments({
        userId: req.user.userId,
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      KeyboardAction.countDocuments({
        userId: req.user.userId,
        actionType: 'session_end',
        timestamp: { $gte: today, $lt: tomorrow }
      })
    ]);
    
    res.json({
      user: {
        name: user.name,
        avatar: user.avatar,
        learningLevel: user.learningLevel,
        streakDays: user.streakDays
      },
      stats: {
        totalTranslations: user.totalTranslations,
        totalKeyboardPractice: user.totalKeyboardPractice,
        todayTranslations,
        todayKeyboardSessions
      },
      recentTranslations,
      keyboardProgress: keyboardStats[0] || {
        totalSessions: 0,
        avgAccuracy: 0,
        avgWpm: 0,
        bestAccuracy: 0,
        bestWpm: 0
      }
    });
    
  } catch (error) {
    console.error('❌ Mobile dashboard error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard data',
      code: 'DASHBOARD_ERROR'
    });
  }
});

/**
 * @route   GET /api/mobile/quick-stats
 * @desc    Get quick stats for mobile widgets
 * @access  Private
 * @mobile  Primary
 */
router.get('/quick-stats', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('totalTranslations totalKeyboardPractice streakDays');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Get this week's activity
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [weekTranslations, weekKeyboardSessions, lastTranslation] = await Promise.all([
      Translation.countDocuments({
        userId: req.user.userId,
        createdAt: { $gte: weekAgo }
      }),
      KeyboardAction.countDocuments({
        userId: req.user.userId,
        actionType: 'session_end',
        timestamp: { $gte: weekAgo }
      }),
      Translation.findOne({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .select('createdAt translationType')
    ]);
    
    res.json({
      total: {
        translations: user.totalTranslations,
        keyboardPractice: user.totalKeyboardPractice,
        streakDays: user.streakDays
      },
      thisWeek: {
        translations: weekTranslations,
        keyboardSessions: weekKeyboardSessions
      },
      lastActivity: lastTranslation ? {
        type: lastTranslation.translationType,
        date: lastTranslation.createdAt
      } : null
    });
    
  } catch (error) {
    console.error('❌ Mobile quick stats error:', error);
    res.status(500).json({
      error: 'Failed to get quick stats',
      code: 'QUICK_STATS_ERROR'
    });
  }
});

/**
 * @route   GET /api/mobile/notifications
 * @desc    Get mobile notifications/updates
 * @access  Private
 * @mobile  Primary
 */
router.get('/notifications', async (req, res) => {
  try {
    const notifications = [];
    
    // Check for streak milestones
    const user = await User.findById(req.user.userId).select('streakDays totalTranslations');
    
    if (user.streakDays >= 7 && user.streakDays % 7 === 0) {
      notifications.push({
        id: `streak_${user.streakDays}`,
        type: 'achievement',
        title: '🔥 Streak Milestone!',
        message: `Congratulations! You've maintained a ${user.streakDays}-day streak!`,
        priority: 'high',
        createdAt: new Date()
      });
    }
    
    if (user.totalTranslations >= 100 && user.totalTranslations % 100 === 0) {
      notifications.push({
        id: `translations_${user.totalTranslations}`,
        type: 'achievement',
        title: '🎉 Translation Milestone!',
        message: `Amazing! You've completed ${user.totalTranslations} translations!`,
        priority: 'medium',
        createdAt: new Date()
      });
    }
    
    // Check if user hasn't practiced in a while
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentActivity = await Translation.findOne({
      userId: req.user.userId,
      createdAt: { $gte: threeDaysAgo }
    });
    
    if (!recentActivity) {
      notifications.push({
        id: 'practice_reminder',
        type: 'reminder',
        title: '📚 Time to Practice!',
        message: "We haven't seen you in a while. Keep up your braille learning journey!",
        priority: 'low',
        createdAt: new Date()
      });
    }
    
    res.json({
      notifications: notifications.slice(0, 10), // Limit to 10 notifications
      hasMore: false
    });
    
  } catch (error) {
    console.error('❌ Mobile notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      code: 'NOTIFICATIONS_ERROR'
    });
  }
});

/**
 * @route   POST /api/mobile/sync-progress
 * @desc    Sync offline progress data from mobile app
 * @access  Private
 * @mobile  Primary
 */
router.post('/sync-progress', async (req, res) => {
  try {
    const { translations = [], keyboardSessions = [] } = req.body;
    
    const results = {
      translations: {
        synced: 0,
        failed: 0
      },
      keyboardSessions: {
        synced: 0,
        failed: 0
      }
    };
    
    // Sync translations
    for (const translationData of translations) {
      try {
        const translation = new Translation({
          userId: req.user.userId,
          ...translationData,
          deviceInfo: {
            platform: 'mobile',
            ...translationData.deviceInfo
          }
        });
        
        await translation.save();
        results.translations.synced++;
      } catch (error) {
        console.error('Failed to sync translation:', error);
        results.translations.failed++;
      }
    }
    
    // Sync keyboard sessions
    for (const sessionData of keyboardSessions) {
      try {
        const keyboardAction = new KeyboardAction({
          userId: req.user.userId,
          ...sessionData,
          deviceInfo: {
            platform: 'mobile',
            ...sessionData.deviceInfo
          }
        });
        
        await keyboardAction.save();
        results.keyboardSessions.synced++;
      } catch (error) {
        console.error('Failed to sync keyboard session:', error);
        results.keyboardSessions.failed++;
      }
    }
    
    // Update user stats
    if (results.translations.synced > 0 || results.keyboardSessions.synced > 0) {
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: {
          totalTranslations: results.translations.synced,
          totalKeyboardPractice: results.keyboardSessions.synced
        },
        lastActivityDate: new Date()
      });
    }
    
    console.log(`📱 Progress synced for ${req.user.email}: ${results.translations.synced} translations, ${results.keyboardSessions.synced} keyboard sessions`);
    
    res.json({
      message: 'Progress synced successfully',
      results
    });
    
  } catch (error) {
    console.error('❌ Mobile sync progress error:', error);
    res.status(500).json({
      error: 'Failed to sync progress',
      code: 'SYNC_ERROR'
    });
  }
});

/**
 * @route   GET /api/mobile/offline-data
 * @desc    Get essential data for offline mobile usage
 * @access  Private
 * @mobile  Primary
 */
router.get('/offline-data', async (req, res) => {
  try {
    // Get user's essential data for offline usage
    const user = await User.findById(req.user.userId)
      .select('name avatar language theme learningLevel');
    
    // Get recent translations for offline reference
    const recentTranslations = await Translation.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('inputText outputText translationType language createdAt');
    
    // Get user's keyboard practice preferences
    const keyboardPreferences = await KeyboardAction.aggregate([
      {
        $match: {
          userId: req.user.userId,
          actionType: 'session_end'
        }
      },
      {
        $group: {
          _id: {
            practiceMode: '$practiceMode',
            difficulty: '$difficulty'
          },
          sessions: { $sum: 1 },
          avgAccuracy: { $avg: '$sessionStats.accuracy' }
        }
      },
      { $sort: { sessions: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      user,
      recentTranslations,
      keyboardPreferences,
      brailleReference: {
        // Basic braille alphabet for offline reference
        letters: {
          'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
          'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
          'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵'
        },
        numbers: {
          '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑', '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚'
        },
        punctuation: {
          '.': '⠲', ',': '⠂', '?': '⠢', '!': '⠖', ':': '⠒', ';': '⠆', '-': '⠤', '(': '⠶', ')': '⠶'
        }
      },
      syncTimestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Mobile offline data error:', error);
    res.status(500).json({
      error: 'Failed to get offline data',
      code: 'OFFLINE_DATA_ERROR'
    });
  }
});

module.exports = router;