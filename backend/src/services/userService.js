const db = require('../config/database');

class UserService {
  /**
   * Get all users (Admin only)
   */
  async getAllUsers(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.role) {
      whereClause += ` AND role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.department) {
      whereClause += ` AND department = $${paramIndex}`;
      params.push(filters.department);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        login_id ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get users
    params.push(limit, offset);
    const result = await db.query(
      `SELECT 
        u.employee_id, u.login_id, u.role, u.first_name, u.last_name, 
        u.email, u.work_email, u.phone, u.joining_date, u.profile_pic_url, 
        u.department, u.manager_id, u.is_active, u.created_at,
        m.first_name || ' ' || m.last_name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.employee_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get user profile (full details)
   */
  async getUserProfile(employeeId, requestingUser) {
    const result = await db.query(
      `SELECT 
        u.employee_id, u.login_id, u.role, u.first_name, u.last_name, 
        u.email, u.work_email, u.phone, u.joining_date, u.profile_pic_url, 
        u.department, u.manager_id, u.is_active, u.created_at,
        u.bank_account_number, u.bank_name, u.bank_ifsc, u.nationality,
        u.home_address, u.emergency_contact, u.emergency_phone,
        m.first_name || ' ' || m.last_name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.employee_id
      WHERE u.employee_id = $1`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // If employee is viewing someone else's profile, hide private info
    if (requestingUser.role !== 'Admin' && requestingUser.employeeId !== employeeId) {
      // Return only public info
      return {
        employee_id: user.employee_id,
        first_name: user.first_name,
        last_name: user.last_name,
        work_email: user.work_email,
        department: user.department,
        manager_name: user.manager_name,
        profile_pic_url: user.profile_pic_url,
      };
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(employeeId, updateData, requestingUser) {
    const isAdmin = requestingUser.role === 'Admin';
    const isSelf = requestingUser.employeeId === employeeId;

    if (!isAdmin && !isSelf) {
      throw new Error('Not authorized to update this profile');
    }

    // Fields that employees can update themselves
    const employeeEditableFields = [
      'phone', 'home_address', 'emergency_contact', 'emergency_phone', 'profile_pic_url'
    ];

    // Fields that only admins can update
    const adminOnlyFields = [
      'role', 'department', 'manager_id', 'work_email', 'is_active',
      'bank_account_number', 'bank_name', 'bank_ifsc', 'nationality'
    ];

    let updates = [];
    let values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case

      if (isAdmin || employeeEditableFields.includes(dbField)) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(employeeId);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} 
       WHERE employee_id = $${paramIndex}
       RETURNING employee_id, login_id, first_name, last_name, email`,
      values
    );

    return result.rows[0];
  }

  /**
   * Get departments list
   */
  async getDepartments() {
    const result = await db.query(
      `SELECT DISTINCT department FROM users 
       WHERE department IS NOT NULL 
       ORDER BY department`
    );
    return result.rows.map(r => r.department);
  }

  /**
   * Get managers list (for dropdown)
   */
  async getManagers() {
    const result = await db.query(
      `SELECT employee_id, first_name, last_name, department
       FROM users 
       WHERE role = 'Admin' OR employee_id IN (
         SELECT DISTINCT manager_id FROM users WHERE manager_id IS NOT NULL
       )
       ORDER BY first_name, last_name`
    );
    return result.rows;
  }

  /**
   * Deactivate user (Admin only)
   */
  async deactivateUser(employeeId) {
    const result = await db.query(
      `UPDATE users SET is_active = false WHERE employee_id = $1
       RETURNING employee_id, login_id, is_active`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Activate user (Admin only)
   */
  async activateUser(employeeId) {
    const result = await db.query(
      `UPDATE users SET is_active = true WHERE employee_id = $1
       RETURNING employee_id, login_id, is_active`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}

module.exports = new UserService();
