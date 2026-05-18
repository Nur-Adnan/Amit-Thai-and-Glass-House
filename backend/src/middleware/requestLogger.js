import config from '../config/env.js';
import logger from '../utils/logger.js';
import errorMonitoringService from '../services/errorMonitoringService.js';

/**
 * Request Logging Middleware
 * Logs all incoming requests with context and performance metrics
 */
class RequestLogger {
  constructor() {
    this.sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth',
      'authorization', 'cookie', 'x-api-key'
    ];
  }

  /**
   * Main request logging middleware
   */
  log = (req, res, next) => {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Add request ID to request object for tracking
    req.id = requestId;
    
    // Log request start
    this.logRequestStart(req, requestId);
    
    // Capture response details
    const originalSend = res.send;
    let responseBody = null;
    
    res.send = function(body) {
      responseBody = body;
      return originalSend.call(this, body);
    };
    
    // Log when response finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logRequestEnd(req, res, requestId, duration, responseBody);
    });
    
    next();
  };

  /**
   * Log request start
   */
  logRequestStart(req, requestId) {
    const requestData = {
      id: requestId,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: this.getClientIP(req),
      userId: req.user?.id,
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      body: this.sanitizeBody(req.body),
      timestamp: new Date().toISOString()
    };

    // Log based on environment
    if (config.isDevelopment) {
      logger.debug(`→ ${req.method} ${req.originalUrl}`, requestData);
    } else if (config.isStaging) {
      logger.info(`Request started: ${requestId}`, {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
        ip: requestData.ip
      });
    }
    // In production, only log security-relevant requests
    else if (this.isSecurityRelevant(req)) {
      logger.security(`Security request: ${requestId}`, {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id,
        ip: requestData.ip
      });
    }
  }

  /**
   * Log request completion
   */
  logRequestEnd(req, res, requestId, duration, responseBody) {
    const responseData = {
      id: requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      ip: this.getClientIP(req),
      responseSize: this.getResponseSize(responseBody),
      timestamp: new Date().toISOString()
    };

    // Determine log level based on status code
    const logLevel = this.getLogLevel(res.statusCode);
    
    // Log based on environment and status
    if (config.isDevelopment) {
      const statusEmoji = this.getStatusEmoji(res.statusCode);
      logger.debug(`← ${statusEmoji} ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, responseData);
    } else if (config.isStaging) {
      logger[logLevel](`Request completed: ${requestId}`, responseData);
    } else if (config.isProduction) {
      // In production, log errors and security events
      if (res.statusCode >= 400 || this.isSecurityRelevant(req)) {
        logger[logLevel](`Request ${requestId}: ${res.statusCode}`, responseData);
      }
    }

    // Always log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn(`Slow request detected: ${requestId}`, {
        ...responseData,
        threshold: '5000ms'
      });
    }

    // Log audit trail for sensitive operations
    if (this.isAuditableRequest(req, res)) {
      this.logAuditTrail(req, res, requestId, duration);
    }

    // Record metrics for monitoring
    errorMonitoringService.recordRequest(res.statusCode, duration);
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           'unknown';
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Get response size in bytes
   */
  getResponseSize(responseBody) {
    if (!responseBody) return 0;
    if (typeof responseBody === 'string') return Buffer.byteLength(responseBody);
    if (typeof responseBody === 'object') return Buffer.byteLength(JSON.stringify(responseBody));
    return 0;
  }

  /**
   * Get log level based on status code
   */
  getLogLevel(statusCode) {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'info';
  }

  /**
   * Get emoji for status code (development only)
   */
  getStatusEmoji(statusCode) {
    if (statusCode >= 500) return '💥';
    if (statusCode >= 400) return '⚠️';
    if (statusCode >= 300) return '↩️';
    return '✅';
  }

  /**
   * Check if request is security relevant
   */
  isSecurityRelevant(req) {
    const securityPaths = ['/api/auth', '/api/users', '/api/permissions'];
    const securityMethods = ['POST', 'PUT', 'DELETE'];
    
    return securityPaths.some(path => req.originalUrl.startsWith(path)) ||
           (securityMethods.includes(req.method) && req.user);
  }

  /**
   * Check if request should be audited
   */
  isAuditableRequest(req, res) {
    if (!config.enableAuditLogging) return false;
    
    const auditablePaths = [
      '/api/invoices', '/api/payments', '/api/customers',
      '/api/employees', '/api/expenses', '/api/investments'
    ];
    
    const auditableMethods = ['POST', 'PUT', 'DELETE'];
    
    return auditablePaths.some(path => req.originalUrl.startsWith(path)) &&
           auditableMethods.includes(req.method) &&
           res.statusCode < 400;
  }

  /**
   * Log audit trail for sensitive operations
   */
  logAuditTrail(req, res, requestId, duration) {
    const auditData = {
      requestId,
      action: `${req.method} ${req.originalUrl}`,
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: this.getClientIP(req),
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
      resource: this.extractResourceFromUrl(req.originalUrl),
      resourceId: req.params.id
    };

    logger.audit(`Audit: ${auditData.action}`, auditData);
  }

  /**
   * Extract resource name from URL
   */
  extractResourceFromUrl(url) {
    const match = url.match(/\/api\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Create express middleware function
   */
  static middleware() {
    const requestLogger = new RequestLogger();
    return requestLogger.log;
  }
}

export default RequestLogger.middleware();