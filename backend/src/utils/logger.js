import config from '../config/env.js';

/**
 * Environment-aware logger utility
 * Replaces console.log statements with proper logging
 */
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[config.logLevel] || this.levels.info;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return this.levels[level] <= this.currentLevel;
  }

  /**
   * Log error messages
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  /**
   * Log warning messages
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  /**
   * Log info messages
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  /**
   * Log debug messages (only in development/staging)
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug') && !config.isProduction) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  /**
   * Log startup messages
   */
  startup(message, meta = {}) {
    console.log(this.formatMessage('startup', message, meta));
  }

  /**
   * Log database connection
   */
  database(message, meta = {}) {
    if (!config.isProduction) {
      console.log(this.formatMessage('database', message, meta));
    }
  }

  /**
   * Log API requests (only in development)
   */
  request(method, url, status, duration, meta = {}) {
    if (config.isDevelopment) {
      const message = `${method} ${url} ${status} - ${duration}ms`;
      console.log(this.formatMessage('request', message, meta));
    }
  }

  /**
   * Log security events (always logged)
   */
  security(message, meta = {}) {
    console.log(this.formatMessage('security', message, meta));
  }

  /**
   * Log audit events (always logged if audit is enabled)
   */
  audit(message, meta = {}) {
    if (config.enableAuditLogging) {
      console.log(this.formatMessage('audit', message, meta));
    }
  }

  /**
   * Log backup events
   */
  backup(message, meta = {}) {
    console.log(this.formatMessage('backup', message, meta));
  }

  /**
   * Silent method for production (replaces console.log)
   */
  silent() {
    // Do nothing in production
    if (!config.isProduction) {
      console.log(...arguments);
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;