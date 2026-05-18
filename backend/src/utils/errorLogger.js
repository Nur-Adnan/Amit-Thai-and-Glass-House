import config from '../config/env.js';
import logger from './logger.js';

/**
 * Error Logger Utility
 * Handles error tracking, monitoring, and alerting
 */
export class ErrorLogger {
  constructor() {
    this.errorCounts = new Map();
    this.alertThresholds = {
      error: 10,    // Alert after 10 errors in 5 minutes
      warning: 50,  // Alert after 50 warnings in 5 minutes
      critical: 1   // Alert immediately for critical errors
    };
    this.timeWindow = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Log error to tracking system
   */
  logError(errorInfo, req, originalError) {
    try {
      // Create comprehensive error record
      const errorRecord = {
        id: errorInfo.id,
        timestamp: errorInfo.timestamp,
        type: errorInfo.type,
        category: errorInfo.category,
        severity: errorInfo.severity,
        message: errorInfo.developerMessage,
        userMessage: errorInfo.userMessage,
        statusCode: errorInfo.statusCode,
        retryable: errorInfo.retryable,
        
        // Request context
        request: {
          method: req.method,
          url: req.originalUrl,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.user?.id,
          requestId: req.id || req.headers['x-request-id'],
          body: this.sanitizeRequestBody(req.body),
          query: req.query,
          params: req.params
        },
        
        // Error details
        error: {
          name: originalError.name,
          message: originalError.message,
          stack: originalError.stack,
          code: originalError.code
        },
        
        // System context
        system: {
          nodeEnv: config.nodeEnv,
          timestamp: Date.now(),
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };

      // Log to file/database based on environment
      this.persistError(errorRecord);
      
      // Track error frequency
      this.trackErrorFrequency(errorInfo);
      
      // Check for alerting
      this.checkAlertThresholds(errorInfo);
      
    } catch (loggingError) {
      // Fallback logging if error logger fails
      logger.error('Error logger failed', {
        originalError: originalError.message,
        loggingError: loggingError.message
      });
    }
  }

  /**
   * Sanitize request body to remove sensitive data
   */
  sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth',
      'credit_card', 'ssn', 'social_security'
    ];
    
    const sanitized = { ...body };
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Persist error to storage
   */
  persistError(errorRecord) {
    if (config.isProduction) {
      // In production, you might want to send to external service
      // like Sentry, LogRocket, or custom error tracking service
      this.sendToExternalService(errorRecord);
    } else {
      // In development, log to console with formatting
      this.logToDevelopmentConsole(errorRecord);
    }
    
    // Always log to file for audit trail
    this.logToFile(errorRecord);
  }

  /**
   * Log to development console with nice formatting
   */
  logToDevelopmentConsole(errorRecord) {
    console.group(`🚨 Error ${errorRecord.id}`);
    console.log(`Type: ${errorRecord.type} (${errorRecord.severity})`);
    console.log(`Message: ${errorRecord.message}`);
    console.log(`Request: ${errorRecord.request.method} ${errorRecord.request.url}`);
    console.log(`User: ${errorRecord.request.userId || 'Anonymous'}`);
    console.log(`Stack:`, errorRecord.error.stack);
    console.groupEnd();
  }

  /**
   * Log to file for audit trail
   */
  logToFile(errorRecord) {
    // Use the existing logger to write to file
    logger.error(`Error logged: ${errorRecord.id}`, {
      errorRecord: {
        ...errorRecord,
        // Don't include full stack in file logs to save space
        error: {
          ...errorRecord.error,
          stack: errorRecord.error.stack ? '[STACK_AVAILABLE]' : null
        }
      }
    });
  }

  /**
   * Send to external error tracking service
   */
  sendToExternalService(errorRecord) {
    // Placeholder for external service integration
    // Examples: Sentry, Bugsnag, LogRocket, etc.
    
    // For now, just log that we would send it
    logger.info(`Would send error ${errorRecord.id} to external service`, {
      type: errorRecord.type,
      severity: errorRecord.severity
    });
  }

  /**
   * Track error frequency for alerting
   */
  trackErrorFrequency(errorInfo) {
    const key = `${errorInfo.type}_${errorInfo.category}`;
    const now = Date.now();
    
    if (!this.errorCounts.has(key)) {
      this.errorCounts.set(key, []);
    }
    
    const counts = this.errorCounts.get(key);
    counts.push(now);
    
    // Remove old entries outside time window
    const cutoff = now - this.timeWindow;
    const recentCounts = counts.filter(timestamp => timestamp > cutoff);
    this.errorCounts.set(key, recentCounts);
  }

  /**
   * Check if error frequency exceeds alert thresholds
   */
  checkAlertThresholds(errorInfo) {
    const key = `${errorInfo.type}_${errorInfo.category}`;
    const counts = this.errorCounts.get(key) || [];
    
    let threshold = this.alertThresholds.error;
    if (errorInfo.severity === 'warning') {
      threshold = this.alertThresholds.warning;
    } else if (errorInfo.severity === 'critical') {
      threshold = this.alertThresholds.critical;
    }
    
    if (counts.length >= threshold) {
      this.sendAlert(errorInfo, counts.length);
    }
  }

  /**
   * Send alert for high error frequency
   */
  sendAlert(errorInfo, count) {
    const alertMessage = `High error frequency detected: ${errorInfo.type} (${count} occurrences in ${this.timeWindow / 60000} minutes)`;
    
    logger.error(alertMessage, {
      errorType: errorInfo.type,
      category: errorInfo.category,
      severity: errorInfo.severity,
      count,
      timeWindow: this.timeWindow
    });
    
    // In production, you might want to send email, Slack notification, etc.
    if (config.isProduction) {
      this.sendProductionAlert(alertMessage, errorInfo, count);
    }
  }

  /**
   * Send production alert (email, Slack, etc.)
   */
  sendProductionAlert(message, errorInfo, count) {
    // Placeholder for production alerting
    // Examples: Send email, Slack webhook, SMS, etc.
    
    logger.security(`Production alert: ${message}`, {
      errorInfo,
      count,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {};
    const now = Date.now();
    const cutoff = now - this.timeWindow;
    
    for (const [key, timestamps] of this.errorCounts.entries()) {
      const recentCount = timestamps.filter(t => t > cutoff).length;
      if (recentCount > 0) {
        stats[key] = recentCount;
      }
    }
    
    return {
      timeWindow: this.timeWindow,
      windowStart: new Date(cutoff).toISOString(),
      windowEnd: new Date(now).toISOString(),
      errorCounts: stats
    };
  }

  /**
   * Clear error tracking data (for testing)
   */
  clearStats() {
    this.errorCounts.clear();
  }
}