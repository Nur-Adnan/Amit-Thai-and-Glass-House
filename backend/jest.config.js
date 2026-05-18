export default {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests
  rootDir: '../',
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform files with babel
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Test match patterns
  testMatch: [
    '<rootDir>/tests/unit/backend/**/*.test.js',
    '<rootDir>/tests/integration/backend/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    '<rootDir>/backend/src/**/*.js',
    '!<rootDir>/backend/src/index.js',
    '!<rootDir>/backend/src/scripts/**',
    '!<rootDir>/backend/src/config/**'
  ],
  coverageDirectory: '<rootDir>/backend/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Transform ignore patterns - allow ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(mongodb-memory-server)/)'
  ]
};