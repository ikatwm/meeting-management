/**
 * Integration tests for candidate history endpoints
 * Tests: GET /api/candidates/:candidateId/history,
 *        POST /api/candidates/:candidateId/history
 */

const request = require('supertest');
import type { Express } from 'express';
import {
  createTestApp,
  generateTestToken,
  mockPrismaClient,
  resetMocks,
  testCandidates,
  testMeetings,
} from './test-utils';

describe('Candidate History Endpoints Integration Tests', () => {
  let app: Express;
  let authToken: string;

  beforeAll(() => {
    app = createTestApp();
    authToken = generateTestToken({ userId: 1, email: 'hr@example.com', role: 'hr' });
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/candidates/:candidateId/history', () => {
    const historyItems = [
      {
        id: 1,
        candidateId: 1,
        meetingId: 1,
        feedback: 'Excellent technical skills',
        recordedAt: new Date('2024-01-15T10:00:00Z'),
        meeting: {
          id: 1,
          title: 'Technical Interview',
          startTime: new Date('2024-01-15T09:00:00Z'),
        },
      },
      {
        id: 2,
        candidateId: 1,
        meetingId: 2,
        feedback: 'Good communication skills',
        recordedAt: new Date('2024-01-20T14:00:00Z'),
        meeting: {
          id: 2,
          title: 'Final Interview',
          startTime: new Date('2024-01-20T13:00:00Z'),
        },
      },
    ];

    it('should return candidate history successfully', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.findMany.mockResolvedValueOnce(historyItems);

      const response = await request(app)
        .get('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: 1,
        candidateId: 1,
        meetingId: 1,
        feedback: 'Excellent technical skills',
      });
      expect(response.body[0]).toHaveProperty('recordedAt');
      expect(response.body[0]).toHaveProperty('meeting');
      expect(response.body[0].meeting).toMatchObject({
        id: 1,
        title: 'Technical Interview',
      });

      expect(mockPrismaClient.candidate.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
      expect(mockPrismaClient.candidateHistory.findMany).toHaveBeenCalledWith({
        where: { candidateId: 1 },
        include: expect.any(Object),
        orderBy: { recordedAt: 'desc' },
      });
    });

    it('should return empty array for candidate with no history', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.findMany.mockResolvedValueOnce([]);

      const response = await request(app)
        .get('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 404 for non-existent candidate', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/candidates/999/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      expect(mockPrismaClient.candidateHistory.findMany).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid candidate ID', async () => {
      const response = await request(app)
        .get('/api/candidates/invalid/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/candidates/1/history')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/candidates/1/history')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.findMany.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to fetch candidate history',
      });
    });

    it('should handle history items without associated meetings', async () => {
      const historyWithoutMeeting = [
        {
          id: 1,
          candidateId: 1,
          meetingId: null,
          feedback: 'Initial screening notes',
          recordedAt: new Date('2024-01-10T10:00:00Z'),
          meeting: null,
        },
      ];

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.findMany.mockResolvedValueOnce(historyWithoutMeeting);

      const response = await request(app)
        .get('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0].meeting).toBeNull();
    });
  });

  describe('POST /api/candidates/:candidateId/history', () => {
    const createHistoryData = {
      meetingId: 1,
      feedback: 'Strong problem-solving skills demonstrated',
    };

    it('should create candidate history successfully', async () => {
      const newHistoryItem = {
        id: 99,
        candidateId: 1,
        meetingId: 1,
        feedback: createHistoryData.feedback,
        recordedAt: new Date('2024-01-25T10:00:00Z'),
        meeting: {
          id: 1,
          title: 'Technical Interview',
          startTime: new Date('2024-01-25T09:00:00Z'),
        },
      };

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.create.mockResolvedValueOnce(newHistoryItem);

      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createHistoryData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject({
        candidateId: 1,
        meetingId: 1,
        feedback: createHistoryData.feedback,
      });
      expect(response.body).toHaveProperty('recordedAt');
      expect(response.body).toHaveProperty('meeting');

      expect(mockPrismaClient.candidateHistory.create).toHaveBeenCalled();
    });

    it('should create history without meetingId (general notes)', async () => {
      const generalNotesData = {
        feedback: 'Follow-up email sent to candidate',
      };

      const newHistoryItem = {
        id: 99,
        candidateId: 1,
        meetingId: null,
        feedback: generalNotesData.feedback,
        recordedAt: new Date('2024-01-25T10:00:00Z'),
        meeting: null,
      };

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.create.mockResolvedValueOnce(newHistoryItem);

      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generalNotesData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.meetingId).toBeNull();
      expect(response.body.meeting).toBeNull();
      expect(response.body.feedback).toBe(generalNotesData.feedback);
    });

    it('should return 404 for non-existent candidate', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/candidates/999/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createHistoryData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Candidate not found',
      });
      expect(mockPrismaClient.candidateHistory.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid candidate ID', async () => {
      const response = await request(app)
        .post('/api/candidates/invalid/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createHistoryData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid candidate ID',
      });
    });

    it('should return 400 for missing feedback', async () => {
      const invalidData = {
        meetingId: 1,
        // Missing feedback
      };

      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
    });

    it('should return 400 for empty feedback', async () => {
      const invalidData = {
        meetingId: 1,
        feedback: '',
      };

      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 400 for invalid meetingId type', async () => {
      const invalidData = {
        meetingId: 'not-a-number',
        feedback: 'Test feedback',
      };

      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/candidates/1/history')
        .send(createHistoryData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', 'Bearer invalid_token')
        .send(createHistoryData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.create.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createHistoryData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to create candidate history',
      });
    });

    it('should allow multiple history entries for the same candidate', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValue(testCandidates.interviewing);

      const history1 = {
        id: 1,
        candidateId: 1,
        meetingId: 1,
        feedback: 'First interview feedback',
        recordedAt: new Date(),
        meeting: testMeetings.scheduled,
      };

      const history2 = {
        id: 2,
        candidateId: 1,
        meetingId: 2,
        feedback: 'Second interview feedback',
        recordedAt: new Date(),
        meeting: testMeetings.completed,
      };

      mockPrismaClient.candidateHistory.create
        .mockResolvedValueOnce(history1)
        .mockResolvedValueOnce(history2);

      const response1 = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ meetingId: 1, feedback: 'First interview feedback' })
        .expect(201);

      const response2 = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ meetingId: 2, feedback: 'Second interview feedback' })
        .expect(201);

      expect(response1.body.feedback).toBe('First interview feedback');
      expect(response2.body.feedback).toBe('Second interview feedback');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long feedback text', async () => {
      const longFeedback = 'A'.repeat(5000);
      const historyData = {
        meetingId: 1,
        feedback: longFeedback,
      };

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.create.mockResolvedValueOnce({
        id: 1,
        candidateId: 1,
        meetingId: 1,
        feedback: longFeedback,
        recordedAt: new Date(),
        meeting: testMeetings.scheduled,
      });

      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(historyData)
        .expect(201);

      expect(response.body.feedback).toBe(longFeedback);
      expect(response.body.feedback.length).toBe(5000);
    });

    it('should handle feedback with special characters and newlines', async () => {
      const specialFeedback = `Candidate showed:
- Excellent communication skills
- Strong technical knowledge in C++/Java
- Good problem-solving approach (5/5 rating)
- "Very impressed" - Team Lead's comment`;

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.create.mockResolvedValueOnce({
        id: 1,
        candidateId: 1,
        meetingId: 1,
        feedback: specialFeedback,
        recordedAt: new Date(),
        meeting: testMeetings.scheduled,
      });

      const response = await request(app)
        .post('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ meetingId: 1, feedback: specialFeedback })
        .expect(201);

      expect(response.body.feedback).toBe(specialFeedback);
    });

    it('should work for different user roles', async () => {
      mockPrismaClient.candidate.findUnique.mockResolvedValue(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.create.mockResolvedValue({
        id: 1,
        candidateId: 1,
        meetingId: 1,
        feedback: 'Test feedback',
        recordedAt: new Date(),
        meeting: testMeetings.scheduled,
      });

      const roles = ['hr', 'manager', 'staff'] as const;

      for (const role of roles) {
        const token = generateTestToken({ userId: 1, email: `${role}@example.com`, role });
        const response = await request(app)
          .post('/api/candidates/1/history')
          .set('Authorization', `Bearer ${token}`)
          .send({ meetingId: 1, feedback: `Feedback from ${role}` });

        expect(response.status).toBe(201);
      }
    });

    it('should maintain chronological order when fetching history', async () => {
      const chronologicalHistory = [
        {
          id: 3,
          candidateId: 1,
          meetingId: 3,
          feedback: 'Most recent feedback',
          recordedAt: new Date('2024-01-25T10:00:00Z'),
          meeting: { id: 3, title: 'Meeting 3', startTime: new Date() },
        },
        {
          id: 2,
          candidateId: 1,
          meetingId: 2,
          feedback: 'Middle feedback',
          recordedAt: new Date('2024-01-20T10:00:00Z'),
          meeting: { id: 2, title: 'Meeting 2', startTime: new Date() },
        },
        {
          id: 1,
          candidateId: 1,
          meetingId: 1,
          feedback: 'Oldest feedback',
          recordedAt: new Date('2024-01-15T10:00:00Z'),
          meeting: { id: 1, title: 'Meeting 1', startTime: new Date() },
        },
      ];

      mockPrismaClient.candidate.findUnique.mockResolvedValueOnce(testCandidates.interviewing);
      mockPrismaClient.candidateHistory.findMany.mockResolvedValueOnce(chronologicalHistory);

      const response = await request(app)
        .get('/api/candidates/1/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body[0].feedback).toBe('Most recent feedback');
      expect(response.body[1].feedback).toBe('Middle feedback');
      expect(response.body[2].feedback).toBe('Oldest feedback');
    });
  });
});
