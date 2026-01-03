/**
 * Payroll Controller
 * HTTP request handlers for payroll management
 */

const { validationResult } = require('express-validator');
const payrollService = require('../services/payrollService');
const { success, error } = require('../utils/responseHelpers');

/**
 * Create or update salary structure
 * POST /api/payroll/salary/:userId
 */
const upsertSalary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { monthWage, effectiveFrom } = req.body;
    const salary = await payrollService.upsertSalaryStructure(
      parseInt(req.params.userId),
      parseFloat(monthWage),
      effectiveFrom
    );
    return success(res, salary, 'Salary structure saved successfully');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * Get salary structure for a user
 * GET /api/payroll/salary/:userId
 */
const getSalary = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check permission: Admin can see all, Employee can only see own
    if (req.user.role !== 'Admin' && req.user.id !== userId) {
      return error(res, 'Access denied', 403);
    }

    const salary = await payrollService.getSalaryStructure(userId);
    
    if (!salary) {
      return error(res, 'No salary structure found', 404);
    }

    return success(res, salary);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get salary history for a user
 * GET /api/payroll/salary/:userId/history
 */
const getSalaryHistory = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Admin only
    if (req.user.role !== 'Admin') {
      return error(res, 'Access denied', 403);
    }

    const history = await payrollService.getSalaryHistory(userId);
    return success(res, history);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Compute payslip for a user
 * GET /api/payroll/payslip/:userId
 */
const getPayslip = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    // Check permission: Admin can see all, Employee can only see own
    if (req.user.role !== 'Admin' && req.user.id !== userId) {
      return error(res, 'Access denied', 403);
    }

    const payslip = await payrollService.computePayslip(userId, year, month);
    return success(res, payslip);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * Get own payslip
 * GET /api/payroll/my-payslip
 */
const getMyPayslip = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const payslip = await payrollService.computePayslip(req.user.id, year, month);
    return success(res, payslip);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * Generate monthly payroll (Admin)
 * GET /api/payroll/generate
 */
const generatePayroll = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const payroll = await payrollService.generateMonthlyPayroll(year, month);
    return success(res, payroll);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get payroll summary (Admin)
 * GET /api/payroll/summary
 */
const getPayrollSummary = async (req, res) => {
  try {
    const summary = await payrollService.getPayrollSummary();
    return success(res, summary);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * Get all employees with salaries (Admin)
 * GET /api/payroll/employees
 */
const getAllSalaries = async (req, res) => {
  try {
    const employees = await payrollService.getAllSalaries();
    return success(res, employees);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  upsertSalary,
  getSalary,
  getSalaryHistory,
  getPayslip,
  getMyPayslip,
  generatePayroll,
  getPayrollSummary,
  getAllSalaries,
};
