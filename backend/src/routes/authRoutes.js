const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { createUserValidation, loginValidation, changePasswordValidation } = require('../middleware/validators');

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/create-user
 * @desc    Create new user (Admin only)
 * @access  Private/Admin
 */
router.post('/create-user', authenticate, requireAdmin, createUserValidation, authController.createUser);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, changePasswordValidation, authController.changePassword);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/auth/reset-password/:userId
 * @desc    Reset user password (Admin only)
 * @access  Private/Admin
 */
router.post('/reset-password/:userId', authenticate, requireAdmin, authController.resetPassword);

module.exports = router;
