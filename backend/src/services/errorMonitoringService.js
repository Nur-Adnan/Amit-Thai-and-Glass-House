import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Error Monitoring and Alerting Service
 * Monitors application health and sends alerts for critical issues
 */
class ErrorMonitoringService {
  constructor() {
    this.isRunning = false;
    this.monitoringInterval = null;
    this.healthChecks = new Map();
    this.alertHistory = new Map();
    
    // Monitoring configuration
    this.config = {
      checkInterval: 60000, // 1 minute
      alertCooldown: 300000, // 5 minutes
      healthThresholds: {
        errorRate: 0.1, // 10% error rate
        responseTime: 5000, // 5 seconds
        memoryUsage: 0.9, // 90% memory usage
        diskUsage: 0.9 // 90% disk usage
      }
    };
    
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        responseTimes: []
      },
      system: {
        startTime: Date.now(),
        lastHealthCheck: null
      }
    };
  }

  /**
   * Start error monitoring service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Error monitoring service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting error monitoring service');

    // Start periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);

    // Register process event handlers
    this.registerProcessHandlers();
    
    logger.info('Error monitoring service started');
  }

  /**
   * Stop error monitoring service
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('Error monitoring service stopped');
  }

  /**
   * Record request metrics
   */
  recordRequest(statusCode, responseTime) {
    this.metrics.requests.total++;
    this.metrics.requests.responseTimes.push(responseTime);
    
    if (statusCode >= 400) {
      this.metrics.requests.errors++;
    }

    // Keep only last 1000 response times
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes = this.metrics.requests.responseTimes.slice(-1000);
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {}
      };

      // Check error rate
      const errorRate = this.calculateErrorRate();
      healthStatus.checks.errorRate = {
        status: errorRate <= this.config.healthThresholds.errorRate ? 'pass' : 'fail',
        value: errorRate,
        threshold: this.config.healthThresholds.errorRate
      };

      // Check average response time
      const avgResponseTime = this.calculateAverageResponseTime();
      healthStatus.checks.responseTime = {
        status: avgResponseTime <= this.config.healthThresholds.responseTime ? 'pass' : 'fail',
        value: avgResponseTime,
        threshold: this.config.healthThresholds.responseTime
      };

      // Check memory usage
      const memoryUsage = this.getMemoryUsage();
      healthStatus.checks.memory = {
        status: memoryUsage.percentage <= this.config.healthThresholds.memoryUsage ? 'pass' : 'fail',
        value: memoryUsage.percentage,
        threshold: this.config.healthThresholds.memoryUsage,
        details: memoryUsage
      };

      // Check uptime
      const uptime = this.getUptime();
      healthStatus.checks.uptime = {
        status: 'pass',
        value: uptime,
        details: {
          seconds: uptime,
          human: this.formatUptime(uptime)
        }
      };

      // Determine overall status
      const failedChecks = Object.values(healthStatus.checks).filter(check => check.status === 'fail');
      if (failedChecks.length > 0) {
        healthStatus.status = 'unhealthy';
        await this.handleUnhealthyStatus(healthStatus, failedChecks);
      }

      this.metrics.system.lastHealthCheck = healthStatus;
      
      // Log health status
      if (healthStatus.status === 'unhealthy') {
        logger.error('Health check failed', healthStatus);
      } else {
        logger.debug('Health check passed', healthStatus);
      }

    } catch (error) {
      logger.error('Health check error', { error: error.message, stack: error.stack });
    }
  }

  /**
   * Handle unhealthy status
   */
  async handleUnhealthyStatus(healthStatus, failedChecks) {
    const alertKey = failedChecks.map(check => check.status).join(',');
    const lastAlert = this.alertHistory.get(alertKey);
    const now = Date.now();

    // Check if we should send alert (cooldown period)
    if (!lastAlert || (now - lastAlert) > this.config.alertCooldown) {
      await this.sendHealthAlert(healthStatus, failedChecks);
      this.alertHistory.set(alertKey, now);
    }
  }

  /**
   * Send health alert
   */
  async sendHealthAlert(healthStatus, failedChecks) {
    const alertMessage = `Application health check failed: ${failedChecks.length} checks failed`;
    
    const alertData = {
      severity: 'critical',
      message: alertMessage,
      timestamp: healthStatus.timestamp,
      failedChecks: failedChecks.map(check => ({
        name: check.name,
        value: check.value,
        threshold: check.threshold
      })),
      systemInfo: {
        uptime: this.getUptime(),
        memory: this.getMemoryUsage(),
        environment: config.nodeEnv
      }
    };

    logger.error(alertMessage, alertData);

    // Send to external alerting systems in production
    if (config.isProduction) {
      await this.sendExternalAlert(alertData);
    }
  }

  /**
   * Send alert to external systems
   */
  async sendExternalAlert(alertData) {
    // Placeholder for external alerting integration
    // Examples: Email, Slack, PagerDuty, etc.
    
    logger.security('Production alert sent', {
      type: 'health_check_failure',
      severity: alertData.severity,
      timestamp: alertData.timestamp
    });
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    if (this.metrics.requests.total === 0) return 0;
    return this.metrics.requests.errors / this.metrics.requests.total;
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    const times = this.metrics.requests.responseTimes;
    if (times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal + usage.external;
    const usedMemory = usage.heapUsed;
    
    return {
      used: usedMemory,
      total: totalMemory,
      percentage: usedMemory / totalMemory,
      details: {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss
      }
    };
  }

  /**
   * Get application uptime
   */
  getUptime() {
    return Math.floor((Date.now() - this.metrics.system.startTime) / 1000);
  }

  /**
   * Format uptime in human readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Register process event handlers
   */
  registerProcessHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Send critical alert
      this.sendCriticalAlert('Uncaught Exception', error);
      
      // Graceful shutdown
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString(),
        timestamp: new Date().toISOString()
      });
      
      // Send critical alert
      this.sendCriticalAlert('Unhandled Promise Rejection', reason);
    });

    // Handle warning events
    process.on('warning', (warning) => {
      logger.warn('Process Warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Send critical alert
   */
  async sendCriticalAlert(type, error) {
    const alertData = {
      severity: 'critical',
      type,
      message: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      systemInfo: {
        uptime: this.getUptime(),
        memory: this.getMemoryUsage(),
        environment: config.nodeEnv
      }
    };

    logger.error(`Critical alert: ${type}`, alertData);

    if (config.isProduction) {
      await this.sendExternalAlert(alertData);
    }
  }

  /**
   * Graceful shutdown
   */
  gracefulShutdown(reason) {
    logger.error(`Initiating graceful shutdown due to: ${reason}`);
    
    this.stop();
    
    // Give some time for cleanup
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.calculateErrorRate(),
      averageResponseTime: this.calculateAverageResponseTime(),
      memoryUsage: this.getMemoryUsage(),
      uptime: this.getUptime(),
      lastHealthCheck: this.metrics.system.lastHealthCheck
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        errors: 0,
        responseTimes: []
      },
      system: {
        startTime: Date.now(),
        lastHealthCheck: null
      }
    };
  }
}

// Export singleton instance
export default new ErrorMonitoringService();