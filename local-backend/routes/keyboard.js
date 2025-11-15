const express = require('express');
const Joi = require('joi');
const KeyboardAction = require('../models/KeyboardAction');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All keyboard routes require authentication
router.use(authenticateToken);

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const keyActionSchema = Joi.object({
  sessionId: Joi.string().required(),
  actionType: Joi.string().valid('keypress', 'session_start', 'session_end', 'practice_complete').required(),
  keyPressed: Joi.string().max(10).optional(),
  expectedKey: Joi.string().max(10).optional(),
  isCorrect: Joi.boolean().optional(),
  responseTime: Joi.number().min(0).optional(),
  practiceMode: Joi.string().valid('letters', 'numbers', 'punctuation', 'words', 'sentences', 'mixed').optional(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  sessionStats: Joi.object({
    totalKeys: Joi.number().min(0).optional(),
    correctKeys: Joi.number().min(0).optional(),
    accuracy: Joi.number().min(0).max(100).optional(),
    wpm: Joi.number().min(0).optional(),
    duration: Joi.number().min(0).optional(),
    errorsCount: Joi.number().min(0).optional()
  }).optional(),
  deviceInfo: Joi.object({
    platform: Joi.string().valid('web', 'android', 'ios').optional(),
    screenSize: Joi.string().optional(),
    inputMethod: Joi.string().valid('physical_keyboard', 'virtual_keyboard', 'braille_display').optional()
  }).optional(),
  language: Joi.string().valid('es', 'en', 'fr').optional()
});

// ==========================================
// ROUTES
// ==========================================

/**
 * @route   POST /api/keyboard-actions
 * @desc    Record keyboard action (keypress, session start/end, etc.)
 * @access  Private
 * @mobile  Supported
 */
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error, value } = keyActionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    // Create keyboard action record
    const keyboardAction = new KeyboardAction({
      userId: req.user.userId,
      ...value,
      timestamp: new Date()
    });
    
    await keyboardAction.save();
    
    // Update user activity and stats on session end
    if (value.actionType === 'session_end' && value.sessionStats) {
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { 
          totalKeyboardPractice: 1,
          // Update streak logic could be added here
        },
        lastActivityDate: new Date()
      });
    }
    
    // Log different action types differently
    if (value.actionType === 'session_start') {
      console.log(`🎯 Keyboard practice session started: ${req.user.email} (${value.practiceMode || 'unknown'} mode)`);
    } else if (value.actionType === 'session_end') {
      const stats = value.sessionStats;
      console.log(`✅ Keyboard practice completed: ${req.user.email} - ${stats?.accuracy || 0}% accuracy, ${stats?.wpm || 0} WPM`);
    }
    
    res.json({
      message: 'Keyboard action recorded successfully',
      action: {
        id: keyboardAction._id,
        actionType: keyboardAction.actionType,
        sessionId: keyboardAction.sessionId,
        timestamp: keyboardAction.timestamp
      }
    });
    
  } catch (error) {
    console.error('❌ Keyboard action recording error:', error);
    res.status(500).json({
      error: 'Failed to record keyboard action',
      code: 'RECORD_ACTION_ERROR',
      message: 'Unable to save keyboard action. Please try again.'
    });
  }
});

/**
 * @route   GET /api/keyboard-actions/sessions
 * @desc    Get user's keyboard practice sessions
 * @access  Private
 * @mobile  Supported
 */
