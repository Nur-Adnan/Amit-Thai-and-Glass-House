#!/usr/bin/env node

/**
 * Error Handling System Validation Script
 * Validates the error handling system without requiring full environment setup
 */

import { ErrorResponse } from '../utils/errorResponse.js';
import { ErrorLogger } from '../utils/errorLogger.js';

class ErrorHandlingValidator {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run validation tests
   */
  async runValidation() {
    console.log('🔍 Validating Error Handling System\n');
    
    try {
      // Test error response creation
      this.testErrorResponses();
      
      // Test error logger functionality
      this.testErrorLogger();
      
      // Print results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test error response creation
   */
  testErrorResponses() {
    console.log('📝 Testing Error Response Creation...');
    
    const tests = [
      {
        name: 'Validation Error Response',
        test: () => {
          const response = ErrorResponse.validation('Invalid input', [
            { field: 'email', message: 'Required' }
          ]);
          const json = response.toJSON();
          return json.success === false && 
                 json.error.type === 'ValidationError' &&
                 json.error.validationErrors.length === 1;
        }
      },
      {
        name: 'Authentication Error Response',
        test: () => {
          const response = ErrorResponse.authentication();
          const json = response.toJSON();
          return json.success === false && 
                 json.error.type === 'AuthenticationError' &&
                 json.error.retryable === false;
        }
      },
      {
        name: 'Business Logic Error Response',
        test: () => {
          const response = ErrorResponse.businessLogic('Insufficient stock', 'inventory');
          const json = response.toJSON();
          return json.success === false && 
                 json.error.type === 'BusinessLogicError' &&
                 json.error.category === 'inventory';
        }
      },
      {
        name: 'Error Response with ID',
        test: () => {
          const response = ErrorResponse.serverError().withId('test-123');
          const json = response.toJSON();
          return json.error.id === 'test-123';
        }
      },
      {
        name: 'Error Response Status Codes',
        test: () => {
          const validationResponse = ErrorResponse.validation('Test');
          const authResponse = ErrorResponse.authentication();
          const serverResponse = ErrorResponse.serverError();
          
          return validationResponse.getStatusCode() === 400 &&
                 authResponse.getStatusCode() === 401 &&
                 serverResponse.getStatusCode() === 500;
        }
      }
    ];

    tests.forEach(test => {
      try {
        const passed = test.test();
        this.recordTest(test.name, passed);
      } catch (error) {
        this.recordTest(test.name, false, error.message);
      }
    });
  }

  /**
   * Test error logger functionality
   */
  testErrorLogger() {
    console.log('📊 Testing Error Logger...');
    
    const tests = [
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
          const body = { 
            email: 'test@example.com', 
            password: 'secret123',
            token: 'jwt-token-here'
          };
          const sanitized = logger.sanitizeRequestBody(body);
          return sanitized.email === 'test@example.com' && 
                 sanitized.password === '[REDACTED]' &&
                 sanitized.token === '[REDACTED]';
        }
      },
      {
        name: 'Error Frequency Tracking',
        test: () => {
          const logger = new ErrorLogger();
          logger.clearStats();
          
          // Track some errors
          logger.trackErrorFrequency({ type: 'TestError', category: 'test' });
          logger.trackErrorFrequency({ type: 'TestError', category: 'test' });
          logger.trackErrorFrequency({ type: 'OtherError', category: 'other' });
          
          const stats = logger.getErrorStats();
          return stats.errorCounts['TestError_test'] === 2 &&
                 stats.errorCounts['OtherError_other'] === 1;
        }
      },
      {
        name: 'Error Statistics Format',
        test: () => {
          const logger = new ErrorLogger();
          logger.clearStats();
          logger.trackErrorFrequency({ type: 'TestError', category: 'test' });
          
          const stats = logger.getErrorStats();
          return stats.timeWindow && 
                 stats.windowStart && 
                 stats.windowEnd &&
                 stats.errorCounts;
        }
      }
    ];

    tests.forEach(test => {
      try {
        const passed = test.test();
        this.recordTest(test.name, passed);
      } catch (error) {
        this.recordTest(test.name, false, error.message);
      }
    });
  }

  /**
   * Record test result
   */
  recordTest(name, passed, error = null) {
    this.testResults.push({ name, passed, error });
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}`);
    
    if (!passed && error) {
      console.log(`    Error: ${error}`);
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(test => test.passed).length;
    const failed = total - passed;
    
    console.log('\n📊 Validation Results:');
    console.log(`  Total Tests: ${total}`);
    console.log(`  Passed: ${passed} ✅`);
    console.log(`  Failed: ${failed} ❌`);
    console.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All error handling components are working correctly!');
      console.log('✅ Error Handling System is ready for production use.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the error handling implementation.');
      process.exit(1);
    }
  }
}

// Run validation
const validator = new ErrorHandlingValidator();
validator.runValidation().catch(error => {
  console.error('Validation execution failed:', error);
  process.exit(1);
});