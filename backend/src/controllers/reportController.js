const reportService = require('../services/reportService');
const { success, error } = require('../utils/responseHelpers');

/**
 * Get attendance report for a date range
 * GET /api/reports/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&department=X
 */
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    if (!startDate || !endDate) {
      return error(res, 'Start date and end date are required', 400);
    }
    
    const report = await reportService.getAttendanceReport(startDate, endDate, department);
    return success(res, report);
  } catch (err) {
    console.error('Get attendance report error:', err);
    return error(res, 'Failed to generate attendance report');
  }
};

/**
 * Get payroll report for a month
 * GET /api/reports/payroll?year=YYYY&month=MM
 */
const getPayrollReport = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    
    const report = await reportService.getPayrollReport(year, month);
    return success(res, report);
  } catch (err) {
    console.error('Get payroll report error:', err);
    return error(res, 'Failed to generate payroll report');
  }
};

/**
 * Get leave report for a year
 * GET /api/reports/leaves?year=YYYY
 */
const getLeaveReport = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    const report = await reportService.getLeaveReport(year);
    return success(res, report);
  } catch (err) {
    console.error('Get leave report error:', err);
    return error(res, 'Failed to generate leave report');
  }
};

/**
 * Get dashboard analytics
 * GET /api/reports/dashboard
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const analytics = await reportService.getDashboardAnalytics();
    return success(res, analytics);
  } catch (err) {
    console.error('Get dashboard analytics error:', err);
    return error(res, 'Failed to get dashboard analytics');
  }
};

module.exports = {
  getAttendanceReport,
  getPayrollReport,
  getLeaveReport,
  getDashboardAnalytics
};
