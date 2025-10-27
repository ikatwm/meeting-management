/**
 * Test utilities for integration testing
 * Provides mock Prisma client, test app, and authentication helpers
 */

import type { Express } from 'express';
import { generateToken } from '../../utilities/jwt';
import type { JwtPayload } from '../../utilities/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

/**
 * Mock Prisma Client for testing
 * Provides Jest mock implementations for all Prisma operations
 * Note: Prisma model names are singular in the client (user, meeting, candidate, etc.)
 */
export const mockPrismaClient: any = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  meeting: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  candidate: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  position: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  appliedPosition: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  interviewParticipant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  candidateHistory: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((callback: any): any => callback(mockPrismaClient)),
};

/**
 * Mock Prisma module to prevent real database operations
 */
jest.mock('../../utilities/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
  prisma: mockPrismaClient,
}));

/**
 * Create test Express app with all routes and middleware
 */
export function createTestApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Import routes (must be after mocking prisma)
  const authRoutes = require('../../endpoints/auth').default;
  const meetingsRoutes = require('../../endpoints/meetings').default;
  const candidatesRoutes = require('../../endpoints/candidates').default;
  const positionsRoutes = require('../../endpoints/positions').default;
  const participantsRoutes = require('../../endpoints/participants').default;
  const candidateHistoryRoutes = require('../../endpoints/candidateHistory').default;

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/meetings', meetingsRoutes);
  app.use('/api/candidates', candidatesRoutes);
  app.use('/api/positions', positionsRoutes);
  app.use('/api/meetings', participantsRoutes);
  app.use('/api/candidates', candidateHistoryRoutes);

  return app;
}

/**
 * Generate a valid JWT token for testing authenticated endpoints
 */
export function generateTestToken(payload?: Partial<JwtPayload>): string {
  const defaultPayload: JwtPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'hr',
    ...payload,
  };
  return generateToken(defaultPayload);
}

/**
 * Test user data fixtures
 */
export const testUsers = {
  hr: {
    id: 1,
    name: 'HR Manager',
    email: 'hr@example.com',
    role: 'hr',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
    positionId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    lastLogin: new Date('2024-01-01'),
  },
  manager: {
    id: 2,
    name: 'Manager',
    email: 'manager@example.com',
    role: 'manager',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
    positionId: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    lastLogin: new Date('2024-01-01'),
  },
  staff: {
    id: 3,
    name: 'Staff',
    email: 'staff@example.com',
    role: 'staff',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
    positionId: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    lastLogin: new Date('2024-01-01'),
  },
};

/**
 * Test meeting data fixtures
 */
export const testMeetings = {
  scheduled: {
    id: 1,
    title: 'Technical Interview',
    startTime: new Date('2024-12-01T10:00:00Z'),
    endTime: new Date('2024-12-01T11:00:00Z'),
    location: 'Meeting Room A',
    meetingType: 'onsite',
    notes: 'Technical screening interview',
    status: 'confirmed',
    userId: 1,
    candidateId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    user: testUsers.hr,
    candidate: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      status: 'interview',
      appliedPositionId: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      deletedAt: null,
    },
    interviewParticipants: [],
  },
  completed: {
    id: 2,
    title: 'Final Interview',
    startTime: new Date('2024-11-15T14:00:00Z'),
    endTime: new Date('2024-11-15T15:00:00Z'),
    location: 'Conference Room',
    meetingType: 'zoom',
    notes: 'Final interview round',
    status: 'confirmed',
    userId: 2,
    candidateId: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    user: testUsers.manager,
    candidate: {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321',
      status: 'hired',
      appliedPositionId: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      deletedAt: null,
    },
    interviewParticipants: [],
  },
};

/**
 * Test candidate data fixtures
 */
export const testCandidates = {
  interviewing: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    status: 'interview',
    appliedPositionId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
  hired: {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    status: 'hired',
    appliedPositionId: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
};

/**
 * Test position data fixtures
 */
export const testPositions = {
  developer: {
    id: 1,
    name: 'Software Developer',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
  manager: {
    id: 2,
    name: 'Project Manager',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  },
};

/**
 * Reset all mock functions before each test
 */
export function resetMocks(): void {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          method.mockReset();
        }
      });
    }
  });
}

/**
 * Setup common mock implementations for successful operations
 */
export function setupSuccessfulMocks(): void {
  mockPrismaClient.user.findUnique.mockResolvedValue(testUsers.hr);
  mockPrismaClient.user.create.mockResolvedValue(testUsers.hr);
  mockPrismaClient.user.update.mockResolvedValue(testUsers.hr);

  mockPrismaClient.meeting.findMany.mockResolvedValue([testMeetings.scheduled]);
  mockPrismaClient.meeting.count.mockResolvedValue(1);
  mockPrismaClient.meeting.findUnique.mockResolvedValue(testMeetings.scheduled);
  mockPrismaClient.meeting.create.mockResolvedValue(testMeetings.scheduled);
  mockPrismaClient.meeting.update.mockResolvedValue(testMeetings.scheduled);

  mockPrismaClient.candidate.findMany.mockResolvedValue([testCandidates.interviewing]);
  mockPrismaClient.candidate.findUnique.mockResolvedValue(testCandidates.interviewing);
  mockPrismaClient.candidate.create.mockResolvedValue(testCandidates.interviewing);
  mockPrismaClient.candidate.update.mockResolvedValue(testCandidates.interviewing);

  mockPrismaClient.position.findMany.mockResolvedValue([testPositions.developer]);
  mockPrismaClient.position.findUnique.mockResolvedValue(testPositions.developer);
}
