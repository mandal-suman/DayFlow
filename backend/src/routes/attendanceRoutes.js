const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requireAdmin, checkFirstLogin } = require('../middleware/auth');
const { markAttendanceValidation } = require('../middleware/validators');

/**
 * @route   POST /api/attendance/mark
 * @desc    Mark attendance (Check In / Check Out)
 * @access  Private
 */
router.post('/mark', authenticate, checkFirstLogin, markAttendanceValidation, attendanceController.markAttendance);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance status
 * @access  Private
 */
router.get('/today', authenticate, checkFirstLogin, attendanceController.getTodayStatus);

/**
 * @route   GET /api/attendance/history
 * @desc    Get own attendance history
 * @access  Private
 */
router.get('/history', authenticate, checkFirstLogin, attendanceController.getAttendanceHistory);

/**
 * @route   GET /api/attendance/history/:userId
 * @desc    Get user's attendance history (Admin or Self)
 * @access  Private
 */
router.get('/history/:userId', authenticate, checkFirstLogin, attendanceController.getUserAttendanceHistory);

/**
 * @route   GET /api/attendance/summary/:userId
 * @desc    Get attendance summary for payroll
 * @access  Private (Admin or Self)
 */
router.get('/summary/:userId', authenticate, checkFirstLogin, attendanceController.getAttendanceSummary);

/**
 * @route   GET /api/attendance/all
 * @desc    Get all attendance by date (Admin only)
 * @access  Private/Admin
 */
router.get('/all', authenticate, checkFirstLogin, requireAdmin, attendanceController.getAllAttendanceByDate);

/**
 * @route   GET /api/attendance/overview
 * @desc    Get team attendance overview (Admin only)
 * @access  Private/Admin
 */
router.get('/overview', authenticate, checkFirstLogin, requireAdmin, attendanceController.getTeamOverview);

module.exports = router;
