import config from '../config/env.js';
import logger from '../utils/logger.js';
import { ErrorLogger } from '../utils/errorLogger.js';
import { ErrorResponse } from '../utils/errorResponse.js';

/**
 * Enhanced Error Handler Middleware
 * Provides comprehensive error handling with logging and user-friendly messages
 */
class EnhancedErrorHandler {
  constructor() {
    this.errorLogger = new ErrorLogger();
  }

  /**
   * Main error handling middleware
   */
  handle = (err, req, res, _next) => {
    try {
      // Generate unique error ID for tracking
      const errorId = this.generateErrorId();
      
      // Parse and classify the error
      const errorInfo = this.parseError(err, req, errorId);
      
      // Log the error with full context
      this.logError(errorInfo, req, err);
      
      // Create user-friendly response
      const response = this.createErrorResponse(errorInfo, req);
      
      // Send response
      res.status(errorInfo.statusCode).json(response);
      
    } catch (handlerError) {
      // If error handler itself fails, use fallback
      this.handleFallback(handlerError, req, res, err);
    }
  };

  /**
   * Parse and classify error
   */
  parseError(err, req, errorId) {
    const baseInfo = {
      id: errorId,
      timestamp: new Date().toISOString(),
      originalError: err,
      statusCode: err.statusCode || 500,
      type: 'ServerError',
      category: 'general',
      severity: 'error',
      userMessage: 'An unexpected error occurred',
      developerMessage: err.message || 'Unknown error',
      suggestion: null,
      retryable: false,
      context: {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
        requestId: req.id
      }
    };

    // Mongoose Errors
    if (err.name === 'CastError') {
      return {
        ...baseInfo,
        statusCode: 400,
        type: 'ValidationError',
        category: 'validation',
        severity: 'warning',
        userMessage: 'Invalid ID format provided',
        developerMessage: `Invalid ObjectId: ${err.value}`,
        suggestion: 'Please provide a valid ID',
        retryable: true
      };
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return {
        ...baseInfo,
        statusCode: 409,
        type: 'DuplicateError',
        category: 'validation',
        severity: 'warning',
        userMessage: this.getDuplicateMessage(field, value),
        developerMessage: `Duplicate key error: ${field} = ${value}`,
        suggestion: `Please use a different ${field}`,
        retryable: true,
        field,
        value
      };
    }

    if (err.name === 'ValidationError') {
      const validationErrors = this.parseValidationErrors(err.errors);
      return {
        ...baseInfo,
        statusCode: 400,
        type: 'ValidationError',
        category: 'validation',
        severity: 'warning',
        userMessage: 'Please fix the validation errors',
        developerMessage: `Validation failed: ${validationErrors.length} errors`,
        suggestion: 'Check the required fields and try again',
        retryable: true,
        validationErrors
      };
    }

    // Authentication Errors
    if (err.name === 'JsonWebTokenError') {
      return {
        ...baseInfo,
        statusCode: 401,
        type: 'AuthenticationError',
        category: 'auth',
        severity: 'warning',
        userMessage: 'Invalid authentication token',
        developerMessage: 'JWT verification failed',
        suggestion: 'Please log in again',
        retryable: false
      };
    }

    if (err.name === 'TokenExpiredError') {
      return {
        ...baseInfo,
        statusCode: 401,
        type: 'AuthenticationError',
        category: 'auth',
        severity: 'info',
        userMessage: 'Your session has expired',
        developerMessage: 'JWT token expired',
        suggestion: 'Please log in again',
        retryable: false
      };
    }

    // Authorization Errors
    if (err.statusCode === 403) {
      return {
        ...baseInfo,
        statusCode: 403,
        type: 'AuthorizationError',
        category: 'auth',
        severity: 'warning',
        userMessage: 'Access denied',
        developerMessage: err.message || 'Insufficient permissions',
        suggestion: 'Contact your administrator for access',
        retryable: false
      };
    }

    // Business Logic Errors
    if (this.isBusinessLogicError(err)) {
      return {
        ...baseInfo,
        statusCode: 400,
        type: 'BusinessLogicError',
        category: this.getBusinessErrorCategory(err),
        severity: 'warning',
        userMessage: err.message,
        developerMessage: err.message,
        suggestion: this.getBusinessErrorSuggestion(err),
        retryable: true
      };
    }

    // Database Errors
    if (this.isDatabaseError(err)) {
      return {
        ...baseInfo,
        statusCode: 503,
        type: 'DatabaseError',
        category: 'database',
        severity: 'error',
        userMessage: 'Database temporarily unavailable',
        developerMessage: `Database error: ${err.message}`,
        suggestion: 'Please try again in a moment',
        retryable: true
      };
    }

    // Network/External Service Errors
    if (this.isNetworkError(err)) {
      return {
        ...baseInfo,
        statusCode: 503,
        type: 'NetworkError',
        category: 'network',
        severity: 'error',
        userMessage: 'External service unavailable',
        developerMessage: `Network error: ${err.message}`,
        suggestion: 'Please try again later',
        retryable: true
      };
    }

    // File Upload Errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return {
        ...baseInfo,
        statusCode: 413,
        type: 'FileUploadError',
        category: 'upload',
        severity: 'warning',
        userMessage: 'File size too large',
        developerMessage: `File exceeds size limit: ${err.limit}`,
        suggestion: 'Please upload a smaller file',
        retryable: true
      };
    }

    // Rate Limiting Errors
    if (err.statusCode === 429) {
      return {
        ...baseInfo,
        statusCode: 429,
        type: 'RateLimitError',
        category: 'rateLimit',
        severity: 'warning',
        userMessage: 'Too many requests',
        developerMessage: 'Rate limit exceeded',
        suggestion: 'Please wait before trying again',
        retryable: true
      };
    }

    // Default Server Error
    return {
      ...baseInfo,
      statusCode: 500,
      type: 'ServerError',
      category: 'server',
      severity: 'error',
      userMessage: 'Internal server error',
      developerMessage: err.message || 'Unknown server error',
      suggestion: 'Please try again later or contact support',
      retryable: false
    };
  }

  /**
   * Log error with appropriate level and context
   */
  logError(errorInfo, req, originalError) {
    const logData = {
      errorId: errorInfo.id,
      type: errorInfo.type,
      category: errorInfo.category,
      statusCode: errorInfo.statusCode,
      message: errorInfo.developerMessage,
      context: errorInfo.context,
      stack: originalError.stack,
      timestamp: errorInfo.timestamp
    };

    // Log based on severity
    switch (errorInfo.severity) {
      case 'error':
        logger.error(`[${errorInfo.id}] ${errorInfo.type}: ${errorInfo.developerMessage}`, logData);
        break;
      case 'warning':
        logger.warn(`[${errorInfo.id}] ${errorInfo.type}: ${errorInfo.developerMessage}`, logData);
        break;
      case 'info':
        logger.info(`[${errorInfo.id}] ${errorInfo.type}: ${errorInfo.developerMessage}`, logData);
        break;
      default:
        logger.error(`[${errorInfo.id}] ${errorInfo.type}: ${errorInfo.developerMessage}`, logData);
    }

    // Log to error tracking system
    this.errorLogger.logError(errorInfo, req, originalError);
  }

  /**
   * Create user-friendly error response
   */
  createErrorResponse(errorInfo, _req) {
    const response = new ErrorResponse({
      success: false,
      error: {
        id: errorInfo.id,
        type: errorInfo.type,
        message: errorInfo.userMessage,
        timestamp: errorInfo.timestamp,
        ...(errorInfo.suggestion && { suggestion: errorInfo.suggestion }),
        ...(errorInfo.validationErrors && { validationErrors: errorInfo.validationErrors }),
        ...(errorInfo.retryable && { retryable: errorInfo.retryable })
      }
    });

    // Add development-only information
    if (config.isDevelopment) {
      response.error.developerMessage = errorInfo.developerMessage;
      response.error.stack = errorInfo.originalError.stack;
      response.error.context = errorInfo.context;
    }

    return response.toJSON();
  }

  /**
   * Fallback error handler if main handler fails
   */
  handleFallback(handlerError, _req, res, originalError) {
    const errorId = this.generateErrorId();
    
    logger.error(`Error handler failed: ${handlerError.message}`, {
      errorId,
      originalError: originalError.message,
      handlerError: handlerError.message,
      stack: handlerError.stack
    });

    // Send minimal safe response
    res.status(500).json({
      success: false,
      error: {
        id: errorId,
        type: 'ServerError',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Helper methods
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getDuplicateMessage(field, value) {
    const messages = {
      email: `Email address '${value}' is already registered`,
      invoiceNo: `Invoice number '${value}' already exists`,
      employeeId: `Employee ID '${value}' already exists`,
      customerId: `Customer ID '${value}' already exists`,
      name: `Name '${value}' is already in use`
    };
    return messages[field] || `The ${field} '${value}' is already in use`;
  }

  parseValidationErrors(errors) {
    return Object.values(errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value,
      kind: err.kind
    }));
  }

  isBusinessLogicError(err) {
    const businessKeywords = [
      'insufficient stock', 'payment', 'credit limit', 'inventory',
      'calculation', 'business rule', 'workflow'
    ];
    return businessKeywords.some(keyword => 
      err.message && err.message.toLowerCase().includes(keyword)
    );
  }

  getBusinessErrorCategory(err) {
    if (err.message.includes('stock') || err.message.includes('inventory')) return 'inventory';
    if (err.message.includes('payment') || err.message.includes('credit')) return 'payment';
    if (err.message.includes('calculation')) return 'calculation';
    return 'business';
  }

  getBusinessErrorSuggestion(err) {
    if (err.message.includes('insufficient stock')) return 'Check inventory levels';
    if (err.message.includes('credit limit')) return 'Review customer credit settings';
    if (err.message.includes('payment')) return 'Verify payment information';
    return 'Review the business rules and try again';
  }

  isDatabaseError(err) {
    const dbErrors = [
      'MongoNetworkError', 'MongoTimeoutError', 'MongoServerError',
      'MongoWriteConcernError', 'MongoError'
    ];
    return dbErrors.includes(err.name) || 
           (err.message && err.message.includes('database'));
  }

  isNetworkError(err) {
    const networkErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
    return networkErrors.some(code => err.code === code) ||
           (err.message && err.message.includes('network'));
  }
}

// Export singleton instance
export default new EnhancedErrorHandler();