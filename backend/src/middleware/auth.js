const jwt = require('jsonwebtoken');
const config = require('../config');
const { errorResponse } = require('../utils/responseHelpers');

/**
 * Verify JWT token middleware
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No token provided.', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired. Please login again.', 401);
    }
    return errorResponse(res, 'Invalid token.', 401);
  }
};

/**
 * Check if user is Admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return errorResponse(res, 'Access denied. Admin privileges required.', 403);
  }
  next();
};

/**
 * Check if user is accessing their own resource or is Admin
 */
const requireSelfOrAdmin = (req, res, next) => {
  const targetUserId = parseInt(req.params.userId || req.params.id);
  
  if (req.user.role === 'Admin' || req.user.employeeId === targetUserId) {
    next();
  } else {
    return errorResponse(res, 'Access denied. You can only access your own data.', 403);
  }
};

/**
 * Check if user needs to change password (first login)
 */
const checkFirstLogin = (req, res, next) => {
  // Skip check for password change endpoint
  if (req.path === '/api/auth/change-password') {
    return next();
  }
  
  if (req.user.isFirstLogin) {
    return errorResponse(res, 'Password change required. Please change your password.', 403, {
      requirePasswordChange: true,
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireSelfOrAdmin,
  checkFirstLogin,
};
