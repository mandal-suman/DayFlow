/**
 * Standard API Response Helpers
 */

const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors.array ? errors.array() : errors,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  // Aliases for convenience
  success: successResponse,
  error: errorResponse,
};
