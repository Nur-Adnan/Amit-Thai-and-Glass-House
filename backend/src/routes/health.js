import express from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import errorMonitoringService from '../services/errorMonitoringService.js';
import config from '../config/env.js';

const router = express.Router();

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}));

// Database health check
router.get('/db', asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  if (dbState === 1) {
    res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      database: {
        status: states[dbState],
        host: mongoose.connection.host,
        name: mongoose.connection.name
      }
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Database connection is unhealthy',
      database: {
        status: states[dbState]
      }
    });
  }
}));

// Detailed system health
router.get('/system', asyncHandler(async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  // Get monitoring metrics
  const metrics = errorMonitoringService.getMetrics();
  
  // Determine overall health status
  const isDbHealthy = dbState === 1;
  const isErrorRateHealthy = metrics.errorRate <= 0.1;
  const isResponseTimeHealthy = metrics.averageResponseTime <= 5000;
  const isMemoryHealthy = metrics.memoryUsage.percentage <= 0.9;
  
  const overallHealthy = isDbHealthy && isErrorRateHealthy && isResponseTimeHealthy && isMemoryHealthy;

  res.status(overallHealthy ? 200 : 503).json({
    success: overallHealthy,
    status: overallHealthy ? 'healthy' : 'unhealthy',
    system: {
      server: {
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        environment: config.nodeEnv
      },
      database: {
        status: states[dbState],
        healthy: isDbHealthy,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      monitoring: {
        errorRate: {
          value: metrics.errorRate,
          healthy: isErrorRateHealthy,
          threshold: 0.1
        },
        averageResponseTime: {
          value: metrics.averageResponseTime,
          healthy: isResponseTimeHealthy,
          threshold: 5000
        },
        memoryUsage: {
          value: metrics.memoryUsage.percentage,
          healthy: isMemoryHealthy,
          threshold: 0.9,
          details: metrics.memoryUsage.details
        },
        requests: {
          total: metrics.requests.total,
          errors: metrics.requests.errors
        }
      }
    },
    timestamp: new Date().toISOString()
  });
}));

// Comprehensive health check with all services
router.get('/comprehensive', asyncHandler(async (req, res) => {
  const checks = {};
  let overallHealthy = true;

  // Database check
  const dbState = mongoose.connection.readyState;
  checks.database = {
    status: dbState === 1 ? 'pass' : 'fail',
    message: dbState === 1 ? 'Database connected' : 'Database not connected',
    details: {
      state: dbState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    }
  };
  if (dbState !== 1) overallHealthy = false;

  // Error monitoring check
  const metrics = errorMonitoringService.getMetrics();
  checks.errorRate = {
    status: metrics.errorRate <= 0.1 ? 'pass' : 'fail',
    message: `Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`,
    value: metrics.errorRate,
    threshold: 0.1
  };
  if (metrics.errorRate > 0.1) overallHealthy = false;

  checks.responseTime = {
    status: metrics.averageResponseTime <= 5000 ? 'pass' : 'fail',
    message: `Average response time: ${metrics.averageResponseTime.toFixed(2)}ms`,
    value: metrics.averageResponseTime,
    threshold: 5000
  };
  if (metrics.averageResponseTime > 5000) overallHealthy = false;

  checks.memory = {
    status: metrics.memoryUsage.percentage <= 0.9 ? 'pass' : 'fail',
    message: `Memory usage: ${(metrics.memoryUsage.percentage * 100).toFixed(2)}%`,
    value: metrics.memoryUsage.percentage,
    threshold: 0.9
  };
  if (metrics.memoryUsage.percentage > 0.9) overallHealthy = false;

  // Uptime check
  const uptime = process.uptime();
  checks.uptime = {
    status: 'pass',
    message: `Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    value: uptime
  };

  res.status(overallHealthy ? 200 : 503).json({
    success: overallHealthy,
    status: overallHealthy ? 'healthy' : 'unhealthy',
    checks,
    summary: {
      total: Object.keys(checks).length,
      passed: Object.values(checks).filter(check => check.status === 'pass').length,
      failed: Object.values(checks).filter(check => check.status === 'fail').length
    },
    timestamp: new Date().toISOString()
  });
}));

// Error monitoring metrics endpoint
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = errorMonitoringService.getMetrics();
  
  res.status(200).json({
    success: true,
    metrics,
    timestamp: new Date().toISOString()
  });
}));

export default router;