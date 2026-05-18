
    export class ErrorResponse {
      constructor(options = {}) {
        this.success = options.success || false;
        this.error = options.error || {};
      }
      
      static validation(message, validationErrors = []) {
        return new ErrorResponse({
          success: false,
          error: {
            type: 'ValidationError',
            message: message || 'Validation failed',
            validationErrors,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      toJSON() {
        return {
          success: this.success,
          error: this.error
        };
      }
      
      getStatusCode() {
        const statusCodes = {
          ValidationError: 400,
          AuthenticationError: 401,
          ServerError: 500
        };
        return statusCodes[this.error.type] || 500;
      }
    }
  