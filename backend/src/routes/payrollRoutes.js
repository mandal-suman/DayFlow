/**
 * Payroll Routes
 * API endpoints for payroll management
 */

const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { salaryStructureValidation } = require('../middleware/validators');

// Employee routes
router.get('/my-payslip', authenticate, payrollController.getMyPayslip);

// Admin routes
router.get('/summary', authenticate, requireAdmin, payrollController.getPayrollSummary);
router.get('/employees', authenticate, requireAdmin, payrollController.getAllSalaries);
router.get('/generate', authenticate, requireAdmin, payrollController.generatePayroll);

// Salary structure routes (Admin for write, Auth for read own)
router.post('/salary/:userId', authenticate, requireAdmin, salaryStructureValidation, payrollController.upsertSalary);
router.get('/salary/:userId', authenticate, payrollController.getSalary);
router.get('/salary/:userId/history', authenticate, requireAdmin, payrollController.getSalaryHistory);

// Payslip routes
router.get('/payslip/:userId', authenticate, payrollController.getPayslip);

module.exports = router;
