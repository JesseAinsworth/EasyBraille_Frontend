const express = require('express');
const axios = require('axios');
const multer = require('multer');
const Translation = require('../models/Translation');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// MULTER CONFIGURATION
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
// UTILITY FUNCTIONS
// ==========================================

const callRailwayBackend = async (imageBuffer, filename) => {
  try {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: filename,
      contentType: 'image/jpeg'
    });
    
    const response = await axios.post(
      `${process.env.RAILWAY_BACKEND_URL}/api/braille-image`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 seconds
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Railway backend error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      throw new Error('Braille detection endpoint not found on external service');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - external service took too long to respond');
    }
    
    throw new Error('External braille detection service is unavailable');
  }
};

// ==========================================
// ROUTES
// ==========================================

/**
 * @route   POST /api/braille-image
 * @desc    Process image for braille detection (proxy to Railway + save to DB)
 * @access  Private (or public with rate limiting)
 * @mobile  Supported
 */
router.post('/', upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Image required',
        code: 'MISSING_IMAGE',
        message: 'Please provide an image file'
      });
    }
    
    console.log(`🖼️ Processing braille image: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Try to get user info if authenticated
    let userId = null;
    let userEmail = 'anonymous';
    
    // Check for authorization header
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        userEmail = decoded.email;
      } catch (error) {
        // Continue as anonymous user if token is invalid
        console.log('Invalid token, processing as anonymous user');
      }
    }
    
    // Call Railway backend for braille detection
    const railwayResult = await callRailwayBackend(req.file.buffer, req.file.originalname);
    
    const processingTime = Date.now() - startTime;
    
    // Save to database if user is authenticated
    if (userId) {
      try {
        const translation = new Translation({
          userId,
          outputText: railwayResult.texto || '',
          translationType: 'image-to-braille',
          language: 'es',
          isPublic: false,
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
          deviceInfo: {
            platform: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web'
          }
        });
        
        await translation.save();
        
        // Update user stats
        await User.findByIdAndUpdate(userId, {
          $inc: { totalTranslations: 1 },
          lastActivityDate: new Date()
        });
        
        console.log(`✅ Braille detection completed for ${userEmail}: "${railwayResult.texto?.substring(0, 50)}..."`);
      } catch (dbError) {
        console.error('❌ Failed to save translation to database:', dbError);
        // Continue and return result even if DB save fails
      }
    } else {
      console.log(`✅ Anonymous braille detection completed: "${railwayResult.texto?.substring(0, 50)}..."`);
    }
    
    // Return successful response
    res.json({
      message: 'Braille detection completed successfully',
      texto: railwayResult.texto || '',
      confidence: railwayResult.confidence || null,
      processingTime,
      imageInfo: {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      },
      railwayBackendUsed: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Braille image processing error:', error);
    
    // Handle specific error types
    if (error.message.includes('External braille detection service')) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'The braille detection service is currently unavailable. Please try again in a few minutes.',
        railwayBackendUsed: false,
        processingTime: Date.now() - startTime
      });
    }
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request timeout',
        code: 'TIMEOUT_ERROR',
        message: 'The image processing took too long. Please try with a smaller image.',
        railwayBackendUsed: false,
        processingTime: Date.now() - startTime
      });
    }
    
    if (error.message.includes('endpoint not found')) {
      return res.status(502).json({
        error: 'Service configuration error',
        code: 'ENDPOINT_ERROR',
        message: 'The braille detection service is misconfigured. Please contact support.',
        railwayBackendUsed: false,
        processingTime: Date.now() - startTime
      });
    }
    
    // Generic error response
    res.status(500).json({
      error: 'Image processing failed',
      code: 'PROCESSING_ERROR',
      message: 'Unable to process the image for braille detection. Please try again.',
      railwayBackendUsed: false,
      processingTime: Date.now() - startTime,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/**
 * @route   GET /api/braille-image/test
 * @desc    Test Railway backend connectivity
 * @access  Public
 * @mobile  Supported
 */
router.get('/test', async (req, res) => {
  try {
    // Test basic connectivity to Railway backend
    const response = await axios.get(`${process.env.RAILWAY_BACKEND_URL}/`, {
      timeout: 10000
    });
    
    res.json({
      message: 'Railway backend connectivity test successful',
      railwayStatus: 'connected',
      railwayResponse: response.data,
      endpoint: process.env.RAILWAY_BACKEND_URL,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Railway backend connectivity test failed:', error.message);
    
    res.status(503).json({
      message: 'Railway backend connectivity test failed',
      railwayStatus: 'disconnected',
      error: error.message,
      endpoint: process.env.RAILWAY_BACKEND_URL,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;