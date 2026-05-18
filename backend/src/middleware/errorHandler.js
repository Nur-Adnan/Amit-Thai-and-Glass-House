import { MoneyValidator, DateValidator } from '../utils/validation.js';

const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format. Please provide a valid ID.';
    error = { message, statusCode: 400, type: 'ValidationError' };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate entry detected.';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    // Provide specific messages for common fields
    switch (field) {
      case 'email':
        message = `Email address '${value}' is already registered. Please use a different email.`;
        break;
      case 'invoiceNo':
        message = `Invoice number '${value}' already exists. Please try again.`;
        break;
      case 'employeeId':
        message = `Employee ID '${value}' already exists. Please use a different ID.`;
        break;
      case 'customerId':
        message = `Customer ID '${value}' already exists. Please use a different ID.`;
        break;
      case 'name':
        message = `A record with name '${value}' already exists. Please use a different name.`;
        break;
      default:
        message = `The ${field} '${value}' is already in use. Please choose a different value.`;
    }
    
    error = { message, statusCode: 400, type: 'DuplicateError' };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = [];
    
    Object.values(err.errors).forEach(val => {
      let errorMessage = val.message;
      
      // Improve specific validation messages
      if (val.kind === 'required') {
        errorMessage = `${val.path} is required and cannot be empty.`;
      } else if (val.kind === 'min') {
        if (val.path.includes('Price') || val.path.includes('Amount') || val.path.includes('Salary')) {
          errorMessage = `${val.path} must be at least ${MoneyValidator.formatCurrency(val.properties.min)}.`;
        } else {
          errorMessage = `${val.path} must be at least ${val.properties.min}.`;
        }
      } else if (val.kind === 'max') {
        if (val.path.includes('Price') || val.path.includes('Amount') || val.path.includes('Salary')) {
          errorMessage = `${val.path} cannot exceed ${MoneyValidator.formatCurrency(val.properties.max)}.`;
        } else {
          errorMessage = `${val.path} cannot exceed ${val.properties.max}.`;
        }
      } else if (val.kind === 'enum') {
        errorMessage = `${val.path} must be one of: ${val.properties.enumValues.join(', ')}.`;
      } else if (val.kind === 'maxlength') {
        errorMessage = `${val.path} cannot exceed ${val.properties.maxlength} characters.`;
      } else if (val.kind === 'minlength') {
        errorMessage = `${val.path} must be at least ${val.properties.minlength} characters long.`;
      }
      
      errors.push(errorMessage);
    });
    
    const message = errors.length === 1 
      ? errors[0] 
      : `Please fix the following errors: ${errors.join('; ')}`;
    
    error = { message, statusCode: 400, type: 'ValidationError', errors };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token. Please log in again.';
    error = { message, statusCode: 401, type: 'AuthenticationError' };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your session has expired. Please log in again.';
    error = { message, statusCode: 401, type: 'AuthenticationError' };
  }

  // Permission errors
  if (err.statusCode === 403) {
    const message = err.message || 'You do not have permission to perform this action.';
    error = { message, statusCode: 403, type: 'PermissionError' };
  }

  // Business logic errors
  if (err.message && err.message.includes('insufficient stock')) {
    error = { 
      message: err.message, 
      statusCode: 400, 
      type: 'BusinessLogicError',
      category: 'inventory'
    };
  }

  if (err.message && err.message.includes('payment')) {
    error = { 
      message: err.message, 
      statusCode: 400, 
      type: 'BusinessLogicError',
      category: 'payment'
    };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    const message = 'Database connection error. Please try again in a moment.';
    error = { message, statusCode: 503, type: 'DatabaseError' };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large. Please upload a smaller file.';
    error = { message, statusCode: 400, type: 'FileUploadError' };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file upload. Please check the file type and try again.';
    error = { message, statusCode: 400, type: 'FileUploadError' };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = 'Too many requests. Please wait a moment before trying again.';
    error = { message, statusCode: 429, type: 'RateLimitError' };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'An unexpected error occurred. Please try again.';
  const type = error.type || 'ServerError';

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      type,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: error
      }),
      ...(error.errors && { validationErrors: error.errors }),
      ...(error.category && { category: error.category }),
      timestamp: DateValidator.formatDate(new Date(), { format: 'iso' }),
      requestId: req.id || req.headers['x-request-id'] || 'unknown'
    }
  };

  // Add helpful suggestions for common errors
  if (statusCode === 400) {
    errorResponse.error.suggestion = 'Please check your input data and try again.';
  } else if (statusCode === 401) {
    errorResponse.error.suggestion = 'Please log in and try again.';
  } else if (statusCode === 403) {
    errorResponse.error.suggestion = 'Contact your administrator if you believe you should have access.';
  } else if (statusCode === 404) {
    errorResponse.error.suggestion = 'Please check the URL or resource ID and try again.';
  } else if (statusCode === 500) {
    errorResponse.error.suggestion = 'This is a server error. Please try again later or contact support.';
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;