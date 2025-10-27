/**
 * Integration tests for meetings endpoints
 * Tests: GET /api/meetings, POST /api/meetings, GET /api/meetings/:id,
 *        PUT /api/meetings/:id, DELETE /api/meetings/:id
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
  testCandidates,
} from './test-utils';

describe('Meetings Endpoints Integration Tests', () => {
  let app: Express;
  let authToken: string;

  beforeAll(() => {
    app = createTestApp();
    authToken = generateTestToken({ userId: 1, email: 'hr@example.com', role: 'hr' });
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('GET /api/meetings', () => {
    it('should return paginated meetings list successfully', async () => {
      const meetings = [testMeetings.scheduled, testMeetings.completed];
      mockPrismaClient.meeting.findMany.mockResolvedValueOnce(meetings);
      mockPrismaClient.meeting.count.mockResolvedValueOnce(meetings.length);

      const response = await request(app)
        .get('/api/meetings')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('meetings');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.meetings).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });

      expect(mockPrismaClient.meeting.findMany).toHaveBeenCalled();
      expect(mockPrismaClient.meeting.count).toHaveBeenCalled();
    });

    it('should return empty array for no meetings', async () => {
      mockPrismaClient.meeting.findMany.mockResolvedValueOnce([]);
      mockPrismaClient.meeting.count.mockResolvedValueOnce(0);

      const response = await request(app)
        .get('/api/meetings')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.meetings).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const meetings = [testMeetings.scheduled];
      mockPrismaClient.meeting.findMany.mockResolvedValueOnce(meetings);
      mockPrismaClient.meeting.count.mockResolvedValueOnce(25);

      const response = await request(app)
        .get('/api/meetings')
        .query({ page: 2, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      });
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .query({ page: 1, pageSize: 10 })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', 'Bearer invalid_token')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/meetings')
        .query({ page: -1, pageSize: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid query parameters',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.meeting.findMany.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/meetings')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to fetch meetings',
      });
    });
  });

  describe('POST /api/meetings', () => {
    const createMeetingData = {
      title: 'New Technical Interview',
      startTime: '2024-12-15T10:00:00Z',
      endTime: '2024-12-15T11:00:00Z',
      location: 'Room B',
      meetingType: 'onsite',
      notes: 'First round technical screening',
      status: 'confirmed',
      candidateId: 1,
      participantIds: [2, 3],
    };

    it('should create a new meeting successfully', async () => {
      const newMeeting = {
        ...testMeetings.scheduled,
        id: 99,
        title: createMeetingData.title,
        startTime: new Date(createMeetingData.startTime),
        endTime: new Date(createMeetingData.endTime),
        location: createMeetingData.location,
        meetingType: createMeetingData.meetingType,
        notes: createMeetingData.notes,
        status: createMeetingData.status,
        candidateId: createMeetingData.candidateId,
      };

      mockPrismaClient.meeting.create.mockResolvedValueOnce(newMeeting);

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createMeetingData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject({
        title: createMeetingData.title,
        location: createMeetingData.location,
        meetingType: createMeetingData.meetingType,
        status: createMeetingData.status,
      });

      expect(mockPrismaClient.meeting.create).toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .send(createMeetingData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        title: 'Meeting',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
    });

    it('should return 400 for invalid meeting type', async () => {
      const invalidData = {
        ...createMeetingData,
        meetingType: 'invalid_type',
      };

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 400 for invalid date range (end before start)', async () => {
      const invalidData = {
        ...createMeetingData,
        startTime: '2024-12-15T11:00:00Z',
        endTime: '2024-12-15T10:00:00Z',
      };

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.meeting.create.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createMeetingData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to create meeting',
      });
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should return meeting by ID successfully', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);

      const response = await request(app)
        .get('/api/meetings/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testMeetings.scheduled.id,
        title: testMeetings.scheduled.title,
        meetingType: testMeetings.scheduled.meetingType,
      });

      expect(mockPrismaClient.meeting.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should return 404 for non-existent meeting', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/meetings/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Meeting not found',
      });
    });

    it('should return 400 for invalid meeting ID format', async () => {
      const response = await request(app)
        .get('/api/meetings/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid meeting ID',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/meetings/1')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.meeting.findUnique.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/meetings/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to fetch meeting',
      });
    });
  });

  describe('PUT /api/meetings/:id', () => {
    const updateData = {
      title: 'Updated Meeting Title',
      location: 'New Location',
      status: 'pending',
    };

    it('should update meeting successfully', async () => {
      const updatedMeeting = {
        ...testMeetings.scheduled,
        ...updateData,
      };

      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.meeting.update.mockResolvedValueOnce(updatedMeeting);

      const response = await request(app)
        .put('/api/meetings/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        title: updateData.title,
        location: updateData.location,
        status: updateData.status,
      });

      expect(mockPrismaClient.meeting.findUnique).toHaveBeenCalled();
      expect(mockPrismaClient.meeting.update).toHaveBeenCalled();
    });

    it('should return 404 for non-existent meeting', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .put('/api/meetings/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Meeting not found',
      });
      expect(mockPrismaClient.meeting.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid meeting ID', async () => {
      const response = await request(app)
        .put('/api/meetings/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid meeting ID',
      });
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        status: 'invalid_status',
      };

      const response = await request(app)
        .put('/api/meetings/1')
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
        .put('/api/meetings/1')
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.meeting.update.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/api/meetings/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to update meeting',
      });
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    it('should soft delete meeting successfully', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.meeting.update.mockResolvedValueOnce({
        ...testMeetings.scheduled,
        deletedAt: new Date(),
      });

      const response = await request(app)
        .delete('/api/meetings/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Meeting deleted successfully',
      });

      expect(mockPrismaClient.meeting.findUnique).toHaveBeenCalled();
      expect(mockPrismaClient.meeting.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should return 404 for non-existent meeting', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete('/api/meetings/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'NotFound',
        message: 'Meeting not found',
      });
      expect(mockPrismaClient.meeting.update).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid meeting ID', async () => {
      const response = await request(app)
        .delete('/api/meetings/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'Invalid meeting ID',
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/meetings/1')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.meeting.update.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .delete('/api/meetings/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to delete meeting',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests correctly', async () => {
      mockPrismaClient.meeting.findMany.mockResolvedValue([testMeetings.scheduled]);
      mockPrismaClient.meeting.count.mockResolvedValue(1);

      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/meetings')
            .query({ page: 1, pageSize: 10 })
            .set('Authorization', `Bearer ${authToken}`)
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('meetings');
      });
    });

    it('should handle large page sizes', async () => {
      mockPrismaClient.meeting.findMany.mockResolvedValueOnce([]);
      mockPrismaClient.meeting.count.mockResolvedValueOnce(0);

      const response = await request(app)
        .get('/api/meetings')
        .query({ page: 1, pageSize: 100 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.pageSize).toBe(100);
    });

    it('should handle special characters in meeting title', async () => {
      const meetingWithSpecialChars = {
        ...testMeetings.scheduled,
        title: 'Meeting with \'quotes\' and "double quotes" & symbols!',
      };

      mockPrismaClient.meeting.create.mockResolvedValueOnce(meetingWithSpecialChars);

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: meetingWithSpecialChars.title,
          startTime: '2024-12-15T10:00:00Z',
          endTime: '2024-12-15T11:00:00Z',
          location: 'Room A',
          meetingType: 'onsite',
          status: 'confirmed',
          candidateId: 1,
        })
        .expect(201);

      expect(response.body.title).toBe(meetingWithSpecialChars.title);
    });

    it('should handle meetings with multiple participants (GET /)', async () => {
      const meetingWithParticipants = {
        ...testMeetings.scheduled,
        interviewParticipants: [{ user: testUsers.manager }, { user: testUsers.staff }],
      };

      mockPrismaClient.meeting.findMany.mockResolvedValueOnce([meetingWithParticipants]);
      mockPrismaClient.meeting.count.mockResolvedValueOnce(1);

      const response = await request(app)
        .get('/api/meetings')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.meetings[0].participants).toHaveLength(2);
      expect(response.body.meetings[0].participants[0]).toMatchObject({
        id: testUsers.manager.id,
        name: testUsers.manager.name,
      });
    });

    it('should handle meetings with multiple participants (POST /)', async () => {
      const newMeetingWithParticipants = {
        ...testMeetings.scheduled,
        id: 99,
        interviewParticipants: [{ user: testUsers.manager }],
      };

      mockPrismaClient.meeting.create.mockResolvedValueOnce(newMeetingWithParticipants);

      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Team Interview',
          startTime: '2024-12-15T10:00:00Z',
          endTime: '2024-12-15T11:00:00Z',
          location: 'Room B',
          meetingType: 'onsite',
          status: 'confirmed',
          candidateId: 1,
          participantIds: [2],
        })
        .expect(201);

      expect(response.body.participants).toHaveLength(1);
    });

    it('should handle meetings with multiple participants (GET /:id)', async () => {
      const meetingWithParticipants = {
        ...testMeetings.scheduled,
        interviewParticipants: [{ user: testUsers.manager }, { user: testUsers.staff }],
      };

      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(meetingWithParticipants);

      const response = await request(app)
        .get('/api/meetings/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.participants).toHaveLength(2);
    });

    it('should handle meetings with multiple participants (PUT /:id)', async () => {
      const updatedMeetingWithParticipants = {
        ...testMeetings.scheduled,
        title: 'Updated Team Interview',
        interviewParticipants: [{ user: testUsers.manager }],
      };

      mockPrismaClient.meeting.findUnique.mockResolvedValueOnce(testMeetings.scheduled);
      mockPrismaClient.meeting.update.mockResolvedValueOnce(updatedMeetingWithParticipants);

      const response = await request(app)
        .put('/api/meetings/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Team Interview',
          participantIds: [2],
        })
        .expect(200);

      expect(response.body.participants).toHaveLength(1);
    });
  });
});
