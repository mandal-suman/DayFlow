/**
 * Leave Controller
 * HTTP request handlers for leave management
 */

const { validationResult } = require('express-validator');
const leaveService = require('../services/leaveService');
const { success, error } = require('../utils/responseHelpers');

/**
 * Request a new leave
 * POST /api/leaves/request
 */
const requestLeave = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const leave = await leaveService.requestLeave(req.user.id, req.body);
    return success(res, leave, 'Leave request submitted successfully', 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * Get leave balance
 * GET /api/leaves/balance
 */
const getBalance = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const balance = await leaveService.getLeaveBalance(req.user.id, parseInt(year));
    return success(res, balance);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get user's leave balance (Admin)
 * GET /api/leaves/balance/:userId
 */
const getUserBalance = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const balance = await leaveService.getLeaveBalance(parseInt(req.params.userId), parseInt(year));
    return success(res, balance);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get my leave requests
 * GET /api/leaves/my
 */
const getMyLeaves = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      year: req.query.year ? parseInt(req.query.year) : null,
    };
    const leaves = await leaveService.getMyLeaves(req.user.id, filters);
    return success(res, leaves);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get pending leave requests (Admin)
 * GET /api/leaves/pending
 */
const getPendingRequests = async (req, res) => {
  try {
    const requests = await leaveService.getPendingRequests();
    return success(res, requests);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get all leave requests (Admin)
 * GET /api/leaves/all
 */
const getAllLeaves = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      userId: req.query.userId ? parseInt(req.query.userId) : null,
      year: req.query.year ? parseInt(req.query.year) : null,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    };
    const result = await leaveService.getAllLeaves(filters);
    return success(res, result);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Approve a leave request (Admin)
 * POST /api/leaves/:leaveId/approve
 */
const approveLeave = async (req, res) => {
  try {
    const leave = await leaveService.approveLeave(parseInt(req.params.leaveId), req.user.id);
    return success(res, leave, 'Leave request approved successfully');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * Reject a leave request (Admin)
 * POST /api/leaves/:leaveId/reject
 */
const rejectLeave = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return error(res, 'Rejection reason is required', 400);
    }
    const leave = await leaveService.rejectLeave(parseInt(req.params.leaveId), req.user.id, reason);
    return success(res, leave, 'Leave request rejected');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * Cancel a leave request (by employee)
 * DELETE /api/leaves/:leaveId
 */
const cancelLeave = async (req, res) => {
  try {
    const result = await leaveService.cancelLeave(parseInt(req.params.leaveId), req.user.id);
    return success(res, result, 'Leave request cancelled');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * Get leave calendar data
 * GET /api/leaves/calendar
 */
const getLeaveCalendar = async (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
    const calendar = await leaveService.getLeaveCalendar(year, month);
    return success(res, calendar);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get team leave summary (Admin)
 * GET /api/leaves/summary
 */
const getTeamSummary = async (req, res) => {
  try {
    const summary = await leaveService.getTeamLeaveSummary();
    return success(res, summary);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  requestLeave,
  getBalance,
  getUserBalance,
  getMyLeaves,
  getPendingRequests,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveCalendar,
  getTeamSummary,
};
