const db = require('../config/database');

/**
 * Report Service - Generates various HR reports
 */

// Get attendance report for a date range
const getAttendanceReport = async (startDate, endDate, departmentFilter = null) => {
  let query = `
    SELECT 
      u.id as employee_id,
      u.login_id,
      u.first_name || ' ' || u.last_name as name,
      u.department,
      COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_days,
      COUNT(CASE WHEN a.status = 'OnLeave' THEN 1 END) as leave_days,
      COUNT(a.id) as total_records,
      ROUND(AVG(CASE WHEN a.total_hours > 0 THEN a.total_hours ELSE NULL END)::numeric, 2) as avg_hours
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id 
      AND a.date BETWEEN $1 AND $2
    WHERE u.role = 'Employee' AND u.is_active = true
  `;
  
  const params = [startDate, endDate];
  
  if (departmentFilter) {
    query += ` AND u.department = $3`;
    params.push(departmentFilter);
  }
  
  query += `
    GROUP BY u.id, u.login_id, u.first_name, u.last_name, u.department
    ORDER BY u.department, u.first_name
  `;
  
  const result = await db.query(query, params);
  
  // Calculate working days in period
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }
  
  return {
    period: { startDate, endDate, workingDays },
    employees: result.rows.map(emp => ({
      ...emp,
      present_days: parseInt(emp.present_days) || 0,
      absent_days: parseInt(emp.absent_days) || 0,
      leave_days: parseInt(emp.leave_days) || 0,
      attendance_percentage: workingDays > 0 
        ? Math.round(((parseInt(emp.present_days) || 0) / workingDays) * 100) 
        : 0
    })),
    summary: {
      totalEmployees: result.rows.length,
      avgAttendance: result.rows.length > 0 
        ? Math.round(result.rows.reduce((sum, e) => sum + (parseInt(e.present_days) || 0), 0) / result.rows.length)
        : 0
    }
  };
};

// Get payroll report for a month
const getPayrollReport = async (year, month) => {
  const query = `
    SELECT 
      u.id as employee_id,
      u.login_id,
      u.first_name || ' ' || u.last_name as name,
      u.department,
      ss.month_wage,
      ss.basic_salary,
      ss.hra,
      ss.standard_allowance,
      ss.performance_bonus,
      ss.lta,
      ss.fixed_allowance,
      ss.pf_deduction,
      ss.professional_tax
    FROM users u
    INNER JOIN salary_structures ss ON u.id = ss.user_id AND ss.is_current = true
    WHERE u.role = 'Employee' AND u.is_active = true
    ORDER BY u.department, u.first_name
  `;
  
  const result = await db.query(query);
  
  // Get attendance data for payable days calculation
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Calculate working days
  let totalWorkingDays = 0;
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) totalWorkingDays++;
  }
  
  const payrollData = await Promise.all(result.rows.map(async (emp) => {
    // Get attendance for this employee
    const attendanceQuery = `
      SELECT 
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'OnLeave' THEN 1 END) as on_leave
      FROM attendance
      WHERE user_id = $1 AND date BETWEEN $2 AND $3
    `;
    const attResult = await db.query(attendanceQuery, [emp.employee_id, startDate, endDate]);
    const att = attResult.rows[0] || { present: 0, on_leave: 0 };
    
    // Get paid leave days
    const leaveQuery = `
      SELECT COUNT(*) as paid_leave
      FROM leave_requests
      WHERE user_id = $1 
        AND status = 'Approved'
        AND type IN ('Paid', 'Sick')
        AND start_date <= $3 
        AND end_date >= $2
    `;
    const leaveResult = await db.query(leaveQuery, [emp.employee_id, startDate, endDate]);
    const paidLeave = parseInt(leaveResult.rows[0]?.paid_leave) || 0;
    
    const presentDays = parseInt(att.present) || 0;
    const payableDays = presentDays + paidLeave;
    
    // Prorated calculation
    const ratio = totalWorkingDays > 0 ? payableDays / totalWorkingDays : 0;
    
    const grossSalary = Math.round(emp.month_wage * ratio);
    const pfDeduction = Math.round(emp.pf_deduction * ratio);
    const profTax = payableDays > 0 ? emp.professional_tax : 0;
    const netSalary = grossSalary - pfDeduction - profTax;
    
    return {
      employeeId: emp.employee_id,
      loginId: emp.login_id,
      name: emp.name,
      department: emp.department,
      monthWage: emp.month_wage,
      presentDays,
      payableDays,
      totalWorkingDays,
      grossSalary,
      deductions: {
        pf: pfDeduction,
        profTax
      },
      netSalary
    };
  }));
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  return {
    period: { year, month, monthName: monthNames[month - 1], totalWorkingDays },
    employees: payrollData,
    summary: {
      totalEmployees: payrollData.length,
      totalGross: payrollData.reduce((sum, e) => sum + e.grossSalary, 0),
      totalDeductions: payrollData.reduce((sum, e) => sum + e.deductions.pf + e.deductions.profTax, 0),
      totalNet: payrollData.reduce((sum, e) => sum + e.netSalary, 0)
    }
  };
};

