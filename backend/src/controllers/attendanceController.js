const { validationResult } = require('express-validator');
const attendanceService = require('../services/attendanceService');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/responseHelpers');

/**
 * Mark attendance (Check In / Check Out)
 * POST /api/attendance/mark
 */
const markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return validationErrorResponse(res, errors);
    }

    const { action } = req.body;
    const result = await attendanceService.markAttendance(req.user.employeeId, action);

    const message = action === 'checkIn' ? 'Checked in successfully' : 'Checked out successfully';
    return successResponse(res, result, message);
  } catch (error) {
    console.error('Mark attendance error:', error);
    
    if (error.message.includes('Already') || error.message.includes('Must') || error.message.includes('Cannot')) {
      return errorResponse(res, error.message, 400);
    }
    
    return errorResponse(res, 'Failed to mark attendance', 500);
  }
};

/**
 * Get today's attendance status
 * GET /api/attendance/today
 */
const getTodayStatus = async (req, res) => {
  try {
    const result = await attendanceService.getTodayStatus(req.user.employeeId);
    return successResponse(res, result, 'Status fetched successfully');
  } catch (error) {
    console.error('Get today status error:', error);
    return errorResponse(res, 'Failed to fetch status', 500);
  }
};

/**
 * Get attendance history
 * GET /api/attendance/history
 */
const getAttendanceHistory = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const result = await attendanceService.getAttendanceHistory(
      req.user.employeeId,
      targetMonth,
      targetYear
    );

    return successResponse(res, result, 'History fetched successfully');
  } catch (error) {
    console.error('Get attendance history error:', error);
    return errorResponse(res, 'Failed to fetch history', 500);
  }
};

/**
 * Get attendance history for specific user (Admin or Self)
 * GET /api/attendance/history/:userId
 */
const getUserAttendanceHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    // Check authorization
    if (req.user.role !== 'Admin' && req.user.employeeId !== parseInt(userId)) {
      return errorResponse(res, 'Not authorized to view this attendance', 403);
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const result = await attendanceService.getAttendanceHistory(
      parseInt(userId),
      targetMonth,
      targetYear
    );

    return successResponse(res, result, 'History fetched successfully');
  } catch (error) {
    console.error('Get user attendance history error:', error);
    return errorResponse(res, 'Failed to fetch history', 500);
  }
};

/**
 * Get attendance summary for payroll
 * GET /api/attendance/summary/:userId
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    // Check authorization
    if (req.user.role !== 'Admin' && req.user.employeeId !== parseInt(userId)) {
      return errorResponse(res, 'Not authorized to view this data', 403);
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const result = await attendanceService.getAttendanceSummary(
      parseInt(userId),
      targetMonth,
      targetYear
    );

    return successResponse(res, result, 'Summary fetched successfully');
  } catch (error) {
    console.error('Get attendance summary error:', error);
    return errorResponse(res, 'Failed to fetch summary', 500);
  }
};

/**
 * Get all attendance by date (Admin only)
 * GET /api/attendance/all
 */
const getAllAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await attendanceService.getAllAttendanceByDate(targetDate);
    return successResponse(res, result, 'Attendance fetched successfully');
  } catch (error) {
    console.error('Get all attendance error:', error);
    return errorResponse(res, 'Failed to fetch attendance', 500);
  }
};

/**
 * Get team overview (Admin only)
 * GET /api/attendance/overview
 */
const getTeamOverview = async (req, res) => {
  try {
    const { date } = req.query;
    const result = await attendanceService.getTeamOverview(date);
    return successResponse(res, result, 'Overview fetched successfully');
  } catch (error) {
    console.error('Get team overview error:', error);
    return errorResponse(res, 'Failed to fetch overview', 500);
  }
};

module.exports = {
  markAttendance,
  getTodayStatus,
  getAttendanceHistory,
  getUserAttendanceHistory,
  getAttendanceSummary,
  getAllAttendanceByDate,
  getTeamOverview,
};
