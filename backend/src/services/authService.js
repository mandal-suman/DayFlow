const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config');
const { generateLoginId, generateTemporaryPassword } = require('../utils/loginIdGenerator');

class AuthService {
  /**
   * Create a new user (Admin only)
   */
  async createUser(userData) {
    const {
      firstName,
      lastName,
      email,
      role = 'Employee',
      joiningDate,
      department,
      managerId,
      phone,
      workEmail,
    } = userData;

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT employee_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Generate unique login ID
    const loginId = await generateLoginId(firstName, lastName, joiningDate);

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Insert new user
    const result = await db.query(
      `INSERT INTO users (
        login_id, password_hash, role, first_name, last_name, 
        email, work_email, phone, joining_date, department, 
        manager_id, is_first_login
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING employee_id, login_id, role, first_name, last_name, email, joining_date`,
      [
        loginId, passwordHash, role, firstName, lastName,
        email, workEmail || email, phone, joiningDate, department,
        managerId,
      ]
    );

    const newUser = result.rows[0];

    // Initialize leave balance for the current year
    const currentYear = new Date().getFullYear();
    await db.query(
      `INSERT INTO leave_balances (user_id, year) VALUES ($1, $2)
       ON CONFLICT (user_id, year) DO NOTHING`,
      [newUser.employee_id, currentYear]
    );

    return {
      user: newUser,
      temporaryPassword: tempPassword, // Return to admin for sharing with employee
    };
  }

  /**
   * Authenticate user login
   */
  async login(loginId, password) {
    // Find user by login ID
    const result = await db.query(
      `SELECT employee_id, login_id, password_hash, role, first_name, 
              last_name, email, is_first_login, is_active
       FROM users WHERE login_id = $1`,
      [loginId.toUpperCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid login credentials');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated. Contact administrator.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid login credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        employeeId: user.employee_id,
        loginId: user.login_id,
        role: user.role,
        isFirstLogin: user.is_first_login,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: {
        employeeId: user.employee_id,
        loginId: user.login_id,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        isFirstLogin: user.is_first_login,
      },
    };
  }

  /**
   * Change user password
   */
  async changePassword(employeeId, currentPassword, newPassword) {
    // Get current password hash
    const result = await db.query(
      'SELECT password_hash, is_first_login FROM users WHERE employee_id = $1',
      [employeeId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password and mark first login as complete
    await db.query(
      `UPDATE users SET password_hash = $1, is_first_login = false 
       WHERE employee_id = $2`,
      [newPasswordHash, employeeId]
    );

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Get user by ID
   */
  async getUserById(employeeId) {
    const result = await db.query(
      `SELECT employee_id, login_id, role, first_name, last_name, email,
              work_email, phone, joining_date, profile_pic_url, department,
              manager_id, is_active, created_at
       FROM users WHERE employee_id = $1`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Reset user password (Admin only)
   */
  async resetPassword(employeeId) {
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await db.query(
      `UPDATE users SET password_hash = $1, is_first_login = true 
       WHERE employee_id = $2`,
      [passwordHash, employeeId]
    );

    return { temporaryPassword: tempPassword };
  }
}

module.exports = new AuthService();
