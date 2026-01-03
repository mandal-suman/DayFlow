const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/responseHelpers');

/**
 * Create new user (Admin only)
 * POST /api/auth/create-user
 */
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors);
    }

    const result = await authService.createUser(req.body);

    return successResponse(res, result, 'User created successfully', 201);
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.message === 'Email already registered') {
      return errorResponse(res, error.message, 409);
    }
    
    return errorResponse(res, 'Failed to create user', 500);
  }
};

/**
 * User login
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors);
    }

    const { loginId, password } = req.body;
    const result = await authService.login(loginId, password);

    return successResponse(res, result, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('deactivated')) {
      return errorResponse(res, error.message, 401);
    }
    
    return errorResponse(res, 'Login failed', 500);
  }
};

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors);
    }

    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user.employeeId,
      currentPassword,
      newPassword
    );

    return successResponse(res, result, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message === 'Current password is incorrect') {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, 'Failed to change password', 500);
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.employeeId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user, 'User fetched successfully');
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse(res, 'Failed to fetch user', 500);
  }
};

/**
 * Reset user password (Admin only)
 * POST /api/auth/reset-password/:userId
 */
const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await authService.resetPassword(userId);

    return successResponse(res, result, 'Password reset successful');
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 'Failed to reset password', 500);
  }
};

module.exports = {
  createUser,
  login,
  changePassword,
  getCurrentUser,
  resetPassword,
};
