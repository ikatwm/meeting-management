/**
 * Integration tests for participants endpoints
 * Tests: POST /api/meetings/:meetingId/participants,
 *        DELETE /api/meetings/:meetingId/participants/:userId
 */

const request = require('supertest');
import type { Express } from 'express';
import {
  createTestApp,
  generateTestToken,
  mockPrismaClient,
  resetMocks,
  testMeetings,
  testUsers,
} from './test-utils';

describe('Participants Endpoints Integration Tests', () => {
  let app: Express;
  let authToken: string;

  beforeAll(() => {
    app = createTestApp();
    authToken = generateTestToken({ userId: 1, email: 'hr@example.com', role: 'hr' });
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/meetings/:meetingId/participants', () => {
    const addParticipantData = {
      userId: 2,
    };

    it('should add participant to meeting successfully', async () => {
      const participant = {
        id: 1,
        meetingId: 1,
        userId: 2,
        createdAt: new Date(),
        user: testUsers.manager,
      };

      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.interviewParticipant.create.mockResolvedValueOnce(participant);

      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addParticipantData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('meetingId', 1);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(2);

      expect(mockPrismaClient.meeting.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
      expect(mockPrismaClient.interviewParticipant.create).toHaveBeenCalled();
    });

    it('should return 404 if meeting does not exist', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/meetings/999/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addParticipantData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Meeting not found',
      });
      expect(mockPrismaClient.interviewParticipant.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid meeting ID', async () => {
      const response = await request(app)
        .post('/api/meetings/invalid/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addParticipantData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid meeting ID',
      });
    });

    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
    });

    it('should return 400 for invalid userId type', async () => {
      const invalidData = {
        userId: 'not-a-number',
      };

      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 400 if participant already exists', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.interviewParticipant.create.mockRejectedValueOnce({
        code: 'P2002',
        message: 'Unique constraint failed',
      });

      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addParticipantData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Participant already added to this meeting',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/meetings/1/participants')
        .send(addParticipantData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', 'Bearer invalid_token')
        .send(addParticipantData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.interviewParticipant.create.mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addParticipantData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to add participant',
      });
    });

    it('should allow multiple participants for the same meeting', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValue(testMeetings.scheduled);

      const participant1 = {
        id: 1,
        meetingId: 1,
        userId: 2,
        createdAt: new Date(),
        user: testUsers.manager,
      };

      const participant2 = {
        id: 2,
        meetingId: 1,
        userId: 3,
        createdAt: new Date(),
        user: testUsers.staff,
      };

      mockPrismaClient.interviewParticipant.create
        .mockResolvedValueOnce(participant1)
        .mockResolvedValueOnce(participant2);

      const response1 = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 2 })
        .expect(201);

      const response2 = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 3 })
        .expect(201);

      expect(response1.body.user.id).toBe(2);
      expect(response2.body.user.id).toBe(3);
    });
  });

  describe('DELETE /api/meetings/:meetingId/participants/:userId', () => {
    it('should remove participant from meeting successfully', async () => {
      mockPrismaClient.interviewParticipant.delete.mockResolvedValueOnce({
        id: 1,
        meetingId: 1,
        userId: 2,
        createdAt: new Date(),
      });

      const response = await request(app)
        .delete('/api/meetings/1/participants/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Participant removed successfully',
      });

      expect(mockPrismaClient.interviewParticipant.delete).toHaveBeenCalledWith({
        where: {
          meetingId_userId: {
            meetingId: 1,
            userId: 2,
          },
        },
      });
    });

    it('should return 404 if participant not found', async () => {
      mockPrismaClient.interviewParticipant.delete.mockRejectedValueOnce({
        code: 'P2025',
        message: 'Record to delete does not exist',
      });

      const response = await request(app)
        .delete('/api/meetings/1/participants/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Participant not found in this meeting',
      });
    });

    it('should return 400 for invalid meeting ID', async () => {
      const response = await request(app)
        .delete('/api/meetings/invalid/participants/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid meeting ID or user ID',
      });
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .delete('/api/meetings/1/participants/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid meeting ID or user ID',
      });
    });

    it('should return 400 for both invalid IDs', async () => {
      const response = await request(app)
        .delete('/api/meetings/invalid/participants/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid meeting ID or user ID',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/meetings/1/participants/2')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .delete('/api/meetings/1/participants/2')
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.interviewParticipant.delete.mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await request(app)
        .delete('/api/meetings/1/participants/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to remove participant',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle adding and removing the same participant', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.interviewParticipant.create.mockResolvedValueOnce({
        id: 1,
        meetingId: 1,
        userId: 2,
        createdAt: new Date(),
        user: testUsers.manager,
      });
      mockPrismaClient.interviewParticipant.delete.mockResolvedValueOnce({
        id: 1,
        meetingId: 1,
        userId: 2,
        createdAt: new Date(),
      });

      // Add participant
      const addResponse = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 2 })
        .expect(201);

      expect(addResponse.body.user.id).toBe(2);

      // Remove participant
      const removeResponse = await request(app)
        .delete('/api/meetings/1/participants/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(removeResponse.body.message).toBe('Participant removed successfully');
    });

    it('should handle concurrent participant additions', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValue(testMeetings.scheduled);
      mockPrismaClient.interviewParticipant.create.mockResolvedValue({
        id: 1,
        meetingId: 1,
        userId: 2,
        createdAt: new Date(),
        user: testUsers.manager,
      });

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/meetings/1/participants')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ userId: 2 })
        );

      const responses = await Promise.all(requests);

      // At least one should succeed
      const successfulResponses = responses.filter((r) => r.status === 201);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });

    it('should handle negative user IDs gracefully', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);

      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: -1 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should handle zero as user ID', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);

      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 0 })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should handle very large user IDs', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.interviewParticipant.create.mockResolvedValueOnce({
        id: 1,
        meetingId: 1,
        userId: 999999999,
        createdAt: new Date(),
        user: { ...testUsers.manager, id: 999999999 },
      });

      const response = await request(app)
        .post('/api/meetings/1/participants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 999999999 })
        .expect(201);

      expect(response.body.user.id).toBe(999999999);
    });

    it('should work for different user roles', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValue(testMeetings.scheduled);
      mockPrismaClient.interviewParticipant.create.mockResolvedValue({
        id: 1,
        meetingId: 1,
        userId: 2,
        createdAt: new Date(),
        user: testUsers.manager,
      });

      const roles = ['hr', 'manager', 'staff'] as const;

      for (const role of roles) {
        const token = generateTestToken({ userId: 1, email: `${role}@example.com`, role });
        const response = await request(app)
          .post('/api/meetings/1/participants')
          .set('Authorization', `Bearer ${token}`)
          .send({ userId: 2 });

        expect([201, 400]).toContain(response.status);
      }
    });
  });
});
