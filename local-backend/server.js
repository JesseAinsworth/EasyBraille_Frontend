const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ==========================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ==========================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration for web and mobile
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://yourdomain.com'
    ];
    
    // Allow requests with no origin (mobile apps)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// DATABASE CONNECTION
// ==========================================

// MongoDB connection (non-blocking for development)
let dbConnected = false;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/easybraille')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    dbConnected = true;
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️  Continuing without database - some features will be limited');
    dbConnected = false;
  });

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EasyBraille Local Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    features: [
      'Authentication',
      'User Management', 
      'Translation History',
      'Admin Panel',
      'Mobile API',
      'Braille Detection Proxy'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbConnected ? 'connected' : 'disconnected',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/translations', require('./routes/translations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/braille-image', require('./routes/braille'));
app.use('/api/keyboard-actions', require('./routes/keyboard'));

// Mobile-specific routes
app.use('/api/mobile', require('./routes/mobile'));

// Test endpoint for frontend connection
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend connection successful!',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR',
      origin: req.get('origin')
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.message
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'TOKEN_ERROR'
    });
  }
  
  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    code: 'SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// ==========================================
// SERVER START
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('🚀 EasyBraille Local Backend Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📱 Mobile API: http://localhost:${PORT}/api/mobile`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Available endpoints:`);
  console.log(`   • POST /api/auth/register`);
  console.log(`   • POST /api/auth/login`);
  console.log(`   • GET  /api/translations`);
  console.log(`   • POST /api/translations`);
  console.log(`   • POST /api/braille-image`);
  console.log(`   • GET  /api/admin/users`);
  console.log(`   • GET  /api/mobile/auth/login`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode - Verbose logging enabled');
  }
});

module.exports = app;