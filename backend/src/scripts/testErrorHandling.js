#!/usr/bin/env node

/**
 * Error Handling System Test Script
 * Tests various error scenarios to validate the comprehensive error handling system
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import enhancedErrorHandler from '../middleware/enhancedErrorHandler.js';
import { ErrorLogger } from '../utils/errorLogger.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import errorMonitoringService from '../services/errorMonitoringService.js';

class ErrorHandlingTester {
  constructor() {
    this.testResults = [];
    this.errorLogger = new ErrorLogger();
  }

  /**
   * Run all error handling tests
   */
  async runAllTests() {
    console.log('🧪 Starting Error Handling System Tests\n');
    
    try {
      // Test error parsing and classification
      await this.testErrorParsing();
      
      // Test error response creation
      await this.testErrorResponses();
      
      // Test error logging
      await this.testErrorLogging();
      
      // Test monitoring service
      await this.testMonitoringService();
      
      // Test error frequency tracking
      await this.testErrorFrequencyTracking();
      
      // Print results
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test error parsing and classification
   */
  async testErrorParsing() {
    console.log('📋 Testing Error Parsing and Classification...');
    
    const testCases = [
      {
        name: 'Mongoose CastError',
        error: { name: 'CastError', value: 'invalid-id', path: 'id' },
        expectedType: 'ValidationError',
        expectedStatus: 400
      },
      {
        name: 'Mongoose Duplicate Key',
        error: { code: 11000, keyValue: { email: 'test@example.com' } },
        expectedType: 'DuplicateError',
        expectedStatus: 409
      },
      {
        name: 'JWT Token Expired',
        error: { name: 'TokenExpiredError', message: 'jwt expired' },
        expectedType: 'AuthenticationError',
        expectedStatus: 401
      },
      {
        name: 'Business Logic Error',
        error: { message: 'insufficient stock for product' },
        expectedType: 'BusinessLogicError',
        expectedStatus: 400
      },
      {
        name: 'Database Connection Error',
        error: { name: 'MongoNetworkError', message: 'connection failed' },
        expectedType: 'DatabaseError',
        expectedStatus: 503
      }
    ];

    for (const testCase of testCases) {
      try {
        const mockReq = { method: 'GET', originalUrl: '/test', ip: '127.0.0.1' };
        const errorInfo = enhancedErrorHandler.parseError(testCase.error, mockReq, 'test-id');
        
        const passed = errorInfo.type === testCase.expectedType && 
                      errorInfo.statusCode === testCase.expectedStatus;
        
        this.recordTest(testCase.name, passed, {
          expected: { type: testCase.expectedType, status: testCase.expectedStatus },
          actual: { type: errorInfo.type, status: errorInfo.statusCode }
        });
        
      } catch (error) {
        this.recordTest(testCase.name, false, { error: error.message });
      }
    }
  }

  /**
   * Test error response creation
   */
  async testErrorResponses() {
    console.log('📝 Testing Error Response Creation...');
    
    const testCases = [
      {
        name: 'Validation Error Response',
        method: () => ErrorResponse.validation('Invalid input', [{ field: 'email', message: 'Required' }]),
        expectedType: 'ValidationError'
      },
      {
        name: 'Authentication Error Response',
        method: () => ErrorResponse.authentication(),
        expectedType: 'AuthenticationError'
      },
      {
        name: 'Not Found Error Response',
        method: () => ErrorResponse.notFound('User'),
        expectedType: 'NotFoundError'
      },
      {
        name: 'Server Error Response',
        method: () => ErrorResponse.serverError(),
        expectedType: 'ServerError'
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = testCase.method();
        const json = response.toJSON();
        
        const passed = json.success === false && 
                      json.error.type === testCase.expectedType &&
                      json.error.timestamp;
        
        this.recordTest(testCase.name, passed, {
          expected: { success: false, type: testCase.expectedType },
          actual: { success: json.success, type: json.error.type }
        });
        
      } catch (error) {
        this.recordTest(testCase.name, false, { error: error.message });
      }
    }
  }

  /**
   * Test error logging functionality
   */
  async testErrorLogging() {
    console.log('📊 Testing Error Logging...');
    
    const testCases = [
      {
        name: 'Error Logger Initialization',
        test: () => {
          const logger = new ErrorLogger();
          return logger && typeof logger.logError === 'function';
        }
      },
      {
        name: 'Request Body Sanitization',
        test: () => {
          const logger = new ErrorLogger();
          const body = { email: 'test@example.com', password: 'secret123' };
          const sanitized = logger.sanitizeRequestBody(body);
          return sanitized.email === 'test@example.com' && sanitized.password === '[REDACTED]';
        }
      },
      {
        name: 'Error Frequency Tracking',
        test: () => {
          const logger = new ErrorLogger();
          logger.clearStats();
          logger.trackErrorFrequency({ type: 'TestError', category: 'test' });
          const stats = logger.getErrorStats();
          return stats.errorCounts['TestError_test'] === 1;
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        const passed = testCase.test();
        this.recordTest(testCase.name, passed);
      } catch (error) {
        this.recordTest(testCase.name, false, { error: error.message });
      }
    }
  }

  /**
   * Test monitoring service
   */
  async testMonitoringService() {
    console.log('📈 Testing Error Monitoring Service...');
    
    const testCases = [
      {
        name: 'Monitoring Service Initialization',
        test: () => {
          return errorMonitoringService && typeof errorMonitoringService.start === 'function';
        }
      },
      {
        name: 'Request Metrics Recording',
        test: () => {
          errorMonitoringService.resetMetrics();
          errorMonitoringService.recordRequest(200, 150);
          errorMonitoringService.recordRequest(404, 50);
          const metrics = errorMonitoringService.getMetrics();
          return metrics.requests.total === 2 && metrics.requests.errors === 1;
        }
      },
      {
        name: 'Error Rate Calculation',
        test: () => {
          errorMonitoringService.resetMetrics();
          errorMonitoringService.recordRequest(200, 100);
          errorMonitoringService.recordRequest(500, 200);
          const errorRate = errorMonitoringService.calculateErrorRate();
          return errorRate === 0.5; // 50% error rate
        }
      },
      {
        name: 'Memory Usage Monitoring',
        test: () => {
          const memoryUsage = errorMonitoringService.getMemoryUsage();
          return memoryUsage && 
                 typeof memoryUsage.used === 'number' &&
                 typeof memoryUsage.percentage === 'number' &&
                 memoryUsage.percentage >= 0 && memoryUsage.percentage <= 1;
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        const passed = testCase.test();
        this.recordTest(testCase.name, passed);
      } catch (error) {
        this.recordTest(testCase.name, false, { error: error.message });
      }
    }
  }

  /**
   * Test error frequency tracking and alerting
   */
  async testErrorFrequencyTracking() {
    console.log('🚨 Testing Error Frequency Tracking...');
    
    const testCases = [
      {
        name: 'Error Count Tracking',
        test: () => {
          const logger = new ErrorLogger();
          logger.clearStats();
          
          // Simulate multiple errors
          for (let i = 0; i < 5; i++) {
            logger.trackErrorFrequency({ type: 'TestError', category: 'test' });
          }
          
          const stats = logger.getErrorStats();
          return stats.errorCounts['TestError_test'] === 5;
        }
      },
      {
        name: 'Time Window Filtering',
        test: () => {
          const logger = new ErrorLogger();
          logger.clearStats();
          
          // Add old error (simulate by manipulating the internal structure)
          const key = 'TestError_test';
          const oldTimestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago
          logger.errorCounts.set(key, [oldTimestamp]);
          
          // Add recent error
          logger.trackErrorFrequency({ type: 'TestError', category: 'test' });
          
          const stats = logger.getErrorStats();
          return stats.errorCounts[key] === 1; // Only recent error should count
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        const passed = testCase.test();
        this.recordTest(testCase.name, passed);
      } catch (error) {
        this.recordTest(testCase.name, false, { error: error.message });
      }
    }
  }

  /**
   * Record test result
   */
  recordTest(name, passed, details = null) {
    this.testResults.push({
      name,
      passed,
      details
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}`);
    
    if (!passed && details) {
      console.log(`    Details:`, details);
    }
  }

  /**
   * Print test results summary
   */
  printTestResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n📊 Test Results Summary:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests} ✅`);
    console.log(`  Failed: ${failedTests} ❌`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}`);
          if (test.details) {
            console.log(`    ${JSON.stringify(test.details, null, 4)}`);
          }
        });
    }
    
    console.log('\n🎉 Error Handling System Test Complete!');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ErrorHandlingTester();
  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export default ErrorHandlingTester;