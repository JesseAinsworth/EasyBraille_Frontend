const express = require('express');
const axios = require('axios');
const multer = require('multer');
const Joi = require('joi');
const Translation = require('../models/Translation');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ==========================================

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const textTranslationSchema = Joi.object({
  inputText: Joi.string().max(5000).required()
    .messages({
      'string.max': 'Text cannot exceed 5000 characters',
      'any.required': 'Input text is required'
    }),
  translationType: Joi.string().valid('text-to-braille', 'braille-to-text').required(),
  language: Joi.string().valid('es', 'en', 'fr').optional(),
  isPublic: Joi.boolean().optional(),
  deviceInfo: Joi.object({
    platform: Joi.string().valid('web', 'android', 'ios').optional(),
    appVersion: Joi.string().optional(),
    deviceModel: Joi.string().optional()
  }).optional()
});

const ratingSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  feedback: Joi.string().max(1000).optional()
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const translateTextToBraille = (text) => {
  // Simple braille mapping - in production, use a proper braille library
  const brailleMap = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵', ' ': ' ', '.': '⠲', ',': '⠂', '?': '⠢',
    '!': '⠖', ':': '⠒', ';': '⠆', '-': '⠤', '(': '⠶', ')': '⠶'
  };
  
  return text.toLowerCase().split('').map(char => brailleMap[char] || char).join('');
};

const translateBrailleToText = (braille) => {
  // Reverse mapping for braille to text
  const textMap = {
    '⠁': 'a', '⠃': 'b', '⠉': 'c', '⠙': 'd', '⠑': 'e', '⠋': 'f', '⠛': 'g', '⠓': 'h', '⠊': 'i', '⠚': 'j',
    '⠅': 'k', '⠇': 'l', '⠍': 'm', '⠝': 'n', '⠕': 'o', '⠏': 'p', '⠟': 'q', '⠗': 'r', '⠎': 's', '⠞': 't',
    '⠥': 'u', '⠧': 'v', '⠺': 'w', '⠭': 'x', '⠽': 'y', '⠵': 'z', ' ': ' ', '⠲': '.', '⠂': ',', '⠢': '?',
    '⠖': '!', '⠒': ':', '⠆': ';', '⠤': '-', '⠶': '()'
  };
  
  return braille.split('').map(char => textMap[char] || char).join('');
};

