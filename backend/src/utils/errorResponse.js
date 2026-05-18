/**
 * Standardized Error Response Utility
 * Creates consistent error response format across the application
 */
export class ErrorResponse {
  constructor(options = {}) {
    this.success = options.success || false;
    this.error = options.error || {};
    this.meta = options.meta || {};
  }

  /**
   * Create error response with standard format
   */
  static create(options) {
    return new ErrorResponse(options);
  }

  /**
   * Create validation error response
   */
  static validation(message, validationErrors = [], suggestion = null) {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'ValidationError',
        message: message || 'Validation failed',
        validationErrors,
        suggestion: suggestion || 'Please fix the validation errors and try again',
        retryable: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create authentication error response
   */
  static authentication(message = 'Authentication failed', suggestion = 'Please log in again') {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'AuthenticationError',
        message,
        suggestion,
        retryable: false,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create authorization error response
   */
  static authorization(message = 'Access denied', suggestion = 'Contact your administrator for access') {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'AuthorizationError',
        message,
        suggestion,
        retryable: false,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create not found error response
   */
  static notFound(resource = 'Resource', suggestion = 'Please check the ID and try again') {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'NotFoundError',
        message: `${resource} not found`,
        suggestion,
        retryable: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create duplicate error response
   */
  static duplicate(field, value, suggestion = null) {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'DuplicateError',
        message: `The ${field} '${value}' is already in use`,
        suggestion: suggestion || `Please use a different ${field}`,
        field,
        value,
        retryable: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create business logic error response
   */
  static businessLogic(message, category = 'business', suggestion = null) {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'BusinessLogicError',
        message,
        category,
        suggestion: suggestion || 'Please review the business rules and try again',
        retryable: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create server error response
   */
  static serverError(message = 'Internal server error', suggestion = 'Please try again later or contact support') {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'ServerError',
        message,
        suggestion,
        retryable: false,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create database error response
   */
  static database(message = 'Database temporarily unavailable', suggestion = 'Please try again in a moment') {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'DatabaseError',
        message,
        suggestion,
        retryable: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create network error response
   */
  static network(message = 'External service unavailable', suggestion = 'Please try again later') {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'NetworkError',
        message,
        suggestion,
        retryable: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create rate limit error response
   */
  static rateLimit(message = 'Too many requests', suggestion = 'Please wait before trying again') {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'RateLimitError',
        message,
        suggestion,
        retryable: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Create file upload error response
   */
  static fileUpload(message, suggestion = 'Please check the file and try again') {
    return new ErrorResponse({
      success: false,
      error: {
        type: 'FileUploadError',
        message,
        suggestion,
        retryable: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Add error ID for tracking
   */
  withId(id) {
    this.error.id = id;
    return this;
  }

  /**
   * Add request context
   */
  withContext(context) {
    this.error.context = context;
    return this;
  }

  /**
   * Add metadata
   */
  withMeta(meta) {
    this.meta = { ...this.meta, ...meta };
    return this;
  }

  /**
   * Add development information
   */
  withDevelopmentInfo(developerMessage, stack) {
    this.error.developerMessage = developerMessage;
    this.error.stack = stack;
    return this;
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    const response = {
      success: this.success,
      error: this.error
    };

    if (Object.keys(this.meta).length > 0) {
      response.meta = this.meta;
    }

    return response;
  }

  /**
   * Convert to string for logging
   */
  toString() {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  /**
   * Get HTTP status code from error type
   */
  getStatusCode() {
    const statusCodes = {
      ValidationError: 400,
      AuthenticationError: 401,
      AuthorizationError: 403,
      NotFoundError: 404,
      DuplicateError: 409,
      BusinessLogicError: 400,
      FileUploadError: 413,
      RateLimitError: 429,
      DatabaseError: 503,
      NetworkError: 503,
      ServerError: 500
    };

    return statusCodes[this.error.type] || 500;
  }

  /**
   * Check if error is retryable
   */
  isRetryable() {
    return this.error.retryable === true;
  }

  /**
   * Check if error is client error (4xx)
   */
  isClientError() {
    const statusCode = this.getStatusCode();
    return statusCode >= 400 && statusCode < 500;
  }

  /**
   * Check if error is server error (5xx)
   */
  isServerError() {
    const statusCode = this.getStatusCode();
    return statusCode >= 500;
  }
}