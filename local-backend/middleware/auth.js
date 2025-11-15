const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens
 * Supports both web and mobile authentication
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'MISSING_TOKEN',
        message: 'Authentication token is required to access this resource'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'The user associated with this token no longer exists'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account deactivated',
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account locked',
        code: 'ACCOUNT_LOCKED',
        message: 'Your account is temporarily locked'
      });
    }
    
    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'The provided token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please login again.'
      });
    }
    
    res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR',
      message: 'Failed to authenticate token'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You need admin privileges to access this resource'
    });
  }
  next();
};

/**
 * Middleware to check if user has admin or moderator role
 */
const requireModerator = (req, res, next) => {
  if (!['admin', 'moderator'].includes(req.user?.role)) {
    return res.status(403).json({
      error: 'Moderator access required',
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You need moderator or admin privileges to access this resource'
    });
  }
  next();
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive && !user.isLocked) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name
        };
      }
    }
    
    next();
    
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireModerator,
  optionalAuth
};