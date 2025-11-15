const express = require('express');
const cors = require('cors');

const app = express();

// Basic CORS for testing
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend connection test successful!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/register', (req, res) => {
  console.log('🔄 Register endpoint hit:', req.body);
  res.json({
    message: 'Test registration endpoint - no database required',
    receivedData: req.body
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔄 Login endpoint hit:', req.body);
  res.json({
    message: 'Test login endpoint - no database required',
    receivedData: req.body
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Test Backend Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
});