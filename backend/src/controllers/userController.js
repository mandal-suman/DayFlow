const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/responseHelpers');

/**
 * Get all users (Admin only)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, department, isActive, search } = req.query;
    
    const result = await userService.getAllUsers(
      parseInt(page),
      parseInt(limit),
      { role, department, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined, search }
    );

    return successResponse(res, result, 'Users fetched successfully');
  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, 'Failed to fetch users', 500);
  }
};

/**
 * Get user profile
 * GET /api/users/:userId
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserProfile(parseInt(userId), req.user);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user, 'User profile fetched successfully');
  } catch (error) {
    console.error('Get user profile error:', error);
    return errorResponse(res, 'Failed to fetch user profile', 500);
  }
};

/**
 * Update user profile
 * PUT /api/users/:userId
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors);
    }

    const { userId } = req.params;
    const result = await userService.updateProfile(
      parseInt(userId),
      req.body,
      req.user
    );

    return successResponse(res, result, 'Profile updated successfully');
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.message === 'Not authorized to update this profile') {
      return errorResponse(res, error.message, 403);
    }
    
    if (error.message === 'No valid fields to update') {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

/**
 * Get departments list
 * GET /api/users/meta/departments
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await userService.getDepartments();
    return successResponse(res, departments, 'Departments fetched successfully');
  } catch (error) {
    console.error('Get departments error:', error);
    return errorResponse(res, 'Failed to fetch departments', 500);
  }
};

/**
 * Get managers list
 * GET /api/users/meta/managers
 */
const getManagers = async (req, res) => {
  try {
    const managers = await userService.getManagers();
    return successResponse(res, managers, 'Managers fetched successfully');
  } catch (error) {
    console.error('Get managers error:', error);
    return errorResponse(res, 'Failed to fetch managers', 500);
  }
};

/**
 * Deactivate user (Admin only)
 * POST /api/users/:userId/deactivate
 */
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userService.deactivateUser(parseInt(userId));
    return successResponse(res, result, 'User deactivated successfully');
  } catch (error) {
    console.error('Deactivate user error:', error);
    
    if (error.message === 'User not found') {
      return errorResponse(res, error.message, 404);
    }
    
    return errorResponse(res, 'Failed to deactivate user', 500);
  }
};

/**
 * Activate user (Admin only)
 * POST /api/users/:userId/activate
 */
const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userService.activateUser(parseInt(userId));
    return successResponse(res, result, 'User activated successfully');
  } catch (error) {
    console.error('Activate user error:', error);
    
    if (error.message === 'User not found') {
      return errorResponse(res, error.message, 404);
    }
    
    return errorResponse(res, 'Failed to activate user', 500);
  }
};

module.exports = {
  getAllUsers,
  getUserProfile,
  updateProfile,
  getDepartments,
  getManagers,
  deactivateUser,
  activateUser,
};
