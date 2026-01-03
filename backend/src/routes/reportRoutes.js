const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Dashboard analytics - available to all authenticated users
router.get('/dashboard', reportController.getDashboardAnalytics);

// Admin-only reports
router.get('/attendance', requireAdmin, reportController.getAttendanceReport);
router.get('/payroll', requireAdmin, reportController.getPayrollReport);
router.get('/leaves', requireAdmin, reportController.getLeaveReport);

module.exports = router;
