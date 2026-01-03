/**
 * Payroll Service
 * Business logic for salary structure management and payslip generation
 */

const { pool } = require('../config/database');
const { calculateSalaryStructure, calculateProratedSalary } = require('../utils/payrollCalculator');

/**
 * Create or update salary structure for a user
 */
const upsertSalaryStructure = async (userId, monthWage, effectiveFrom) => {
  // Calculate all components using the formula
  const structure = calculateSalaryStructure(monthWage);

  const result = await pool.query(
    `INSERT INTO salary_structures (
      user_id, month_wage, yearly_wage, basic_salary, hra, 
      standard_allowance, performance_bonus, lta, fixed_allowance,
      pf_deduction, professional_tax, effective_from
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (user_id, effective_from) 
    DO UPDATE SET
      month_wage = $2, yearly_wage = $3, basic_salary = $4, hra = $5,
      standard_allowance = $6, performance_bonus = $7, lta = $8, 
      fixed_allowance = $9, pf_deduction = $10, professional_tax = $11,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [
      userId,
      structure.monthWage,
      structure.yearlyWage,
      structure.basicSalary,
      structure.hra,
      structure.standardAllowance,
      structure.performanceBonus,
      structure.lta,
      structure.fixedAllowance,
      structure.pfDeduction,
      structure.professionalTax,
      effectiveFrom,
    ]
  );

  return formatSalaryStructure(result.rows[0]);
};

/**
 * Get current salary structure for a user
 */
const getSalaryStructure = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM salary_structures 
     WHERE user_id = $1 
     ORDER BY effective_from DESC 
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return formatSalaryStructure(result.rows[0]);
};

/**
 * Get salary structure history for a user
 */
const getSalaryHistory = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM salary_structures 
     WHERE user_id = $1 
     ORDER BY effective_from DESC`,
    [userId]
  );

  return result.rows.map(formatSalaryStructure);
};

/**
 * Compute payslip for a user for a specific month
 */
const computePayslip = async (userId, year, month) => {
  // Get salary structure effective for the month
  const effectiveDate = `${year}-${String(month).padStart(2, '0')}-01`;
  
  const salaryResult = await pool.query(
    `SELECT * FROM salary_structures 
     WHERE user_id = $1 AND effective_from <= $2
     ORDER BY effective_from DESC 
     LIMIT 1`,
    [userId, effectiveDate]
  );

  if (salaryResult.rows.length === 0) {
    throw new Error('No salary structure found for this employee');
  }

  const salary = formatSalaryStructure(salaryResult.rows[0]);

  // Get attendance summary for the month
  const attendanceResult = await pool.query(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'Present') as present_days,
      COUNT(*) FILTER (WHERE status = 'OnLeave') as leave_days,
      COUNT(*) FILTER (WHERE status = 'Absent') as absent_days,
      SUM(total_hours) as total_hours
     FROM attendance 
     WHERE user_id = $1 
     AND EXTRACT(YEAR FROM date) = $2 
     AND EXTRACT(MONTH FROM date) = $3`,
    [userId, year, month]
  );

  const attendance = attendanceResult.rows[0];

  // Get user details
  const userResult = await pool.query(
    `SELECT employee_id, login_id, first_name, last_name, department, joining_date
     FROM users WHERE employee_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Calculate working days in month (excluding weekends)
  const totalWorkingDays = getWorkingDaysInMonth(year, month);
  
  // Calculate payable days (present + paid leave)
  const presentDays = parseInt(attendance.present_days) || 0;
  const leaveDays = parseInt(attendance.leave_days) || 0;
  
  // Check if leaves are paid
  const paidLeaveResult = await pool.query(
    `SELECT COUNT(*) as count FROM leave_requests
     WHERE user_id = $1 
     AND leave_type != 'Unpaid'
     AND status = 'Approved'
     AND (
       (EXTRACT(YEAR FROM start_date) = $2 AND EXTRACT(MONTH FROM start_date) = $3)
       OR (EXTRACT(YEAR FROM end_date) = $2 AND EXTRACT(MONTH FROM end_date) = $3)
     )`,
    [userId, year, month]
  );

  // For simplicity, assume all approved leaves that month are countable toward payable days
  const payableDays = Math.min(presentDays + leaveDays, totalWorkingDays);
  const unpaidDays = totalWorkingDays - payableDays;

  // Calculate prorated salary
  const prorated = calculateProratedSalary(
    {
      basicSalary: salary.basicSalary,
      hra: salary.hra,
      standardAllowance: salary.standardAllowance,
      performanceBonus: salary.performanceBonus,
      lta: salary.lta,
      fixedAllowance: salary.fixedAllowance,
      pfDeduction: salary.pfDeduction,
      professionalTax: salary.professionalTax,
    },
    totalWorkingDays,
    payableDays
  );

  return {
    employee: {
      id: user.employee_id,
      loginId: user.login_id,
      name: `${user.first_name} ${user.last_name}`,
      department: user.department,
      joiningDate: user.joining_date,
    },
    period: {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
    },
    attendance: {
      totalWorkingDays,
      presentDays,
      leaveDays,
      absentDays: parseInt(attendance.absent_days) || 0,
      payableDays,
      unpaidDays,
      totalHours: parseFloat(attendance.total_hours) || 0,
    },
    earnings: {
      basicSalary: prorated.basicSalary,
      hra: prorated.hra,
      standardAllowance: prorated.standardAllowance,
      performanceBonus: prorated.performanceBonus,
      lta: prorated.lta,
      fixedAllowance: prorated.fixedAllowance,
      grossSalary: prorated.grossSalary,
    },
    deductions: {
      pfDeduction: prorated.pfDeduction,
      professionalTax: prorated.professionalTax,
      lossOfPay: salary.monthWage - prorated.grossSalary,
      totalDeductions: prorated.totalDeductions + (salary.monthWage - prorated.grossSalary),
    },
    netSalary: prorated.netSalary,
    fullMonthSalary: salary.monthWage,
  };
};

