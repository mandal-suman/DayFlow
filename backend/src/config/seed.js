/**
 * Database Seed Script
 * Creates initial Admin user for the system
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./database');
const config = require('./index');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if admin exists
    const existingAdmin = await pool.query(
      "SELECT employee_id FROM users WHERE role = 'Admin' LIMIT 1"
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists. Skipping seed.');
      return;
    }

    // Create initial admin user
    const adminPassword = config.defaultAdminPassword;
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const joiningDate = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();

    // Generate admin login ID
    const loginId = `OIADAD${year}0001`;

    // Insert counter for admin prefix
    await pool.query(
      `INSERT INTO login_id_counters (prefix, year, counter)
       VALUES ($1, $2, 1)
       ON CONFLICT (prefix, year) DO NOTHING`,
      [`OIADAD${year}`, year]
    );

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (
        login_id, password_hash, role, first_name, last_name, 
        email, work_email, joining_date, department, is_first_login
      ) VALUES ($1, $2, 'Admin', 'Admin', 'Admin', $3, $3, $4, 'HR', false)
      RETURNING employee_id, login_id`,
      [loginId, passwordHash, 'admin@dayflow.com', joiningDate]
    );

    // Initialize leave balance
    await pool.query(
      `INSERT INTO leave_balances (user_id, year) VALUES ($1, $2)`,
      [result.rows[0].employee_id, year]
    );

    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║           ✅ Initial Admin User Created                ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Login ID:  ${loginId.padEnd(40)}  ║`);
    console.log(`║  Password:  ${adminPassword.padEnd(40)}  ║`);
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  ⚠️  IMPORTANT: Change this password after first login! ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
