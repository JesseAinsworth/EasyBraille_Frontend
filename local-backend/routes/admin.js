const express = require('express');
const User = require('../models/User');
const Translation = require('../models/Translation');
const KeyboardAction = require('../models/KeyboardAction');
const { authenticateToken, requireAdmin, requireModerator } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// ==========================================
// USER MANAGEMENT ROUTES
// ==========================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (with pagination and filters)
 * @access  Admin
 * @mobile  Supported
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password -passwordResetToken -emailVerificationToken -loginAttempts -lockUntil');
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
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
    console.error('❌ Admin get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      code: 'GET_USERS_ERROR'
    });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get specific user details
 * @access  Admin
 * @mobile  Supported
 */
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Get user statistics
    const [translationStats, keyboardStats] = await Promise.all([
      Translation.getUserStats(user._id),
      KeyboardAction.getUserPracticeStats(user._id)
    ]);
    
    res.json({
      user,
      stats: {
        translations: translationStats,
        keyboard: keyboardStats
      }
    });
    
  } catch (error) {
    console.error('❌ Admin get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (role, status, etc.)
 * @access  Admin
 * @mobile  Supported
 */
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { role, isActive, isEmailVerified, learningLevel } = req.body;
    
    const allowedUpdates = {};
    if (role && ['user', 'admin', 'moderator'].includes(role)) {
      allowedUpdates.role = role;
    }
    if (typeof isActive === 'boolean') {
      allowedUpdates.isActive = isActive;
    }
    if (typeof isEmailVerified === 'boolean') {
      allowedUpdates.isEmailVerified = isEmailVerified;
    }
    if (learningLevel && ['beginner', 'intermediate', 'advanced'].includes(learningLevel)) {
      allowedUpdates.learningLevel = learningLevel;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    console.log(`✅ User updated by admin ${req.user.email}: ${user.email}`);
    
    res.json({
      message: 'User updated successfully',
      user
    });
    
  } catch (error) {
    console.error('❌ Admin update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      code: 'UPDATE_USER_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account
 * @access  Admin
 * @mobile  Supported
 */
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.userId) {
      return res.status(400).json({
        error: 'Cannot delete your own account',
        code: 'SELF_DELETE_ERROR'
      });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Delete user's translations and keyboard actions
    await Promise.all([
      Translation.deleteMany({ userId: req.params.id }),
      KeyboardAction.deleteMany({ userId: req.params.id }),
      User.findByIdAndDelete(req.params.id)
    ]);
    
    console.log(`✅ User deleted by admin ${req.user.email}: ${user.email}`);
    
    res.json({
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Admin delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      code: 'DELETE_USER_ERROR'
    });
  }
});

// ==========================================
// SYSTEM STATISTICS ROUTES
// ==========================================

/**
 * @route   GET /api/admin/stats/overview
 * @desc    Get system overview statistics
 * @access  Admin/Moderator
 * @mobile  Supported
 */
router.get('/stats/overview', requireModerator, async (req, res) => {
  try {
    const [userStats, translationStats, keyboardStats] = await Promise.all([
      User.getUserStats(),
      Translation.getGlobalStats(),
      KeyboardAction.getGlobalKeyboardStats()
    ]);
    
    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentActivity = await Promise.all([
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Translation.countDocuments({ createdAt: { $gte: weekAgo } }),
      KeyboardAction.countDocuments({ 
        createdAt: { $gte: weekAgo }, 
        actionType: 'session_end' 
      })
    ]);
    
    res.json({
      overview: {
        users: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          verifiedUsers: 0,
          adminUsers: 0
        },
        translations: translationStats[0] || {
          totalTranslations: 0,
          textToBraille: 0,
          brailleToText: 0,
          imageToBraille: 0,
          avgRating: 0,
          avgProcessingTime: 0,
          railwayUsage: 0
        },
        keyboard: keyboardStats[0] || {
          totalSessions: 0,
          totalUsers: 0,
          avgAccuracy: 0,
          avgWpm: 0,
          totalPracticeTime: 0
        }
      },
      recentActivity: {
        newUsers: recentActivity[0],
        newTranslations: recentActivity[1],
        keyboardSessions: recentActivity[2]
      }
    });
    
  } catch (error) {
    console.error('❌ Admin get overview stats error:', error);
    res.status(500).json({
      error: 'Failed to get overview statistics',
      code: 'GET_OVERVIEW_STATS_ERROR'
    });
  }
});

/**
 * @route   GET /api/admin/stats/activity
 * @desc    Get system activity over time
 * @access  Admin/Moderator
 * @mobile  Supported
 */
router.get('/stats/activity', requireModerator, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get daily activity data
    const dailyActivity = await Translation.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          translations: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          translations: 1,
          activeUsers: { $size: '$users' }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    
    res.json({
      activity: dailyActivity
    });
    
  } catch (error) {
    console.error('❌ Admin get activity stats error:', error);
    res.status(500).json({
      error: 'Failed to get activity statistics',
      code: 'GET_ACTIVITY_STATS_ERROR'
    });
  }
});

/**
 * @route   GET /api/admin/translations
 * @desc    Get all translations (for moderation)
 * @access  Admin/Moderator
 * @mobile  Supported
 */
router.get('/translations', requireModerator, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      language,
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = {};
    
    if (type) {
      query.translationType = type;
    }
    
    if (language) {
      query.language = language;
    }
    
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const translations = await Translation.find(query)
      .populate('userId', 'name email avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Translation.countDocuments(query);
    
    res.json({
      translations,
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
    console.error('❌ Admin get translations error:', error);
    res.status(500).json({
      error: 'Failed to get translations',
      code: 'GET_TRANSLATIONS_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/admin/translations/:id
 * @desc    Delete translation (moderation)
 * @access  Admin/Moderator
 * @mobile  Supported
 */
router.delete('/translations/:id', requireModerator, async (req, res) => {
  try {
    const translation = await Translation.findById(req.params.id);
    
    if (!translation) {
      return res.status(404).json({
        error: 'Translation not found',
        code: 'TRANSLATION_NOT_FOUND'
      });
    }
    
    await Translation.findByIdAndDelete(req.params.id);
    
    // Update user stats
    await User.findByIdAndUpdate(translation.userId, {
      $inc: { totalTranslations: -1 }
    });
    
    console.log(`✅ Translation deleted by moderator ${req.user.email}: ${req.params.id}`);
    
    res.json({
      message: 'Translation deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Admin delete translation error:', error);
    res.status(500).json({
      error: 'Failed to delete translation',
      code: 'DELETE_TRANSLATION_ERROR'
    });
  }
});

/**
 * @route   GET /api/admin/leaderboard
 * @desc    Get user leaderboard
 * @access  Admin/Moderator
 * @mobile  Supported
 */
router.get('/leaderboard', requireModerator, async (req, res) => {
  try {
    const { metric = 'wpm', limit = 20, timeRange = 30 } = req.query;
    
    const leaderboard = await KeyboardAction.getLeaderboard(
      metric,
      parseInt(limit),
      parseInt(timeRange)
    );
    
    res.json({
      leaderboard,
      metric,
      timeRange: parseInt(timeRange)
    });
    
  } catch (error) {
    console.error('❌ Admin get leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to get leaderboard',
      code: 'GET_LEADERBOARD_ERROR'
    });
  }
});

module.exports = router;