const db = require('../config/database');

/**
 * Generate unique Login ID following the format:
 * OI + [First 2 letters of First Name] + [First 2 letters of Last Name] + [Year] + [Serial]
 * Example: John Doe joined 2022 -> OIJODO20220001
 * 
 * @param {string} firstName - Employee's first name
 * @param {string} lastName - Employee's last name
 * @param {Date} joiningDate - Employee's joining date
 * @returns {Promise<string>} Generated Login ID
 */
async function generateLoginId(firstName, lastName, joiningDate) {
  // Extract first 2 letters of first name and last name (uppercase)
  const firstNamePart = firstName.substring(0, 2).toUpperCase();
  const lastNamePart = lastName.substring(0, 2).toUpperCase();
  
  // Get year from joining date
  const year = new Date(joiningDate).getFullYear();
  
  // Create prefix: OI + name parts + year
  const prefix = `OI${firstNamePart}${lastNamePart}${year}`;
  
  // Get or create counter for this prefix
  const counterResult = await db.query(
    `INSERT INTO login_id_counters (prefix, year, counter)
     VALUES ($1, $2, 1)
     ON CONFLICT (prefix, year)
     DO UPDATE SET counter = login_id_counters.counter + 1
     RETURNING counter`,
    [prefix, year]
  );
  
  const counter = counterResult.rows[0].counter;
  
  // Format serial number with leading zeros (4 digits)
  const serial = counter.toString().padStart(4, '0');
  
  return `${prefix}${serial}`;
}

/**
 * Generate a random secure password
 * Format: 2 uppercase + 4 lowercase + 2 digits + 2 special chars
 * 
 * @returns {string} Generated password
 */
function generateTemporaryPassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%&*';
  
  let password = '';
  
  // 2 uppercase
  for (let i = 0; i < 2; i++) {
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  }
  
  // 4 lowercase
  for (let i = 0; i < 4; i++) {
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  }
  
  // 2 digits
  for (let i = 0; i < 2; i++) {
    password += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  // 2 special characters
  for (let i = 0; i < 2; i++) {
    password += special.charAt(Math.floor(Math.random() * special.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special
 * 
 * @param {string} password 
 * @returns {object} { isValid, errors }
 */
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  generateLoginId,
  generateTemporaryPassword,
  validatePassword,
};
