const express = require('express');
const cors = require('cors');

const app = express();

// CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Backend is running without database',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend connection successful!',
    timestamp: new Date().toISOString()
  });
});

// Mock auth endpoints for testing frontend connection
app.post('/api/auth/register', (req, res) => {
  console.log('🔄 Register endpoint hit');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  const { name, email, password } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Nombre, email y contraseña son requeridos',
      details: {
        name: !name ? 'Nombre es requerido' : null,
        email: !email ? 'Email es requerido' : null,
        password: !password ? 'Contraseña es requerida' : null
      }
    });
  }
  
  // Mock successful registration
  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: {
      id: 'test-user-id',
      name,
      email,
      role: 'user',
      avatar: null,
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
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresIn: '15m'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔄 Login endpoint hit');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Email y contraseña son requeridos'
    });
  }
  
  // Mock successful login
  res.json({
    message: 'Inicio de sesión exitoso',
    user: {
      id: 'test-user-id',
      name: 'Usuario Test',
      email,
      role: 'user',
      avatar: null,
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
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresIn: '15m'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
  
  console.log('🚀 EasyBraille Mock Backend Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Available endpoints:`);
  console.log(`   • POST /api/auth/register (mock)`);
  console.log(`   • POST /api/auth/login (mock)`);
  console.log(`   • GET  /api/health`);
  console.log(`   • GET  /api/test`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;