/**
 * Leave Service
 * Business logic for leave request and approval workflow
 */

const { pool } = require('../config/database');

/**
 * Request a new leave
 */
const requestLeave = async (userId, leaveData) => {
  const { leaveType, startDate, endDate, reason } = leaveData;

  // Calculate number of days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Check if user already has leave in this date range
  const existingLeave = await pool.query(
    `SELECT id FROM leave_requests 
     WHERE user_id = $1 
     AND status != 'Rejected'
     AND (
       (start_date <= $2 AND end_date >= $2) OR
       (start_date <= $3 AND end_date >= $3) OR
       (start_date >= $2 AND end_date <= $3)
     )`,
    [userId, startDate, endDate]
  );

  if (existingLeave.rows.length > 0) {
    throw new Error('You already have a leave request for these dates');
  }

  // Check leave balance for Paid and Sick leaves
  if (leaveType !== 'Unpaid') {
    const year = new Date(startDate).getFullYear();
    const balance = await getLeaveBalance(userId, year);

    if (leaveType === 'Paid') {
      const remaining = balance.paidLeaveTotal - balance.paidLeaveUsed;
      if (days > remaining) {
        throw new Error(`Insufficient paid leave balance. Available: ${remaining} days`);
      }
    } else if (leaveType === 'Sick') {
      const remaining = balance.sickLeaveTotal - balance.sickLeaveUsed;
      if (days > remaining) {
        throw new Error(`Insufficient sick leave balance. Available: ${remaining} days`);
      }
    }
  }

  // Create leave request
  const result = await pool.query(
    `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, leaveType, startDate, endDate, reason]
  );

  return result.rows[0];
};

/**
 * Get leave balance for a user
 */
const getLeaveBalance = async (userId, year = new Date().getFullYear()) => {
  // Check if balance record exists for this year
  let balance = await pool.query(
    `SELECT * FROM leave_balances WHERE user_id = $1 AND year = $2`,
    [userId, year]
  );

  // Create balance record if not exists
  if (balance.rows.length === 0) {
    balance = await pool.query(
      `INSERT INTO leave_balances (user_id, year, paid_leave_total, sick_leave_total)
       VALUES ($1, $2, 12, 6)
       RETURNING *`,
      [userId, year]
    );
  }

  const b = balance.rows[0];
  return {
    year: b.year,
    paidLeaveTotal: b.paid_leave_total,
    paidLeaveUsed: b.paid_leave_used,
    paidLeaveRemaining: b.paid_leave_total - b.paid_leave_used,
    sickLeaveTotal: b.sick_leave_total,
    sickLeaveUsed: b.sick_leave_used,
    sickLeaveRemaining: b.sick_leave_total - b.sick_leave_used,
  };
};

/**
 * Get user's leave requests
 */
const getMyLeaves = async (userId, filters = {}) => {
  const { status, year } = filters;
  let query = `
    SELECT lr.*, 
           u.first_name as approver_first_name,
           u.last_name as approver_last_name
    FROM leave_requests lr
    LEFT JOIN users u ON lr.approved_by = u.employee_id
    WHERE lr.user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;

  if (status) {
    query += ` AND lr.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (year) {
    query += ` AND EXTRACT(YEAR FROM lr.start_date) = $${paramIndex}`;
    params.push(year);
    paramIndex++;
  }

  query += ` ORDER BY lr.created_at DESC`;

  const result = await pool.query(query, params);

  return result.rows.map(row => ({
    id: row.id,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    status: row.status,
    rejectionReason: row.rejection_reason,
    approvedBy: row.approved_by ? {
      id: row.approved_by,
      name: `${row.approver_first_name} ${row.approver_last_name}`,
    } : null,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    days: calculateDays(row.start_date, row.end_date),
  }));
};

/**
 * Get all pending leave requests (Admin)
 */
const getPendingRequests = async () => {
  const result = await pool.query(
    `SELECT lr.*, 
            u.first_name, u.last_name, u.login_id, u.department, u.profile_pic_url
     FROM leave_requests lr
     JOIN users u ON lr.user_id = u.employee_id
     WHERE lr.status = 'Pending'
     ORDER BY lr.created_at ASC`
  );

  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    employee: {
      loginId: row.login_id,
      name: `${row.first_name} ${row.last_name}`,
      department: row.department,
      profilePic: row.profile_pic_url,
    },
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    days: calculateDays(row.start_date, row.end_date),
  }));
};

/**
 * Get all leave requests (Admin) with filters
 */
const getAllLeaves = async (filters = {}) => {
  const { status, userId, year, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = `
    SELECT lr.*, 
            u.first_name, u.last_name, u.login_id, u.department,
            a.first_name as approver_first_name, a.last_name as approver_last_name
     FROM leave_requests lr
     JOIN users u ON lr.user_id = u.employee_id
     LEFT JOIN users a ON lr.approved_by = a.employee_id
     WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND lr.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (userId) {
    query += ` AND lr.user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  if (year) {
    query += ` AND EXTRACT(YEAR FROM lr.start_date) = $${paramIndex}`;
    params.push(year);
    paramIndex++;
  }

  // Get total count
  const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) FROM');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  // Add pagination
  query += ` ORDER BY lr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  return {
    leaves: result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      employee: {
        loginId: row.login_id,
        name: `${row.first_name} ${row.last_name}`,
        department: row.department,
      },
      leaveType: row.leave_type,
      startDate: row.start_date,
      endDate: row.end_date,
      reason: row.reason,
      status: row.status,
      rejectionReason: row.rejection_reason,
      approvedBy: row.approved_by ? {
        name: `${row.approver_first_name} ${row.approver_last_name}`,
      } : null,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      days: calculateDays(row.start_date, row.end_date),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Approve a leave request (Admin)
 */
const approveLeave = async (leaveId, adminId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get leave request
    const leaveResult = await client.query(
      `SELECT * FROM leave_requests WHERE id = $1`,
      [leaveId]
    );

    if (leaveResult.rows.length === 0) {
      throw new Error('Leave request not found');
    }

    const leave = leaveResult.rows[0];

    if (leave.status !== 'Pending') {
      throw new Error('Leave request has already been processed');
    }

    const days = calculateDays(leave.start_date, leave.end_date);
    const year = new Date(leave.start_date).getFullYear();

    // Update leave balance if Paid or Sick leave
    if (leave.leave_type !== 'Unpaid') {
      const balanceField = leave.leave_type === 'Paid' ? 'paid_leave_used' : 'sick_leave_used';
      
      await client.query(
        `UPDATE leave_balances 
         SET ${balanceField} = ${balanceField} + $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND year = $3`,
        [days, leave.user_id, year]
      );
    }

    // Update attendance records for leave dates
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      await client.query(
        `INSERT INTO attendance (user_id, date, status, notes)
         VALUES ($1, $2, 'OnLeave', $3)
         ON CONFLICT (user_id, date) 
         DO UPDATE SET status = 'OnLeave', notes = $3, updated_at = CURRENT_TIMESTAMP`,
        [leave.user_id, dateStr, `${leave.leave_type} Leave`]
      );
    }

    // Approve the leave request
    const result = await client.query(
      `UPDATE leave_requests 
       SET status = 'Approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [adminId, leaveId]
    );

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reject a leave request (Admin)
 */
const rejectLeave = async (leaveId, adminId, rejectionReason) => {
  const result = await pool.query(
    `UPDATE leave_requests 
     SET status = 'Rejected', 
         approved_by = $1, 
         approved_at = CURRENT_TIMESTAMP,
         rejection_reason = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND status = 'Pending'
     RETURNING *`,
    [adminId, rejectionReason, leaveId]
  );

  if (result.rows.length === 0) {
    throw new Error('Leave request not found or already processed');
  }

  return result.rows[0];
};

/**
 * Cancel a leave request (by employee, only if pending)
 */
const cancelLeave = async (leaveId, userId) => {
  const result = await pool.query(
    `DELETE FROM leave_requests 
     WHERE id = $1 AND user_id = $2 AND status = 'Pending'
     RETURNING *`,
    [leaveId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Leave request not found or cannot be cancelled');
  }

  return { message: 'Leave request cancelled successfully' };
};

/**
 * Get leave calendar data (for calendar view)
 */
const getLeaveCalendar = async (year, month) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const result = await pool.query(
    `SELECT lr.*, u.first_name, u.last_name, u.department
     FROM leave_requests lr
     JOIN users u ON lr.user_id = u.employee_id
     WHERE lr.status = 'Approved'
     AND (
       (lr.start_date <= $1 AND lr.end_date >= $1) OR
       (lr.start_date <= $2 AND lr.end_date >= $2) OR
       (lr.start_date >= $1 AND lr.end_date <= $2)
     )
     ORDER BY lr.start_date`,
    [startDate, endDate]
  );

  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    employeeName: `${row.first_name} ${row.last_name}`,
    department: row.department,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
  }));
};

/**
 * Get team leave summary (Admin dashboard)
 */
const getTeamLeaveSummary = async () => {
  const today = new Date().toISOString().split('T')[0];

  // Count employees on leave today
  const onLeaveToday = await pool.query(
    `SELECT COUNT(DISTINCT user_id) as count
     FROM leave_requests
     WHERE status = 'Approved'
     AND start_date <= $1 AND end_date >= $1`,
    [today]
  );

  // Count pending requests
  const pendingCount = await pool.query(
    `SELECT COUNT(*) as count FROM leave_requests WHERE status = 'Pending'`
  );

  // This month's approved leaves
  const thisMonth = new Date();
  const startOfMonth = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const endOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0).toISOString().split('T')[0];

  const approvedThisMonth = await pool.query(
    `SELECT COUNT(*) as count FROM leave_requests 
     WHERE status = 'Approved'
     AND approved_at >= $1 AND approved_at <= $2`,
    [startOfMonth, endOfMonth]
  );

  return {
    onLeaveToday: parseInt(onLeaveToday.rows[0].count),
    pendingRequests: parseInt(pendingCount.rows[0].count),
    approvedThisMonth: parseInt(approvedThisMonth.rows[0].count),
  };
};

// Helper function to calculate days between dates
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

module.exports = {
  requestLeave,
  getLeaveBalance,
  getMyLeaves,
  getPendingRequests,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveCalendar,
  getTeamLeaveSummary,
};
