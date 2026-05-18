import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific config
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

// Try to load environment-specific file first, then fall back to .env
dotenv.config({ path: envFile });
dotenv.config(); // This will load .env if the specific file doesn't exist

/**
 * Environment configuration with validation and defaults
 */
class Config {
  constructor() {
    this.validateRequired();
  }

  // Server Configuration
  get port() {
    return parseInt(process.env.PORT) || 3001;
  }

  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  }

  get isDevelopment() {
    return this.nodeEnv === 'development';
  }

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get isStaging() {
    return this.nodeEnv === 'staging';
  }

  get isTest() {
    return this.nodeEnv === 'test';
  }

  // Database Configuration
  get mongoUri() {
    return this.isTest 
      ? process.env.MONGODB_URI_TEST 
      : process.env.MONGODB_URI;
  }

  // JWT Configuration
  get jwtSecret() {
    return process.env.JWT_SECRET;
  }

  get jwtExpire() {
    return process.env.JWT_EXPIRE || '30d';
  }

  // Application URLs
  get appUrl() {
    return process.env.APP_URL || `http://localhost:${this.port}`;
  }

  get frontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  // Backup Configuration
  get backupPath() {
    return process.env.BACKUP_PATH || './backups';
  }

  get backupRetentionDays() {
    return parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
  }

  get backupMaxFiles() {
    return parseInt(process.env.BACKUP_MAX_FILES) || 50;
  }

  // File Upload Configuration
  get uploadPath() {
    return process.env.UPLOAD_PATH || './uploads';
  }

  get maxFileSize() {
    return parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
  }

  // Email Configuration
  get smtpHost() {
    return process.env.SMTP_HOST;
  }

  get smtpPort() {
    return parseInt(process.env.SMTP_PORT) || 587;
  }

  get smtpUser() {
    return process.env.SMTP_USER;
  }

  get smtpPass() {
    return process.env.SMTP_PASS;
  }

  get fromEmail() {
    return process.env.FROM_EMAIL || 'noreply@thaiandglass.com';
  }

  get fromName() {
    return process.env.FROM_NAME || 'Thai & Aluminum';
  }

  // Security Configuration
  get bcryptRounds() {
    return parseInt(process.env.BCRYPT_ROUNDS) || 12;
  }

  get rateLimitWindowMs() {
    return parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
  }

  get rateLimitMaxRequests() {
    return parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
  }

  // Logging Configuration
  get logLevel() {
    return process.env.LOG_LEVEL || 'info';
  }

  get logFile() {
    return process.env.LOG_FILE || './logs/app.log';
  }

  // Feature Flags
  get enableScheduledBackups() {
    return process.env.ENABLE_SCHEDULED_BACKUPS === 'true';
  }

  get enableAuditLogging() {
    return process.env.ENABLE_AUDIT_LOGGING === 'true';
  }

  get enableRateLimiting() {
    return process.env.ENABLE_RATE_LIMITING === 'true';
  }

  // CORS Configuration
  get corsOrigins() {
    if (this.isProduction) {
      return [this.frontendUrl];
    }
    return ['http://localhost:3000', 'http://localhost:3001'];
  }

  /**
   * Validate required environment variables
   */
  validateRequired() {
    const required = ['MONGODB_URI', 'JWT_SECRET'];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secret length in production
    if (this.isProduction && process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }

    // Validate MongoDB URI format
    if (!this.mongoUri.startsWith('mongodb://') && !this.mongoUri.startsWith('mongodb+srv://')) {
      throw new Error('MONGODB_URI must be a valid MongoDB connection string');
    }
  }

  /**
   * Get all configuration as object (for debugging)
   */
  getAll() {
    return {
      nodeEnv: this.nodeEnv,
      port: this.port,
      appUrl: this.appUrl,
      frontendUrl: this.frontendUrl,
      backupPath: this.backupPath,
      uploadPath: this.uploadPath,
      logLevel: this.logLevel,
      enableScheduledBackups: this.enableScheduledBackups,
      enableAuditLogging: this.enableAuditLogging,
      enableRateLimiting: this.enableRateLimiting,
      // Don't expose sensitive data
      mongoUri: this.mongoUri ? '[CONFIGURED]' : '[NOT SET]',
      jwtSecret: this.jwtSecret ? '[CONFIGURED]' : '[NOT SET]',
    };
  }

  /**
   * Log configuration on startup (without sensitive data)
   */
  logStartup() {
    if (!this.isProduction) {
      console.log('🔧 Configuration loaded:');
      console.log(JSON.stringify(this.getAll(), null, 2));
    } else {
      console.log(`🔧 Configuration loaded for ${this.nodeEnv} environment`);
    }
  }
}

// Create and export singleton instance
const config = new Config();

export default config;