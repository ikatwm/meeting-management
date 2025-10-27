// Create a persistent mock that survives module resets
const mockPrismaInstance = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

const mockPrismaConstructor = jest.fn(() => mockPrismaInstance);

// Mock PrismaClient before importing prisma module
jest.mock('@prisma/client', () => ({
  PrismaClient: mockPrismaConstructor,
}));

import { PrismaClient } from '@prisma/client';

describe('Prisma Singleton', () => {
  let originalNodeEnv: string | undefined;
  let originalGlobalPrisma: any;

  beforeEach(() => {
    // Store original values
    originalNodeEnv = process.env.NODE_ENV;
    originalGlobalPrisma = (globalThis as any).prisma;

    // Clean up global prisma BEFORE clearing mocks
    delete (globalThis as any).prisma;

    // Clear module cache to get fresh imports
    jest.resetModules();

    // Clear mock calls but keep mock implementation
    mockPrismaConstructor.mockClear();
  });

  afterEach(() => {
    // Restore original values
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    if (originalGlobalPrisma !== undefined) {
      (globalThis as any).prisma = originalGlobalPrisma;
    } else {
      delete (globalThis as any).prisma;
    }
  });

  it('should create a new PrismaClient instance', () => {
    const { prisma } = require('../prisma');

    expect(PrismaClient).toHaveBeenCalled();
    expect(prisma).toBeDefined();
  });

  it('should configure PrismaClient with development logging when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';

    require('../prisma');

    expect(PrismaClient).toHaveBeenCalledWith({
      log: ['query', 'error', 'warn'],
    });
  });

  it('should configure PrismaClient with error-only logging when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';

    require('../prisma');

    expect(PrismaClient).toHaveBeenCalledWith({
      log: ['error'],
    });
  });

  it('should configure PrismaClient with error-only logging when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';

    require('../prisma');

    expect(PrismaClient).toHaveBeenCalledWith({
      log: ['error'],
    });
  });

  it('should configure PrismaClient with error-only logging when NODE_ENV is not set', () => {
    delete process.env.NODE_ENV;

    require('../prisma');

    expect(PrismaClient).toHaveBeenCalledWith({
      log: ['error'],
    });
  });

  it('should reuse existing global prisma instance in non-production', () => {
    process.env.NODE_ENV = 'development';

    const mockExistingPrisma = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
    (globalThis as any).prisma = mockExistingPrisma;

    const { prisma } = require('../prisma');

    // Should not create a new instance
    expect(prisma).toBe(mockExistingPrisma);
  });

  it('should store prisma instance in global when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    delete (globalThis as any).prisma;

    const { prisma } = require('../prisma');

    expect((globalThis as any).prisma).toBe(prisma);
  });

  it('should store prisma instance in global when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    delete (globalThis as any).prisma;

    const { prisma } = require('../prisma');

    expect((globalThis as any).prisma).toBe(prisma);
  });

  it('should not store prisma instance in global when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    delete (globalThis as any).prisma;

    require('../prisma');

    expect((globalThis as any).prisma).toBeUndefined();
  });

  it('should export prisma as default export', () => {
    const prismaModule = require('../prisma');

    expect(prismaModule.default).toBeDefined();
    expect(prismaModule.default).toBe(prismaModule.prisma);
  });

  it('should export prisma as named export', () => {
    const { prisma } = require('../prisma');

    expect(prisma).toBeDefined();
  });

  it('should create singleton pattern - same instance on multiple imports in development', () => {
    process.env.NODE_ENV = 'development';

    const { prisma: prisma1 } = require('../prisma');
    const { prisma: prisma2 } = require('../prisma');

    expect(prisma1).toBe(prisma2);
  });
});
