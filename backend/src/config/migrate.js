/**
 * Database Migration Script
 * Creates all required tables for Dayflow HRMS
 */

require('dotenv').config();
const { pool } = require('./database');

const migrations = `
-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'OnLeave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('Paid', 'Sick', 'Unpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('Pending', 'Approved', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    employee_id SERIAL PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Employee',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    work_email VARCHAR(255),
    phone VARCHAR(20),
    joining_date DATE NOT NULL,
    profile_pic_url VARCHAR(500),
    department VARCHAR(100),
    manager_id INTEGER REFERENCES users(employee_id),
    is_first_login BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Private Info
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    bank_ifsc VARCHAR(20),
    nationality VARCHAR(50),
    home_address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salary Structure Table
CREATE TABLE IF NOT EXISTS salary_structures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(employee_id) ON DELETE CASCADE,
    month_wage DECIMAL(12, 2) NOT NULL,
    yearly_wage DECIMAL(14, 2),
    basic_salary DECIMAL(12, 2),
    hra DECIMAL(12, 2),
    standard_allowance DECIMAL(12, 2) DEFAULT 4167.00,
    performance_bonus DECIMAL(12, 2),
    lta DECIMAL(12, 2),
    fixed_allowance DECIMAL(12, 2),
    pf_deduction DECIMAL(12, 2),
    professional_tax DECIMAL(12, 2) DEFAULT 200.00,
    effective_from DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, effective_from)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(employee_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status attendance_status DEFAULT 'Absent',
    total_hours DECIMAL(4, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(employee_id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'Pending',
    approved_by INTEGER REFERENCES users(employee_id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Balance Table (Annual allocation)
CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(employee_id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    paid_leave_total INTEGER DEFAULT 12,
    paid_leave_used INTEGER DEFAULT 0,
    sick_leave_total INTEGER DEFAULT 6,
    sick_leave_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year)
);

-- Login ID Counter Table (for serial number generation)
CREATE TABLE IF NOT EXISTS login_id_counters (
    id SERIAL PRIMARY KEY,
    prefix VARCHAR(20) UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    counter INTEGER DEFAULT 0,
    UNIQUE(prefix, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salary_structures_updated_at ON salary_structures;
CREATE TRIGGER update_salary_structures_updated_at BEFORE UPDATE ON salary_structures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    await pool.query(migrations);
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