router.get('/sessions', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      practiceMode,
      difficulty,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query for session_end actions (these contain the session stats)
    const query = {
      userId: req.user.userId,
      actionType: 'session_end'
    };
    
    if (practiceMode) {
      query.practiceMode = practiceMode;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const sessions = await KeyboardAction.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('sessionId practiceMode difficulty sessionStats timestamp deviceInfo');
    
    const total = await KeyboardAction.countDocuments(query);
    
    res.json({
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Get keyboard sessions error:', error);
    res.status(500).json({
      error: 'Failed to get keyboard sessions',
      code: 'GET_SESSIONS_ERROR'
    });
  }
});

/**
 * @route   GET /api/keyboard-actions/stats
 * @desc    Get user's keyboard practice statistics
 * @access  Private
 * @mobile  Supported
 */
router.get('/stats', async (req, res) => {
  try {
    const { timeRange = 30 } = req.query;
    
    // Get comprehensive practice stats
    const [practiceStats, progressData] = await Promise.all([
      KeyboardAction.getUserPracticeStats(req.user.userId, parseInt(timeRange)),
      KeyboardAction.getPracticeProgress(req.user.userId, parseInt(timeRange))
    ]);
    
    // Get practice mode breakdown
    const modeBreakdown = await KeyboardAction.aggregate([
      {
        $match: {
          userId: req.user.userId,
          actionType: 'session_end',
          timestamp: { 
            $gte: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000) 
          }
        }
      },
      {
        $group: {
          _id: '$practiceMode',
          sessions: { $sum: 1 },
          avgAccuracy: { $avg: '$sessionStats.accuracy' },
          avgWpm: { $avg: '$sessionStats.wpm' },
          totalTime: { $sum: '$sessionStats.duration' }
        }
      }
    ]);
    
    res.json({
      stats: practiceStats[0] || {
        totalSessions: 0,
        totalKeys: 0,
        totalCorrectKeys: 0,
        avgAccuracy: 0,
        avgWpm: 0,
        totalPracticeTime: 0,
        bestAccuracy: 0,
        bestWpm: 0
      },
      progress: progressData,
      modeBreakdown,
      timeRange: parseInt(timeRange)
    });
    
  } catch (error) {
    console.error('❌ Get keyboard stats error:', error);
    res.status(500).json({
      error: 'Failed to get keyboard statistics',
      code: 'GET_STATS_ERROR'
    });
  }
});

/**
 * @route   GET /api/keyboard-actions/session/:sessionId
 * @desc    Get detailed data for a specific practice session
 * @access  Private
 * @mobile  Supported
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get all actions for this session
    const sessionActions = await KeyboardAction.find({
      userId: req.user.userId,
      sessionId
    }).sort({ timestamp: 1 });
    
    if (sessionActions.length === 0) {
      return res.status(404).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    // Separate different types of actions
    const sessionStart = sessionActions.find(action => action.actionType === 'session_start');
    const sessionEnd = sessionActions.find(action => action.actionType === 'session_end');
    const keypresses = sessionActions.filter(action => action.actionType === 'keypress');
    
    // Calculate additional metrics
    const responseTimes = keypresses
      .filter(kp => kp.responseTime && kp.responseTime > 0)
      .map(kp => kp.responseTime);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    res.json({
      sessionId,
      sessionStart,
      sessionEnd,
      keypresses: keypresses.slice(0, 100), // Limit to first 100 keypresses for performance
      summary: {
        totalKeypresses: keypresses.length,
        correctKeypresses: keypresses.filter(kp => kp.isCorrect).length,
        avgResponseTime: Math.round(avgResponseTime),
        sessionDuration: sessionEnd?.sessionStats?.duration || 0,
        finalStats: sessionEnd?.sessionStats
      }
    });
    
  } catch (error) {
    console.error('❌ Get session details error:', error);
    res.status(500).json({
      error: 'Failed to get session details',
      code: 'GET_SESSION_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/keyboard-actions/session/:sessionId
 * @desc    Delete a practice session
 * @access  Private
 * @mobile  Supported
 */
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Delete all actions for this session
    const result = await KeyboardAction.deleteMany({
      userId: req.user.userId,
      sessionId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    // Update user stats (decrement if session_end was deleted)
    const hadSessionEnd = await KeyboardAction.findOne({
      userId: req.user.userId,
      sessionId,
      actionType: 'session_end'
    });
    
    if (hadSessionEnd) {
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { totalKeyboardPractice: -1 }
      });
    }
    
    console.log(`🗑️ Keyboard session deleted: ${req.user.email} - ${sessionId}`);
    
    res.json({
      message: 'Session deleted successfully',
      deletedActions: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Delete keyboard session error:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      code: 'DELETE_SESSION_ERROR'
    });
  }
});

/**
 * @route   GET /api/keyboard-actions/leaderboard
 * @desc    Get keyboard practice leaderboard
 * @access  Private
 * @mobile  Supported
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { metric = 'wpm', limit = 10, timeRange = 30 } = req.query;
    
    const leaderboard = await KeyboardAction.getLeaderboard(
      metric,
      parseInt(limit),
      parseInt(timeRange)
    );
    
    // Find current user's rank
    let userRank = null;
    const userPosition = leaderboard.findIndex(entry => entry._id.toString() === req.user.userId);
    if (userPosition >= 0) {
      userRank = userPosition + 1;
    }
    
    res.json({
      leaderboard,
      userRank,
      metric,
      timeRange: parseInt(timeRange),
      totalEntries: leaderboard.length
    });
    
  } catch (error) {
    console.error('❌ Get keyboard leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to get leaderboard',
      code: 'GET_LEADERBOARD_ERROR'
    });
  }
});

module.exports = router;