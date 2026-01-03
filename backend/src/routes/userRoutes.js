const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin, requireSelfOrAdmin, checkFirstLogin } = require('../middleware/auth');
const { updateProfileValidation, userIdParam } = require('../middleware/validators');

/**
 * @route   GET /api/users/meta/departments
 * @desc    Get list of departments
 * @access  Private
 */
router.get('/meta/departments', authenticate, checkFirstLogin, userController.getDepartments);

/**
 * @route   GET /api/users/meta/managers
 * @desc    Get list of managers
 * @access  Private
 */
router.get('/meta/managers', authenticate, checkFirstLogin, userController.getManagers);

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, checkFirstLogin, requireAdmin, userController.getAllUsers);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile
 * @access  Private (Self or Admin sees full, others see public only)
 */
router.get('/:userId', authenticate, checkFirstLogin, userIdParam, userController.getUserProfile);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user profile
 * @access  Private (Self can update private info, Admin can update all)
 */
router.put('/:userId', authenticate, checkFirstLogin, userIdParam, updateProfileValidation, userController.updateProfile);

/**
 * @route   POST /api/users/:userId/deactivate
 * @desc    Deactivate user (Admin only)
 * @access  Private/Admin
 */
router.post('/:userId/deactivate', authenticate, checkFirstLogin, requireAdmin, userIdParam, userController.deactivateUser);

/**
 * @route   POST /api/users/:userId/activate
 * @desc    Activate user (Admin only)
 * @access  Private/Admin
 */
router.post('/:userId/activate', authenticate, checkFirstLogin, requireAdmin, userIdParam, userController.activateUser);

module.exports = router;
