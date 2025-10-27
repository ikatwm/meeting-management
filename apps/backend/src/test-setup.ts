/**
 * Global Jest Test Setup
 * This file runs before each test suite to configure the test environment
 */

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock jsonwebtoken module globally
jest.mock('jsonwebtoken', () => {
  return {
    __esModule: true,
    default: {
      sign: (payload: unknown, secret: string, options?: unknown) => {
        // Create a base64-encoded mock JWT with 3 parts (header.payload.signature)
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
        const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
        const signature = Buffer.from('mock-signature-' + secret).toString('base64');
        return `${header}.${payloadStr}.${signature}`;
      },
      verify: (token: string, secret: string) => {
        // Handle special test tokens
        if (token === 'invalid-token') {
          const error = new Error('Invalid token') as any;
          error.name = 'JsonWebTokenError';
          throw error;
        }
        if (token === 'expired-token') {
          const error = new Error('Token expired') as any;
          error.name = 'TokenExpiredError';
          throw error;
        }

        // Parse mock JWT format
        const parts = token.split('.');
        if (parts.length !== 3) {
          const error = new Error('jwt malformed') as any;
          error.name = 'JsonWebTokenError';
          throw error;
        }

        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          return payload;
        } catch {
          const error = new Error('Invalid token') as any;
          error.name = 'JsonWebTokenError';
          throw error;
        }
      },
    },
    sign: (payload: unknown, secret: string, options?: unknown) => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
      const signature = Buffer.from('mock-signature-' + secret).toString('base64');
      return `${header}.${payloadStr}.${signature}`;
    },
    verify: (token: string, secret: string) => {
      if (token === 'invalid-token') {
        const error = new Error('Invalid token') as any;
        error.name = 'JsonWebTokenError';
        throw error;
      }
      if (token === 'expired-token') {
        const error = new Error('Token expired') as any;
        error.name = 'TokenExpiredError';
        throw error;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        const error = new Error('jwt malformed') as any;
        error.name = 'JsonWebTokenError';
        throw error;
      }

      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        return payload;
      } catch {
        const error = new Error('Invalid token') as any;
        error.name = 'JsonWebTokenError';
        throw error;
      }
    },
    JsonWebTokenError: class JsonWebTokenError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'JsonWebTokenError';
      }
    },
    TokenExpiredError: class TokenExpiredError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'TokenExpiredError';
      }
    },
  };
});

// Mock bcrypt module globally
// Use a counter to generate different hashes for the same password (salt simulation)
jest.mock('bcryptjs', () => {
  let counter = 0;
  return {
    __esModule: true,
    default: {
      hash: async (password: string, rounds: number) => {
        counter++;
        return `$2a$${rounds}$salt${counter}$hashed_${password}`;
      },
      compare: async (password: string, hash: string) => {
        const match = hash.match(/\$hashed_(.+)$/);
        if (!match) return false;
        return match[1] === password;
      },
    },
    hash: async (password: string, rounds: number) => {
      counter++;
      return `$2a$${rounds}$salt${counter}$hashed_${password}`;
    },
    compare: async (password: string, hash: string) => {
      const match = hash.match(/\$hashed_(.+)$/);
      if (!match) return false;
      return match[1] === password;
    },
  };
});

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console.error and console.warn during tests
  // unless they contain specific keywords we care about
  console.error = (...args: unknown[]) => {
    const message = String(args[0]);
    if (message.includes('Error') || message.includes('Failed')) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0]);
    if (message.includes('Warning') || message.includes('Deprecated')) {
      originalConsoleWarn(...args);
    }
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Increase timeout for integration tests
jest.setTimeout(10000);

// Add custom matchers or global test utilities here
// Example: expect.extend({ toBeValidToken: () => {...} })
