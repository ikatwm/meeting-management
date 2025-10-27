/**
 * Integration tests for candidates endpoints
 * Tests: GET /api/candidates, POST /api/candidates, GET /api/candidates/:id,
 *        PUT /api/candidates/:id, DELETE /api/candidates/:id
 */

const request = require('supertest');
import type { Express } from 'express';
import {
  createTestApp,
  generateTestToken,
  mockPrismaClient,
  resetMocks,
  testCandidates,
  testPositions,
} from './test-utils';

describe('Candidates Endpoints Integration Tests', () => {
  let app: Express;
  let authToken: string;

  beforeAll(() => {
    app = createTestApp();
    authToken = generateTestToken({ userId: 1, email: 'hr@example.com', role: 'hr' });
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/candidates', () => {
    it('should return paginated candidates list successfully', async () => {
      const candidates = [
        { ...testCandidates.interviewing, appliedPosition: testPositions.developer },
        { ...testCandidates.hired, appliedPosition: testPositions.manager },
      ];

      mockPrismaClient.candidate.findMany.mockResolvedValueOnce(candidates);
      mockPrismaClient.candidate.count.mockResolvedValueOnce(candidates.length);

      const response = await request(app)
        .get('/api/candidates')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('candidates');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.candidates).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });
    });

    it('should filter candidates by search query', async () => {
      const candidates = [testCandidates.interviewing];
      mockPrismaClient.candidate.findMany.mockResolvedValueOnce(candidates);
      mockPrismaClient.candidate.count.mockResolvedValueOnce(1);

      const response = await request(app)
        .get('/api/candidates')
        .query({ page: 1, pageSize: 10, search: 'John' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.candidates).toHaveLength(1);
      expect(mockPrismaClient.candidate.findMany).toHaveBeenCalled();
    });

    it('should filter candidates by status', async () => {
      const candidates = [testCandidates.hired];
      mockPrismaClient.candidate.findMany.mockResolvedValueOnce(candidates);
      mockPrismaClient.candidate.count.mockResolvedValueOnce(1);

      const response = await request(app)
        .get('/api/candidates')
        .query({ page: 1, pageSize: 10, status: 'hired' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.candidates).toHaveLength(1);
      expect(response.body.candidates[0].status).toBe('hired');
    });

    it('should return empty array for no candidates', async () => {
      mockPrismaClient.candidate.findMany.mockResolvedValueOnce([]);
      mockPrismaClient.candidate.count.mockResolvedValueOnce(0);

      const response = await request(app)
        .get('/api/candidates')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.candidates).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/candidates')
        .query({ page: 1, pageSize: 10 })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.candidate.findMany.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/candidates')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to fetch candidates',
      });
    });
  });

  describe('POST /api/candidates', () => {
    const createCandidateData = {
      name: 'New Candidate',
      email: 'newcandidate@example.com',
      phone: '1234567890',
      appliedPositionId: 1,
      status: 'applied',
      interviewNotes: 'Initial application',
    };

    it('should create a new candidate successfully', async () => {
      const newCandidate = {
        ...testCandidates.interviewing,
        id: 99,
        name: createCandidateData.name,
        email: createCandidateData.email,
        status: createCandidateData.status,
        appliedPositionId: createCandidateData.appliedPositionId,
        appliedPosition: testPositions.developer,
      };

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.candidate.create.mockResolvedValueOnce(newCandidate);

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createCandidateData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject({
        name: createCandidateData.name,
        email: createCandidateData.email,
        status: createCandidateData.status,
      });

      expect(mockPrismaClient.candidate.create).toHaveBeenCalled();
    });

    it('should return 400 if candidate email already exists', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createCandidateData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Candidate with this email already exists',
      });
      expect(mockPrismaClient.candidate.create).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        name: 'Test Candidate',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...createCandidateData,
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 400 for invalid status', async () => {
      const invalidData = {
        ...createCandidateData,
        status: 'invalid_status',
      };

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/candidates')
        .send(createCandidateData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.candidate.create.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/candidates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createCandidateData)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to create candidate',
      });
    });
  });

  describe('GET /api/candidates/:id', () => {
    it('should return candidate by ID successfully', async () => {
      const candidateWithPosition = {
        ...testCandidates.interviewing,
        appliedPosition: testPositions.developer,
      };

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(candidateWithPosition);

      const response = await request(app)
        .get('/api/candidates/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testCandidates.interviewing.id,
        name: testCandidates.interviewing.name,
        email: testCandidates.interviewing.email,
      });

      expect(mockPrismaClient.candidate.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should return 404 for non-existent candidate', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/candidates/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Candidate not found',
      });
    });

    it('should return 400 for invalid candidate ID format', async () => {
      const response = await request(app)
        .get('/api/candidates/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/candidates/1').expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.candidate.findUnique.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/candidates/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to fetch candidate',
      });
    });
  });

  describe('PUT /api/candidates/:id', () => {
    const updateData = {
      name: 'Updated Name',
      status: 'hired',
      interviewNotes: 'Excellent candidate, hired!',
    };

    it('should update candidate successfully', async () => {
      const updatedCandidate = {
        ...testCandidates.interviewing,
        ...updateData,
        appliedPosition: testPositions.developer,
      };

      mockPrismaClient.candidate.findUnique
        .mockResolvedValueOnce(testCandidates.interviewing)
        .mockResolvedValueOnce(null); // Check for email uniqueness
      mockPrismaClient.candidate.update.mockResolvedValueOnce(updatedCandidate);

      const response = await request(app)
        .put('/api/candidates/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: updateData.name,
        status: updateData.status,
      });

      expect(mockPrismaClient.candidate.update).toHaveBeenCalled();
    });

    it('should return 404 for non-existent candidate', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .put('/api/candidates/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      expect(mockPrismaClient.candidate.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid candidate ID', async () => {
      const response = await request(app)
        .put('/api/candidates/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        status: 'invalid_status',
      };

      const response = await request(app)
        .put('/api/candidates/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).put('/api/candidates/1').send(updateData).expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidate.update.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/api/candidates/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to update candidate',
      });
    });
  });

  describe('DELETE /api/candidates/:id', () => {
    it('should delete candidate successfully', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidate.delete.mockResolvedValueOnce(testCandidates.interviewing);

      const response = await request(app)
        .delete('/api/candidates/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Candidate deleted successfully',
      });

      expect(mockPrismaClient.candidate.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return 404 for non-existent candidate', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete('/api/candidates/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      expect(mockPrismaClient.candidate.delete).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid candidate ID', async () => {
      const response = await request(app)
        .delete('/api/candidates/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).delete('/api/candidates/1').expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidate.delete.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete('/api/candidates/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to delete candidate',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle candidates with missing optional fields', async () => {
      const candidateWithoutNotes = {
        ...testCandidates.interviewing,
        interviewNotes: null,
        appliedPosition: testPositions.developer,
      };

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(candidateWithoutNotes);

      const response = await request(app)
        .get('/api/candidates/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.interviewNotes).toBeNull();
    });

    it('should handle search with special characters', async () => {
      mockPrismaClient.candidate.findMany.mockResolvedValueOnce([]);
      mockPrismaClient.candidate.count.mockResolvedValueOnce(0);

      const response = await request(app)
        .get('/api/candidates')
        .query({ page: 1, pageSize: 10, search: "O'Brien" })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.candidates).toEqual([]);
    });

    it('should handle concurrent candidate creation attempts', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValue(null);
      mockPrismaClient.candidate.create.mockResolvedValue({
        ...testCandidates.interviewing,
        id: 100,
      });

      const createData = {
        name: 'Concurrent Candidate',
        email: 'concurrent@example.com',
        appliedPositionId: 1,
        status: 'applied',
      };

      const requests = Array(3)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/candidates')
            .set('Authorization', `Bearer ${authToken}`)
            .send(createData)
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([201, 400]).toContain(response.status);
      });
    });
  });
});