/**
 * Generate payslips for all employees for a month (Admin)
 */
const generateMonthlyPayroll = async (year, month) => {
  // Get all active employees with salary structure
  const employeesResult = await pool.query(
    `SELECT DISTINCT u.employee_id, u.login_id, u.first_name, u.last_name, u.department,
            ss.month_wage
     FROM users u
     INNER JOIN salary_structures ss ON u.employee_id = ss.user_id
     WHERE u.is_active = true AND u.role = 'Employee'
     ORDER BY u.first_name`
  );

  const payslips = [];
  const errors = [];

  for (const emp of employeesResult.rows) {
    try {
      const payslip = await computePayslip(emp.employee_id, year, month);
      payslips.push(payslip);
    } catch (err) {
      errors.push({
        employeeId: emp.employee_id,
        loginId: emp.login_id,
        name: `${emp.first_name} ${emp.last_name}`,
        error: err.message,
      });
    }
  }

  // Calculate totals
  const totals = payslips.reduce(
    (acc, p) => ({
      grossSalary: acc.grossSalary + p.earnings.grossSalary,
      totalDeductions: acc.totalDeductions + p.deductions.totalDeductions,
      netSalary: acc.netSalary + p.netSalary,
      pfDeduction: acc.pfDeduction + p.deductions.pfDeduction,
    }),
    { grossSalary: 0, totalDeductions: 0, netSalary: 0, pfDeduction: 0 }
  );

  return {
    period: {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'long' }),
    },
    summary: {
      totalEmployees: payslips.length,
      ...totals,
    },
    payslips,
    errors,
  };
};

/**
 * Get payroll summary for dashboard
 */
const getPayrollSummary = async () => {
  // Get total salary bill
  const salaryResult = await pool.query(
    `SELECT 
      COUNT(DISTINCT ss.user_id) as employees_with_salary,
      SUM(ss.month_wage) as total_monthly_wage
     FROM salary_structures ss
     INNER JOIN users u ON ss.user_id = u.employee_id
     WHERE u.is_active = true
     AND ss.effective_from = (
       SELECT MAX(effective_from) FROM salary_structures 
       WHERE user_id = ss.user_id
     )`
  );

  const stats = salaryResult.rows[0];

  return {
    employeesWithSalary: parseInt(stats.employees_with_salary) || 0,
    totalMonthlyWage: parseFloat(stats.total_monthly_wage) || 0,
    averageSalary: stats.employees_with_salary > 0 
      ? Math.round(stats.total_monthly_wage / stats.employees_with_salary) 
      : 0,
  };
};

/**
 * Get all employees with their salary info (Admin)
 */
const getAllSalaries = async () => {
  const result = await pool.query(
    `SELECT u.employee_id, u.login_id, u.first_name, u.last_name, u.department,
            u.joining_date, u.is_active,
            ss.month_wage, ss.basic_salary, ss.effective_from
     FROM users u
     LEFT JOIN salary_structures ss ON u.employee_id = ss.user_id
       AND ss.effective_from = (
         SELECT MAX(effective_from) FROM salary_structures 
         WHERE user_id = u.employee_id
       )
     WHERE u.role = 'Employee'
     ORDER BY u.first_name`
  );

  return result.rows.map(row => ({
    employeeId: row.employee_id,
    loginId: row.login_id,
    name: `${row.first_name} ${row.last_name}`,
    department: row.department,
    joiningDate: row.joining_date,
    isActive: row.is_active,
    salary: row.month_wage ? {
      monthWage: parseFloat(row.month_wage),
      basicSalary: parseFloat(row.basic_salary),
      effectiveFrom: row.effective_from,
    } : null,
  }));
};

// Helper: Format salary structure from DB row
const formatSalaryStructure = (row) => ({
  id: row.id,
  userId: row.user_id,
  monthWage: parseFloat(row.month_wage),
  yearlyWage: parseFloat(row.yearly_wage),
  basicSalary: parseFloat(row.basic_salary),
  hra: parseFloat(row.hra),
  standardAllowance: parseFloat(row.standard_allowance),
  performanceBonus: parseFloat(row.performance_bonus),
  lta: parseFloat(row.lta),
  fixedAllowance: parseFloat(row.fixed_allowance),
  pfDeduction: parseFloat(row.pf_deduction),
  professionalTax: parseFloat(row.professional_tax),
  effectiveFrom: row.effective_from,
  grossSalary: parseFloat(row.month_wage),
  netSalary: parseFloat(row.month_wage) - parseFloat(row.pf_deduction) - parseFloat(row.professional_tax),
});

// Helper: Get working days in a month (Mon-Fri)
const getWorkingDaysInMonth = (year, month) => {
  let count = 0;
  const date = new Date(year, month - 1, 1);
  
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday or Saturday
      count++;
    }
    date.setDate(date.getDate() + 1);
  }
  
  return count;
};

module.exports = {
  upsertSalaryStructure,
  getSalaryStructure,
  getSalaryHistory,
  computePayslip,
  generateMonthlyPayroll,
  getPayrollSummary,
  getAllSalaries,
};
