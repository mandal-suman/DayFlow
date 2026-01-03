const { body, param, query } = require('express-validator');

/**
 * Validation rules for user creation
 */
const createUserValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('role')
    .optional()
    .isIn(['Admin', 'Employee']).withMessage('Role must be Admin or Employee'),
  
  body('joiningDate')
    .notEmpty().withMessage('Joining date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department must be max 100 characters'),
  
  body('managerId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid manager ID'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-]{10,20}$/).withMessage('Invalid phone number'),
];

/**
 * Validation rules for login
 */
const loginValidation = [
  body('loginId')
    .trim()
    .notEmpty().withMessage('Login ID is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
];

/**
 * Validation rules for password change
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a digit')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain special character'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Validation rules for profile update
 */
const updateProfileValidation = [
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-]{10,20}$/).withMessage('Invalid phone number'),
  
  body('homeAddress')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be max 500 characters'),
  
  body('emergencyContact')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Emergency contact must be max 100 characters'),
  
  body('emergencyPhone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s-]{10,20}$/).withMessage('Invalid emergency phone number'),
];

/**
 * Validation rules for attendance marking
 */
const markAttendanceValidation = [
  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['checkIn', 'checkOut']).withMessage('Action must be checkIn or checkOut'),
];

/**
 * Validation rules for leave request
 */
const leaveRequestValidation = [
  body('leaveType')
    .notEmpty().withMessage('Leave type is required')
    .isIn(['Paid', 'Sick', 'Unpaid']).withMessage('Invalid leave type'),
  
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must be max 500 characters'),
];

/**
 * Validation rules for salary structure
 */
const salaryStructureValidation = [
  body('monthWage')
    .notEmpty().withMessage('Month wage is required')
    .isFloat({ min: 0 }).withMessage('Month wage must be a positive number'),
  
  body('effectiveFrom')
    .notEmpty().withMessage('Effective date is required')
    .isISO8601().withMessage('Invalid date format'),
];

/**
 * Common param validations
 */
const userIdParam = [
  param('userId')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
];

module.exports = {
  createUserValidation,
  loginValidation,
  changePasswordValidation,
  updateProfileValidation,
  markAttendanceValidation,
  leaveRequestValidation,
  salaryStructureValidation,
  userIdParam,
};
