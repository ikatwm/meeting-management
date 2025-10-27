/**
 * Database Test Helpers
 * Provides utilities for mocking Prisma client and managing test database state
 */

import type { PrismaClient } from '@prisma/client';

/**
 * Type for mocked Prisma client
 */
export type MockPrismaClient = {
  [K in keyof PrismaClient]: PrismaClient[K] extends object
    ? {
        [M in keyof PrismaClient[K]]: jest.Mock;
      }
    : jest.Mock;
};

/**
 * Mock Prisma Client for testing
 * Use this in tests that need to mock database operations
 *
 * @example
 * ```typescript
 * import { mockPrisma } from './__tests__/utils/database.helpers';
 *
 * jest.mock('./utilities/prisma', () => ({
 *   prisma: mockPrisma,
 * }));
 *
 * describe('User Service', () => {
 *   it('should find user by id', async () => {
 *     mockPrisma.user.findUnique.mockResolvedValue({
 *       id: 1,
 *       email: 'test@example.com',
 *       name: 'Test User',
 *       // ... other fields
 *     });
 *
 *     const user = await findUserById(1);
 *     expect(user).toBeDefined();
 *   });
 * });
 * ```
 */
export const createMockPrisma = (): MockPrismaClient => {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    meeting: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    candidate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    position: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    appliedPosition: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    interviewParticipant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    candidateHistory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  } as unknown as MockPrismaClient;
};

/**
 * Reset all Prisma mocks between tests
 * Call this in beforeEach or afterEach to ensure clean state
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   resetPrismaMocks(mockPrisma);
 * });
 * ```
 */
export const resetPrismaMocks = (prisma: MockPrismaClient): void => {
  Object.keys(prisma).forEach((key) => {
    const model = prisma[key as keyof typeof prisma];
    if (model && typeof model === 'object') {
      Object.keys(model).forEach((method) => {
        const fn = model[method as keyof typeof model];
        if (typeof fn === 'function' && 'mockClear' in fn) {
          (fn as jest.Mock).mockClear();
        }
      });
    }
  });
};

/**
 * Database transaction helper for testing
 * Simulates Prisma transactions in tests
 *
 * @example
 * ```typescript
 * mockPrisma.$transaction.mockImplementation(mockTransaction(async (tx) => {
 *   // Transaction operations
 *   return result;
 * }));
 * ```
 */
export const mockTransaction =
  <T>(callback: (tx: MockPrismaClient) => Promise<T>) =>
  async (operations: unknown): Promise<T> => {
    if (typeof operations === 'function') {
      const mockTx = createMockPrisma();
      return operations(mockTx);
    }
    return callback(createMockPrisma());
  };

/**
 * Helper to mock database errors
 *
 * @example
 * ```typescript
 * mockPrisma.user.findUnique.mockRejectedValue(
 *   mockDatabaseError('P2025', 'Record not found')
 * );
 * ```
 */
export const mockDatabaseError = (code: string, message: string): Error => {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
};

/**
 * Common Prisma error codes for testing
 */
export const PrismaErrorCodes = {
  UNIQUE_CONSTRAINT: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
  FOREIGN_KEY_CONSTRAINT: 'P2003',
  REQUIRED_FIELD_MISSING: 'P2011',
  DEPENDENT_RECORDS_EXIST: 'P2014',
} as const;