const callRailwayBackend = async (imageBuffer, filename) => {
  try {
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, filename);
    
    const response = await axios.post(
      `${process.env.RAILWAY_BACKEND_URL}/api/braille-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000 // 30 seconds
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Railway backend error:', error.message);
    throw new Error('External braille detection service is unavailable');
  }
};

// ==========================================
// ROUTES
// ==========================================

/**
 * @route   POST /api/translations/text
 * @desc    Translate text to/from braille
 * @access  Private
 * @mobile  Supported
 */
router.post('/text', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate input
    const { error, value } = textTranslationSchema.validate(req.body);
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
    
    const { inputText, translationType, language, isPublic, deviceInfo } = value;
    
    // Perform translation
    let outputText;
    if (translationType === 'text-to-braille') {
      outputText = translateTextToBraille(inputText);
    } else {
      outputText = translateBrailleToText(inputText);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Save translation to database
    const translation = new Translation({
      userId: req.user.userId,
      inputText,
      outputText,
      translationType,
      language: language || 'es',
      isPublic: isPublic || false,
      processingTime,
      railwayBackendUsed: false,
      deviceInfo: deviceInfo || { platform: 'web' }
    });
    
    await translation.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { totalTranslations: 1 },
      lastActivityDate: new Date()
    });
    
    console.log(`✅ Text translation completed for ${req.user.email}: ${translationType}`);
    
    res.json({
      message: 'Translation completed successfully',
      translation: {
        id: translation._id,
        inputText,
        outputText,
        translationType,
        language: translation.language,
        processingTime,
        createdAt: translation.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Text translation error:', error);
    res.status(500).json({
      error: 'Translation failed',
      code: 'TRANSLATION_ERROR',
      message: 'Unable to process translation. Please try again.'
    });
  }
});

/**
 * @route   POST /api/translations/image
 * @desc    Translate image to braille/text using Railway backend
 * @access  Private
 * @mobile  Supported
 */
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Image required',
        code: 'MISSING_IMAGE',
        message: 'Please provide an image file'
      });
    }
    
    const { translationType = 'image-to-braille', language = 'es', isPublic = false } = req.body;
    
    // Parse device info if provided (JSON string from mobile)
    let deviceInfo = { platform: 'web' };
    if (req.body.deviceInfo) {
      try {
        deviceInfo = JSON.parse(req.body.deviceInfo);
      } catch (e) {
        console.warn('Failed to parse deviceInfo:', e);
      }
    }
    
    // Call Railway backend for braille detection
    const railwayResult = await callRailwayBackend(req.file.buffer, req.file.originalname);
    
    let outputText = railwayResult.texto || '';
    
    // If user wants text output and we got braille, convert it
    if (translationType === 'image-to-text' && outputText) {
      outputText = translateBrailleToText(outputText);
    }
    
    const processingTime = Date.now() - startTime;
    
    // Save translation to database
    const translation = new Translation({
      userId: req.user.userId,
      outputText,
      translationType,
      language,
      isPublic,
      processingTime,
      railwayBackendUsed: true,
      confidence: railwayResult.confidence || null,
      imageData: {
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadDate: new Date()
      },
      deviceInfo
    });
    
    await translation.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { totalTranslations: 1 },
      lastActivityDate: new Date()
    });
    
    console.log(`✅ Image translation completed for ${req.user.email}: ${translationType}`);
    
    res.json({
      message: 'Image translation completed successfully',
      translation: {
        id: translation._id,
        outputText,
        translationType,
        language,
        confidence: translation.confidence,
        processingTime,
        imageInfo: {
          filename: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype
        },
        createdAt: translation.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Image translation error:', error);
    
    if (error.message.includes('External braille detection service')) {
      return res.status(503).json({
        error: 'Service unavailable',
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'Braille detection service is temporarily unavailable. Please try again later.'
      });
    }
    
    res.status(500).json({
      error: 'Image translation failed',
      code: 'IMAGE_TRANSLATION_ERROR',
      message: 'Unable to process image translation. Please try again.'
    });
  }
});

/**
 * @route   GET /api/translations
 * @desc    Get user's translation history
 * @access  Private
 * @mobile  Supported
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      language,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = { userId: req.user.userId };
    
    if (type) {
      query.translationType = type;
    }
    
    if (language) {
      query.language = language;
    }
    
    if (search) {
      query.$or = [
        { inputText: { $regex: search, $options: 'i' } },
        { outputText: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const translations = await Translation.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-errorLogs'); // Exclude error logs from user response
    
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
    console.error('❌ Get translations error:', error);
    res.status(500).json({
      error: 'Failed to get translations',
      code: 'GET_TRANSLATIONS_ERROR'
    });
  }
});

/**
 * @route   GET /api/translations/stats
 * @desc    Get user's translation statistics
 * @access  Private
 * @mobile  Supported
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Translation.getUserStats(req.user.userId);
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await Translation.aggregate([
      {
        $match: {
          userId: req.user.userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    res.json({
      stats,
      recentActivity
    });
    
  } catch (error) {
    console.error('❌ Get translation stats error:', error);
    res.status(500).json({
      error: 'Failed to get translation statistics',
      code: 'GET_STATS_ERROR'
    });
  }
});

/**
 * @route   PUT /api/translations/:id/rating
 * @desc    Rate a translation
 * @access  Private
 * @mobile  Supported
 */
router.put('/:id/rating', authenticateToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = ratingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details[0].message
      });
    }
    
    const { rating, feedback } = value;
    
    // Find translation
    const translation = await Translation.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!translation) {
      return res.status(404).json({
        error: 'Translation not found',
        code: 'TRANSLATION_NOT_FOUND'
      });
    }
    
    // Update rating
    await translation.setRating(rating, feedback);
    
    res.json({
      message: 'Rating updated successfully',
      translation: {
        id: translation._id,
        rating: translation.userRating,
        feedback: translation.feedback
      }
    });
    
  } catch (error) {
    console.error('❌ Update rating error:', error);
    res.status(500).json({
      error: 'Failed to update rating',
      code: 'UPDATE_RATING_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/translations/:id
 * @desc    Delete a translation
 * @access  Private
 * @mobile  Supported
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const translation = await Translation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!translation) {
      return res.status(404).json({
        error: 'Translation not found',
        code: 'TRANSLATION_NOT_FOUND'
      });
    }
    
    // Update user stats
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { totalTranslations: -1 }
    });
    
    res.json({
      message: 'Translation deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete translation error:', error);
    res.status(500).json({
      error: 'Failed to delete translation',
      code: 'DELETE_TRANSLATION_ERROR'
    });
  }
});

/**
 * @route   GET /api/translations/public
 * @desc    Get public translations (for inspiration/examples)
 * @access  Public (optional auth for personalization)
 * @mobile  Supported
 */
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { limit = 10, type } = req.query;
    
    const query = { isPublic: true };
    if (type) {
      query.translationType = type;
    }
    
    const translations = await Translation.find(query)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('inputText outputText translationType confidence createdAt userId');
    
    res.json({
      translations
    });
    
  } catch (error) {
    console.error('❌ Get public translations error:', error);
    res.status(500).json({
      error: 'Failed to get public translations',
      code: 'GET_PUBLIC_TRANSLATIONS_ERROR'
    });
  }
});

module.exports = router;