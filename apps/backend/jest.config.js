/** @type {import('jest').Config} */
const config = {
  displayName: 'backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/backend',
  coverageReporters: ['text', 'lcov', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
    '!src/test-setup.ts',
    '!src/__tests__/**',
    '!src/**/test-utils.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    // Exclude utility files from being run as tests
    '!**/__tests__/utils/**',
    '!**/test-utils.ts',
    '!**/test-setup.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],

  // Coverage thresholds (>80% for critical paths)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    // Critical paths require higher coverage
    './src/utilities/**/*.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/endpoints/**/*.ts': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test timeout configuration
  testTimeout: 10000,

  // Improve test output
  verbose: true,

  // Clear mocks automatically between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

module.exports = config;
