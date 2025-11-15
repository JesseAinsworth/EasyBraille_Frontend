const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string().email().lowercase().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().min(6).max(128).required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'any.required': 'Password is required'
    }),
  language: Joi.string().valid('es', 'en', 'fr').optional(),
  theme: Joi.string().valid('light', 'dark', 'auto').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Password is required'
    }),
  platform: Joi.string().valid('web', 'android', 'ios').optional(),
  deviceToken: Joi.string().optional()
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: process.env.SESSION_TIMEOUT || '24h' 
  });
  
  const refreshToken = jwt.sign(
    { userId: user._id }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// ==========================================
// PUBLIC ROUTES
// ==========================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @mobile  Supported
 */
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
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
    
    const { name, email, password, language, theme } = value;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS',
        message: 'An account with this email already exists'
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      language: language || 'es',
      theme: theme || 'light'
    });
    
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Update user activity
    await user.updateActivity();
    
    console.log(`✅ New user registered: ${email}`);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        theme: user.theme,
        learningLevel: user.learningLevel,
        isEmailVerified: user.isEmailVerified
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.SESSION_TIMEOUT || '24h'
      }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists'
      });
    }
    
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR',
      message: 'Unable to create account. Please try again.'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @mobile  Supported
 */
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
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
    
    const { email, password, platform, deviceToken } = value;
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account locked',
        code: 'ACCOUNT_LOCKED',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Account has been deactivated. Please contact support.'
      });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect'
      });
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    
    // Handle device token for mobile apps
    if (platform && platform !== 'web' && deviceToken) {
      const existingTokenIndex = user.deviceTokens.findIndex(
        dt => dt.token === deviceToken
      );
      
      if (existingTokenIndex >= 0) {
        user.deviceTokens[existingTokenIndex].lastUsed = new Date();
      } else {
        user.deviceTokens.push({
          token: deviceToken,
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
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Update user activity
    await user.updateActivity();
    await user.save();
    
    console.log(`✅ User logged in: ${email} (${platform || 'web'})`);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        language: user.language,
        theme: user.theme,
        learningLevel: user.learningLevel,
        totalTranslations: user.totalTranslations,
        totalKeyboardPractice: user.totalKeyboardPractice,
        streakDays: user.streakDays,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.SESSION_TIMEOUT || '24h'
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_ERROR',
      message: 'Unable to process login. Please try again.'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 * @mobile  Supported
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    res.json({
      message: 'Token refreshed successfully',
      tokens: {
        ...tokens,
        expiresIn: process.env.SESSION_TIMEOUT || '24h'
      }
    });
    
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid refresh token',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

// ==========================================
// PROTECTED ROUTES
// ==========================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (mainly for mobile to remove device token)
 * @access  Private
 * @mobile  Supported
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { deviceToken } = req.body;
    
    if (deviceToken) {
      const user = await User.findById(req.user.userId);
      if (user) {
        user.deviceTokens = user.deviceTokens.filter(
          dt => dt.token !== deviceToken
        );
        await user.save();
      }
    }
    
    console.log(`✅ User logged out: ${req.user.email}`);
    
    res.json({
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 * @mobile  Supported
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        language: user.language,
        theme: user.theme,
        learningLevel: user.learningLevel,
        totalTranslations: user.totalTranslations,
        totalKeyboardPractice: user.totalKeyboardPractice,
        streakDays: user.streakDays,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      code: 'PROFILE_ERROR'
    });
  }
});

module.exports = router;