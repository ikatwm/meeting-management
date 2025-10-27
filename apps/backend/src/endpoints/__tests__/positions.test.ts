/**
 * Integration tests for positions endpoints
 * Tests: GET /api/positions, GET /api/positions/applied
 */

const request = require('supertest');
import type { Express } from 'express';
import {
  createTestApp,
  generateTestToken,
  mockPrismaClient,
  resetMocks,
  testPositions,
} from './test-utils';

describe('Positions Endpoints Integration Tests', () => {
  let app: Express;
  let authToken: string;

  beforeAll(() => {
    app = createTestApp();
    authToken = generateTestToken({ userId: 1, email: 'hr@example.com', role: 'hr' });
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/positions', () => {
    it('should return all positions successfully', async () => {
      const positions = [
        { ...testPositions.developer, name: 'Software Developer' },
        { ...testPositions.manager, name: 'Project Manager' },
        { id: 3, name: 'Designer', createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      ];

      mockPrismaClient.position.findMany.mockResolvedValueOnce(positions);

      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0].name).toBe('Software Developer');

      expect(mockPrismaClient.position.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no positions exist', async () => {
      mockPrismaClient.position.findMany.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/positions')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.position.findMany.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to fetch positions',
      });
    });

    it('should work for different user roles (hr, manager, staff)', async () => {
      const positions = [testPositions.developer];
      mockPrismaClient.position.findMany.mockResolvedValue(positions);

      const roles = ['hr', 'manager', 'staff'] as const;

      for (const role of roles) {
        const token = generateTestToken({ userId: 1, email: `${role}@example.com`, role });
        const response = await request(app)
          .get('/api/positions')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      }
    });

    it('should not expose internal database fields', async () => {
      const positions = [
        {
          ...testPositions.developer,
          name: 'Software Developer',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          someInternalField: 'should not be exposed',
        },
      ];

      mockPrismaClient.position.findMany.mockResolvedValueOnce(positions);

      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).not.toHaveProperty('createdAt');
      expect(response.body[0]).not.toHaveProperty('updatedAt');
      expect(response.body[0]).not.toHaveProperty('deletedAt');
      expect(response.body[0]).not.toHaveProperty('someInternalField');
    });
  });

  describe('GET /api/positions/applied', () => {
    it('should return all applied positions successfully', async () => {
      const appliedPositions = [
        {
          id: 1,
          name: 'Senior Developer',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 2,
          name: 'Lead Engineer',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaClient.appliedPosition.findMany.mockResolvedValueOnce(appliedPositions);

      const response = await request(app)
        .get('/api/positions/applied')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0].name).toBe('Senior Developer');

      expect(mockPrismaClient.appliedPosition.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no applied positions exist', async () => {
      mockPrismaClient.appliedPosition.findMany.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/positions/applied')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/positions/applied')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/positions/applied')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.appliedPosition.findMany.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/positions/applied')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to fetch applied positions',
      });
    });

    it('should work for different user roles', async () => {
      const appliedPositions = [
        {
          id: 1,
          name: 'Position 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];
      mockPrismaClient.appliedPosition.findMany.mockResolvedValue(appliedPositions);

      const roles = ['hr', 'manager', 'staff'] as const;

      for (const role of roles) {
        const token = generateTestToken({ userId: 1, email: `${role}@example.com`, role });
        const response = await request(app)
          .get('/api/positions/applied')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      }
    });

    it('should not expose internal database fields', async () => {
      const appliedPositions = [
        {
          id: 1,
          name: 'Senior Developer',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          internalField: 'should not be exposed',
        },
      ];

      mockPrismaClient.appliedPosition.findMany.mockResolvedValueOnce(appliedPositions);

      const response = await request(app)
        .get('/api/positions/applied')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).not.toHaveProperty('createdAt');
      expect(response.body[0]).not.toHaveProperty('updatedAt');
      expect(response.body[0]).not.toHaveProperty('deletedAt');
      expect(response.body[0]).not.toHaveProperty('internalField');
    });
  });

  describe('Edge Cases', () => {
    it('should handle positions with special characters in names', async () => {
      const positions = [
        {
          id: 1,
          name: 'Senior C++ Developer & Team Lead (Ref: #2024-001)',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaClient.position.findMany.mockResolvedValueOnce(positions);

      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0].name).toBe('Senior C++ Developer & Team Lead (Ref: #2024-001)');
    });

    it('should handle concurrent requests to both endpoints', async () => {
      mockPrismaClient.position.findMany.mockResolvedValue([testPositions.developer]);
      mockPrismaClient.appliedPosition.findMany.mockResolvedValue([
        { id: 1, name: 'Position', createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      ]);

      const requests = [
        request(app).get('/api/positions').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/positions/applied').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/positions').set('Authorization', `Bearer ${authToken}`),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
      });
    });

    it('should handle very long position names', async () => {
      const longName = 'A'.repeat(500);
      const positions = [
        {
          id: 1,
          name: longName,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaClient.position.findMany.mockResolvedValueOnce(positions);

      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0].name).toBe(longName);
      expect(response.body[0].name.length).toBe(500);
    });

    it('should return consistent data types', async () => {
      const positions = [testPositions.developer, testPositions.manager];
      mockPrismaClient.position.findMany.mockResolvedValueOnce(positions);

      const response = await request(app)
        .get('/api/positions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.forEach((position: { id: unknown; name: unknown }) => {
        expect(typeof position.id).toBe('number');
        expect(typeof position.name).toBe('string');
      });
    });
  });
});