// Get leave report
const getLeaveReport = async (year) => {
  const query = `
    SELECT 
      u.id as employee_id,
      u.login_id,
      u.first_name || ' ' || u.last_name as name,
      u.department,
      lb.paid_leave_balance,
      lb.sick_leave_balance,
      lb.paid_leave_used,
      lb.sick_leave_used,
      (SELECT COUNT(*) FROM leave_requests lr 
       WHERE lr.user_id = u.id AND lr.type = 'Unpaid' 
       AND lr.status = 'Approved' AND EXTRACT(YEAR FROM lr.start_date) = $1) as unpaid_used
    FROM users u
    LEFT JOIN leave_balances lb ON u.id = lb.user_id AND lb.year = $1
    WHERE u.role = 'Employee' AND u.is_active = true
    ORDER BY u.department, u.first_name
  `;
  
  const result = await db.query(query, [year]);
  
  return {
    year,
    employees: result.rows.map(emp => ({
      employeeId: emp.employee_id,
      loginId: emp.login_id,
      name: emp.name,
      department: emp.department,
      paidLeave: {
        total: 12,
        used: emp.paid_leave_used || 0,
        balance: emp.paid_leave_balance || 12
      },
      sickLeave: {
        total: 6,
        used: emp.sick_leave_used || 0,
        balance: emp.sick_leave_balance || 6
      },
      unpaidUsed: parseInt(emp.unpaid_used) || 0
    })),
    summary: {
      totalEmployees: result.rows.length,
      totalPaidUsed: result.rows.reduce((sum, e) => sum + (e.paid_leave_used || 0), 0),
      totalSickUsed: result.rows.reduce((sum, e) => sum + (e.sick_leave_used || 0), 0)
    }
  };
};

// Get dashboard analytics
const getDashboardAnalytics = async () => {
  // Total employees
  const empResult = await db.query(`
    SELECT 
      COUNT(*) FILTER (WHERE is_active = true AND role = 'Employee') as active_employees,
      COUNT(*) FILTER (WHERE is_active = false) as inactive_employees,
      COUNT(DISTINCT department) as departments
    FROM users WHERE role = 'Employee'
  `);
  
  // Today's attendance
  const today = new Date().toISOString().split('T')[0];
  const attResult = await db.query(`
    SELECT 
      COUNT(CASE WHEN status = 'Present' THEN 1 END) as present,
      COUNT(CASE WHEN status = 'OnLeave' THEN 1 END) as on_leave
    FROM attendance WHERE date = $1
  `, [today]);
  
  // Pending leaves
  const leaveResult = await db.query(`
    SELECT COUNT(*) as pending FROM leave_requests WHERE status = 'Pending'
  `);
  
  // Monthly payroll total
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const payrollResult = await db.query(`
    SELECT COALESCE(SUM(ss.month_wage), 0) as total_payroll
    FROM salary_structures ss
    INNER JOIN users u ON ss.user_id = u.id
    WHERE ss.is_current = true AND u.is_active = true AND u.role = 'Employee'
  `);
  
  // Department breakdown
  const deptResult = await db.query(`
    SELECT department, COUNT(*) as count
    FROM users
    WHERE role = 'Employee' AND is_active = true AND department IS NOT NULL
    GROUP BY department
    ORDER BY count DESC
    LIMIT 5
  `);
  
  // Recent hires (last 30 days)
  const recentResult = await db.query(`
    SELECT COUNT(*) as recent_hires
    FROM users
    WHERE role = 'Employee' AND created_at >= NOW() - INTERVAL '30 days'
  `);
  
  const activeEmployees = parseInt(empResult.rows[0]?.active_employees) || 0;
  const presentToday = parseInt(attResult.rows[0]?.present) || 0;
  
  return {
    employees: {
      active: activeEmployees,
      inactive: parseInt(empResult.rows[0]?.inactive_employees) || 0,
      departments: parseInt(empResult.rows[0]?.departments) || 0,
      recentHires: parseInt(recentResult.rows[0]?.recent_hires) || 0
    },
    attendance: {
      presentToday,
      onLeaveToday: parseInt(attResult.rows[0]?.on_leave) || 0,
      attendanceRate: activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0
    },
    leaves: {
      pendingRequests: parseInt(leaveResult.rows[0]?.pending) || 0
    },
    payroll: {
      monthlyTotal: parseInt(payrollResult.rows[0]?.total_payroll) || 0
    },
    departmentBreakdown: deptResult.rows.map(d => ({
      name: d.department,
      count: parseInt(d.count)
    }))
  };
};

module.exports = {
  getAttendanceReport,
  getPayrollReport,
  getLeaveReport,
  getDashboardAnalytics
};
