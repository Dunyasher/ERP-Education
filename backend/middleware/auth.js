const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('collegeId', 'name email isActive');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Check if college is active (unless super_admin)
    if (user.role !== 'super_admin' && user.collegeId && !user.collegeId.isActive) {
      return res.status(403).json({ message: 'College account is inactive. Please contact administrator.' });
    }

    req.user = user;
    // Set collegeId for easy access in routes
    if (user.collegeId) {
      req.collegeId = user.collegeId._id || user.collegeId;
    }
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    // Check if it's a MongoDB connection error
    if (error.message?.includes('MongoServerError') || error.message?.includes('connection')) {
      console.error('MongoDB connection error in auth middleware:', error.message);
      return res.status(503).json({ message: 'Database connection error. Please try again.' });
    }
    console.error('Unexpected auth error:', error.stack);
    res.status(500).json({ 
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};

