const db = require('../config/database');

class AttendanceService {
  /**
   * Mark attendance (Check In / Check Out)
   */
  async markAttendance(userId, action) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Check if there's an approved leave for today
    const leaveCheck = await db.query(
      `SELECT id FROM leave_requests 
       WHERE user_id = $1 
       AND status = 'Approved' 
       AND $2 BETWEEN start_date AND end_date`,
      [userId, today]
    );

    if (leaveCheck.rows.length > 0) {
      throw new Error('Cannot mark attendance while on approved leave');
    }

    // Get existing attendance record for today
    const existing = await db.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND date = $2`,
      [userId, today]
    );

    if (action === 'checkIn') {
      if (existing.rows.length > 0 && existing.rows[0].check_in_time) {
        throw new Error('Already checked in today');
      }

      if (existing.rows.length === 0) {
        // Create new attendance record
        const result = await db.query(
          `INSERT INTO attendance (user_id, date, check_in_time, status)
           VALUES ($1, $2, $3, 'Present')
           RETURNING *`,
          [userId, today, now]
        );
        return result.rows[0];
      } else {
        // Update existing record (edge case)
        const result = await db.query(
          `UPDATE attendance 
           SET check_in_time = $1, status = 'Present'
           WHERE user_id = $2 AND date = $3
           RETURNING *`,
          [now, userId, today]
        );
        return result.rows[0];
      }
    } else if (action === 'checkOut') {
      if (existing.rows.length === 0 || !existing.rows[0].check_in_time) {
        throw new Error('Must check in before checking out');
      }

      if (existing.rows[0].check_out_time) {
        throw new Error('Already checked out today');
      }

      // Calculate total hours
      const checkInTime = new Date(existing.rows[0].check_in_time);
      const totalHours = ((now - checkInTime) / (1000 * 60 * 60)).toFixed(2);

      const result = await db.query(
        `UPDATE attendance 
         SET check_out_time = $1, total_hours = $2
         WHERE user_id = $3 AND date = $4
         RETURNING *`,
        [now, totalHours, userId, today]
      );
      return result.rows[0];
    }

    throw new Error('Invalid action');
  }

  /**
   * Get today's attendance status for a user
   */
  async getTodayStatus(userId) {
    const today = new Date().toISOString().split('T')[0];

    // Check for approved leave
    const leaveCheck = await db.query(
      `SELECT lr.*, lt.leave_type as type FROM leave_requests lr
       LEFT JOIN LATERAL (SELECT leave_type) lt ON true
       WHERE lr.user_id = $1 
       AND lr.status = 'Approved' 
       AND $2 BETWEEN lr.start_date AND lr.end_date`,
      [userId, today]
    );

    if (leaveCheck.rows.length > 0) {
      return {
        status: 'OnLeave',
        leaveType: leaveCheck.rows[0].leave_type,
        checkInTime: null,
        checkOutTime: null,
        totalHours: null,
      };
    }

    // Check attendance record
    const attendance = await db.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND date = $2`,
      [userId, today]
    );

    if (attendance.rows.length === 0) {
      return {
        status: 'Absent',
        checkInTime: null,
        checkOutTime: null,
        totalHours: null,
      };
    }

    const record = attendance.rows[0];
    return {
      status: record.status,
      checkInTime: record.check_in_time,
      checkOutTime: record.check_out_time,
      totalHours: record.total_hours,
    };
  }

  /**
   * Get attendance history for a user
   */
  async getAttendanceHistory(userId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const result = await db.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date DESC`,
      [userId, startDate, endDate]
    );

    return result.rows;
  }

  /**
   * Get all attendance for a date (Admin)
   */
  async getAllAttendanceByDate(date) {
    const result = await db.query(
      `SELECT a.*, u.first_name, u.last_name, u.login_id, u.department
       FROM attendance a
       JOIN users u ON a.user_id = u.employee_id
       WHERE a.date = $1
       ORDER BY a.check_in_time ASC`,
      [date]
    );

    return result.rows;
  }

  /**
   * Get attendance summary for a user (for payroll)
   */
  async getAttendanceSummary(userId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Get working days (excluding weekends)
    let workingDays = 0;
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month - 1, d);
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
    }

    // Get present days
    const presentDays = await db.query(
      `SELECT COUNT(*) as count FROM attendance 
       WHERE user_id = $1 AND date BETWEEN $2 AND $3 AND status = 'Present'`,
      [userId, startDate, endDate]
    );

    // Get leave days
    const leaveDays = await db.query(
      `SELECT 
         SUM(CASE WHEN leave_type = 'Paid' THEN 
           LEAST(end_date, $3::date) - GREATEST(start_date, $2::date) + 1 
         ELSE 0 END) as paid_leave,
         SUM(CASE WHEN leave_type = 'Unpaid' THEN 
           LEAST(end_date, $3::date) - GREATEST(start_date, $2::date) + 1 
         ELSE 0 END) as unpaid_leave,
         SUM(CASE WHEN leave_type = 'Sick' THEN 
           LEAST(end_date, $3::date) - GREATEST(start_date, $2::date) + 1 
         ELSE 0 END) as sick_leave
       FROM leave_requests 
       WHERE user_id = $1 AND status = 'Approved'
       AND start_date <= $3 AND end_date >= $2`,
      [userId, startDate, endDate]
    );

    const present = parseInt(presentDays.rows[0].count) || 0;
    const paidLeave = parseInt(leaveDays.rows[0]?.paid_leave) || 0;
    const unpaidLeave = parseInt(leaveDays.rows[0]?.unpaid_leave) || 0;
    const sickLeave = parseInt(leaveDays.rows[0]?.sick_leave) || 0;

    // Payable days = Present + Paid Leave + Sick Leave (not unpaid)
    const payableDays = present + paidLeave + sickLeave;
    const absentDays = workingDays - present - paidLeave - unpaidLeave - sickLeave;

    return {
      month,
      year,
      workingDays,
      presentDays: present,
      paidLeaveDays: paidLeave,
      sickLeaveDays: sickLeave,
      unpaidLeaveDays: unpaidLeave,
      absentDays: Math.max(0, absentDays),
      payableDays,
    };
  }

  /**
   * Get team attendance overview (Admin)
   */
  async getTeamOverview(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get all active users count
    const totalUsers = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE is_active = true`
    );

    // Get present count
    const presentCount = await db.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM attendance 
       WHERE date = $1 AND status = 'Present'`,
      [targetDate]
    );

    // Get on leave count
    const onLeaveCount = await db.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM leave_requests 
       WHERE status = 'Approved' AND $1 BETWEEN start_date AND end_date`,
      [targetDate]
    );

    const total = parseInt(totalUsers.rows[0].count) || 0;
    const present = parseInt(presentCount.rows[0].count) || 0;
    const onLeave = parseInt(onLeaveCount.rows[0].count) || 0;
    const absent = total - present - onLeave;

    return {
      date: targetDate,
      totalEmployees: total,
      present,
      onLeave,
      absent: Math.max(0, absent),
    };
  }
}

module.exports = new AttendanceService();
