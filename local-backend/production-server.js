const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoMemoryServer } = require('mongodb-memory-server');

// ==========================================
// MONGODB MEMORY SERVER SETUP
// ==========================================
let mongoServer;
let dbConnected = false;

async function setupDatabase() {
  try {
    // For development, use MongoDB Memory Server
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 Starting MongoDB Memory Server...');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`📊 Memory Database URI: ${mongoUri}`);
      
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB Memory Server');
      dbConnected = true;
    } else {
      // For production, use real MongoDB
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/easybraille';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
      dbConnected = true;
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.log('⚠️  Continuing without database - limited functionality');
    dbConnected = false;
  }
}

// ==========================================
// EXPRESS APP SETUP
// ==========================================
const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-frontend-domain.com'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'TooManyRequests',
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde'
  }
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// HEALTH CHECK & BASIC ROUTES
// ==========================================

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EasyBraille Local Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
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

// ==========================================
// DATABASE-DEPENDENT ROUTES
// ==========================================

// Only load routes if database is connected
function loadRoutes() {
  if (dbConnected) {
    console.log('📚 Loading database-dependent routes...');
    
    try {
      // Import routes
      app.use('/api/auth', require('./routes/auth'));
      app.use('/api/translations', require('./routes/translations'));
      app.use('/api/braille-image', require('./routes/braille'));
      app.use('/api/keyboard-actions', require('./routes/keyboard'));
      app.use('/api/users', require('./routes/users'));
      app.use('/api/admin', require('./routes/admin'));
      app.use('/api/mobile', require('./routes/mobile'));
      
      console.log('✅ All routes loaded successfully');
    } catch (error) {
      console.error('❌ Error loading routes:', error);
      console.log('⚠️  Some routes may not be available');
    }
  } else {
    console.log('⚠️  Database not connected - providing mock endpoints');
    
    // Mock authentication endpoints
    app.post('/api/auth/register', (req, res) => {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Nombre, email y contraseña son requeridos'
        });
      }
      
      res.status(201).json({
        message: 'Usuario registrado exitosamente (sin base de datos)',
        user: {
          id: 'mock-user-id',
          name,
          email,
          role: 'user',
          language: 'es',
          theme: 'light',
          learningLevel: 'beginner',
          totalTranslations: 0,
          totalKeyboardPractice: 0,
          streakDays: 0,
          isEmailVerified: false,
          lastLoginAt: null
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: '15m'
        }
      });
    });
    
    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          error: 'ValidationError',
          message: 'Email y contraseña son requeridos'
        });
      }
      
      res.json({
        message: 'Inicio de sesión exitoso (sin base de datos)',
        user: {
          id: 'mock-user-id',
          name: 'Usuario Mock',
          email,
          role: 'user',
          language: 'es',
          theme: 'light',
          learningLevel: 'beginner',
          totalTranslations: 5,
          totalKeyboardPractice: 3,
          streakDays: 2,
          isEmailVerified: true,
          lastLoginAt: new Date().toISOString()
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: '15m'
        }
      });
    });
  }
}

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
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR',
      origin: req.get('origin')
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Datos de entrada inválidos',
      details: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// ==========================================
// SERVER START
// ==========================================

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Setup database first
    await setupDatabase();
    
    // Load routes after database setup
    loadRoutes();
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 EasyBraille Backend Started');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📱 Mobile API: http://localhost:${PORT}/api/mobile`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Database: ${dbConnected ? 'Memory Server' : 'Mock Mode'}`);
      console.log(`📚 Available endpoints:`);
      console.log(`   • POST /api/auth/register`);
      console.log(`   • POST /api/auth/login`);
      if (dbConnected) {
        console.log(`   • GET  /api/translations`);
        console.log(`   • POST /api/translations`);
        console.log(`   • POST /api/braille-image`);
        console.log(`   • GET  /api/admin/users`);
        console.log(`   • GET  /api/mobile/dashboard`);
      }
      console.log(`🔧 ${dbConnected ? 'Full' : 'Mock'} mode - ${dbConnected ? 'All features' : 'Limited functionality'} enabled`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🔄 Shutting down gracefully...');
      server.close(() => {
        mongoose.connection.close();
        if (mongoServer) {
          mongoServer.stop();
        }
        console.log('👋 Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;