const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  language: Joi.string().valid('es', 'en', 'fr').optional(),
  theme: Joi.string().valid('light', 'dark', 'auto').optional(),
  learningLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  avatar: Joi.string().uri().optional().allow(null)
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string().min(6).max(128).required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'any.required': 'New password is required'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({
      'any.only': 'Password confirmation does not match new password',
      'any.required': 'Password confirmation is required'
    })
});

// ==========================================
// ROUTES
// ==========================================

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 * @mobile  Supported
 */
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -passwordResetToken -emailVerificationToken -loginAttempts -lockUntil -deviceTokens');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      user
    });
    
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 * @mobile  Supported
 */
router.put('/profile', async (req, res) => {
  try {
    // Validate input
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }
    
    // Update user profile
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: value },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -emailVerificationToken -loginAttempts -lockUntil -deviceTokens');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    console.log(`✅ Profile updated: ${req.user.email}`);
    
    res.json({
      message: 'Profile updated successfully',
      user
    });
    
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

/**
 * @route   PUT /api/users/password
 * @desc    Change user password
 * @access  Private
 * @mobile  Supported
 */
router.put('/password', async (req, res) => {
  try {
    // Validate input
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }))
      });
    }
    
    const { currentPassword, newPassword } = value;
    
    // Get user with password
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Invalid current password',
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'The current password you entered is incorrect'
      });
    }
    
    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();
    
    console.log(`✅ Password changed: ${req.user.email}`);
    
    res.json({
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

/**
 * @route   GET /api/users/stats
 * @desc    Get comprehensive user statistics
 * @access  Private
 * @mobile  Supported
 */
router.get('/stats', async (req, res) => {
  try {
    const Translation = require('../models/Translation');
    const KeyboardAction = require('../models/KeyboardAction');
    
    // Get user basic info
    const user = await User.findById(req.user.userId)
      .select('totalTranslations totalKeyboardPractice streakDays learningLevel createdAt');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Get detailed statistics
    const [translationStats, keyboardStats] = await Promise.all([
      Translation.getUserStats(req.user.userId),
      KeyboardAction.getUserPracticeStats(req.user.userId, 30)
    ]);
    
    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [recentTranslations, recentKeyboardSessions] = await Promise.all([
      Translation.countDocuments({
        userId: req.user.userId,
        createdAt: { $gte: weekAgo }
      }),
      KeyboardAction.countDocuments({
        userId: req.user.userId,
        actionType: 'session_end',
        timestamp: { $gte: weekAgo }
      })
    ]);
    
    // Calculate account age in days
    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    res.json({
      overview: {
        totalTranslations: user.totalTranslations,
        totalKeyboardPractice: user.totalKeyboardPractice,
        streakDays: user.streakDays,
        learningLevel: user.learningLevel,
        accountAge
      },
      translations: {
        stats: translationStats,
        recentCount: recentTranslations
      },
      keyboard: {
        stats: keyboardStats[0] || {
          totalSessions: 0,
          totalKeys: 0,
          totalCorrectKeys: 0,
          avgAccuracy: 0,
          avgWpm: 0,
          totalPracticeTime: 0,
          bestAccuracy: 0,
          bestWpm: 0
        },
        recentSessions: recentKeyboardSessions
      }
    });
    
  } catch (error) {
    console.error('❌ Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to get user statistics',
      code: 'GET_USER_STATS_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account (soft delete - deactivate)
 * @access  Private
 * @mobile  Supported
 */
router.delete('/account', async (req, res) => {
  try {
    const { confirmEmail } = req.body;
    
    // Verify email confirmation
    if (confirmEmail !== req.user.email) {
      return res.status(400).json({
        error: 'Email confirmation required',
        code: 'EMAIL_CONFIRMATION_REQUIRED',
        message: 'Please confirm your email address to delete your account'
      });
    }
    
    // Soft delete - deactivate account instead of hard delete
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        isActive: false,
        email: `deleted_${Date.now()}_${req.user.email}`, // Prevent email conflicts
        name: 'Deleted User'
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    console.log(`🗑️ Account deactivated: ${req.user.email}`);
    
    res.json({
      message: 'Account has been deactivated successfully',
      note: 'Your data has been preserved. Contact support if you want to reactivate your account.'
    });
    
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      code: 'DELETE_ACCOUNT_ERROR'
    });
  }
});

/**
 * @route   POST /api/users/device-token
 * @desc    Register/update device token for push notifications (mobile)
 * @access  Private
 * @mobile  Supported
 */
router.post('/device-token', async (req, res) => {
  try {
    const { token, platform, deviceModel } = req.body;
    
    if (!token || !platform) {
      return res.status(400).json({
        error: 'Token and platform are required',
        code: 'MISSING_DEVICE_INFO'
      });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Update or add device token
    const existingTokenIndex = user.deviceTokens.findIndex(dt => dt.token === token);
    
    if (existingTokenIndex >= 0) {
      user.deviceTokens[existingTokenIndex].lastUsed = new Date();
      user.deviceTokens[existingTokenIndex].platform = platform;
    } else {
      user.deviceTokens.push({
        token,
        platform,
        lastUsed: new Date()
      });
    }
    
    // Keep only last 5 device tokens per user
    if (user.deviceTokens.length > 5) {
      user.deviceTokens = user.deviceTokens
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, 5);
    }
    
    await user.save();
    
    console.log(`📱 Device token updated: ${req.user.email} (${platform})`);
    
    res.json({
      message: 'Device token registered successfully'
    });
    
  } catch (error) {
    console.error('❌ Device token registration error:', error);
    res.status(500).json({
      error: 'Failed to register device token',
      code: 'DEVICE_TOKEN_ERROR'
    });
  }
});

module.exports = router;