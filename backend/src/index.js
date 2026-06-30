import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import config from './config/env.js';
import logger from './utils/logger.js';
import connectDB from './config/database.js';
import enhancedErrorHandler from './middleware/enhancedErrorHandler.js';
import requestLogger from './middleware/requestLogger.js';
import errorMonitoringService from './services/errorMonitoringService.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import customerRoutes from './routes/customers.js';
import customerCreditRoutes from './routes/customerCredit.js';
import productRoutes from './routes/products.js';
import calculatorRoutes from './routes/calculator.js';
import invoiceRoutes from './routes/invoices.js';
import paymentRoutes from './routes/invoicePayments.js';
import employeeRoutes from './routes/employees.js';
import salaryPaymentRoutes from './routes/salaryPayments.js';
import expenseRoutes from './routes/expenses.js';
import investmentRoutes from './routes/investments.js';
import profitRoutes from './routes/profit.js';
import dashboardRoutes from './routes/dashboard.js';
import validationRoutes from './routes/validation.js';
import auditRoutes from './routes/audit.js';
import backupRoutes from './routes/backup.js';
import shopConfigRoutes from './routes/shopConfig.js';
import dailySummaryRoutes from './routes/dailySummary.js';
import softDeleteRoutes from './routes/softDelete.js';
import permissionRoutes from './routes/permissions.js';
import supplierRoutes from './routes/suppliers.js';
import purchaseRoutes from './routes/purchases.js';
import stockPurchaseRoutes from './routes/stockPurchases.js';
import advancePaymentRoutes from './routes/advancePayment.js';
import wastageRoutes from './routes/wastage.js';
import serviceCostRoutes from './routes/serviceCost.js';
import financialAnalyticsRoutes from './routes/financialAnalytics.js';
import businessSummaryRoutes from './routes/businessSummary.js';
import businessAnalyticsRoutes from './routes/businessAnalytics.js';
import inventoryRoutes from './routes/inventory.js';
import bdShopInventoryRoutes from './routes/bdShopInventory.js';
import brandRoutes from './routes/brands.js';
import materialSpecRoutes from './routes/materialSpecs.js';
import ScheduledBackupService from './services/scheduledBackupService.js';

// Log configuration on startup
config.logStartup();

// Connect to database
connectDB();

const app = express();

// Security headers. crossOriginResourcePolicy is relaxed so the frontend
// (different origin) can still load uploaded images from /uploads.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const corsOptions = {
  origin: config.corsOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: `${config.maxFileSize}b` }));
app.use(express.urlencoded({ extended: true }));

// Strip keys containing `$` or `.` from req.body/query/params
// (NoSQL operator-injection defense-in-depth, on top of route validation).
app.use(mongoSanitize());

// Rate limiting. Auth endpoints get a strict limiter (brute-force / credential
// stuffing); a general API limiter is opt-in via ENABLE_RATE_LIMITING since
// dashboards are request-heavy.
const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
if (config.enableRateLimiting) {
  app.use('/api/', apiLimiter);
}

// Request logging middleware
app.use(requestLogger);

// Request ID middleware for tracking
app.use((req, res, next) => {
  if (!req.id) {
    req.id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Remove the old development-only request logging
// (now handled by requestLogger middleware)

// Serve static files for uploads
app.use('/uploads', express.static(config.uploadPath));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-credit', customerCreditRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/stock-purchases', stockPurchaseRoutes);
app.use('/api/advance-payment', advancePaymentRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/service-cost', serviceCostRoutes);
app.use('/api/financial-analytics', financialAnalyticsRoutes);
app.use('/api/business-summary', businessSummaryRoutes);
app.use('/api/business-analytics', businessAnalyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bd-shop-inventory', bdShopInventoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/material-specs', materialSpecRoutes);
app.use('/api/products', productRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/salary-payments', salaryPaymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/profit', profitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/shop-config', shopConfigRoutes);
app.use('/api/daily-summary', dailySummaryRoutes);
app.use('/api/soft-delete', softDeleteRoutes);
app.use('/api/permissions', permissionRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend API is running!',
    version: '1.0.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`, { 
    method: req.method, 
    ip: req.ip 
  });
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last)
app.use(enhancedErrorHandler.handle);

const server = app.listen(config.port, () => {
  logger.startup(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  logger.startup(`API URL: ${config.appUrl}`);
  logger.startup(`Frontend URL: ${config.frontendUrl}`);
  
  // Start error monitoring service
  if (!config.isTest) {
    errorMonitoringService.start();
    logger.startup('Error monitoring service started');
  }
  
  // Start scheduled backup service
  if (!config.isTest && config.enableScheduledBackups) {
    ScheduledBackupService.start();
    logger.startup('Scheduled backup service started');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`, { 
    stack: err.stack 
  });
  
  // Stop services
  errorMonitoringService.stop();
  if (config.enableScheduledBackups) {
    ScheduledBackupService.stop();
  }
  
  server.close(() => {
    process.exit(1);
  });
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  logger.startup(`${signal} received. Shutting down gracefully...`);
  
  // Stop services
  errorMonitoringService.stop();
  if (config.enableScheduledBackups) {
    ScheduledBackupService.stop();
  }
  
  server.close(() => {
    logger.startup('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
