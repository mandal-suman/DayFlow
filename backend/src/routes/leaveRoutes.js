/**
 * Leave Routes
 * API endpoints for leave management
 */

const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { leaveRequestValidation } = require('../middleware/validators');

// Employee routes
router.post('/request', authenticate, leaveRequestValidation, leaveController.requestLeave);
router.get('/balance', authenticate, leaveController.getBalance);
router.get('/my', authenticate, leaveController.getMyLeaves);
router.delete('/:leaveId', authenticate, leaveController.cancelLeave);

// Calendar (accessible to all authenticated users)
router.get('/calendar', authenticate, leaveController.getLeaveCalendar);

// Admin routes
router.get('/pending', authenticate, requireAdmin, leaveController.getPendingRequests);
router.get('/all', authenticate, requireAdmin, leaveController.getAllLeaves);
router.get('/summary', authenticate, requireAdmin, leaveController.getTeamSummary);
router.get('/balance/:userId', authenticate, requireAdmin, leaveController.getUserBalance);
router.post('/:leaveId/approve', authenticate, requireAdmin, leaveController.approveLeave);
router.post('/:leaveId/reject', authenticate, requireAdmin, leaveController.rejectLeave);

module.exports = router;
