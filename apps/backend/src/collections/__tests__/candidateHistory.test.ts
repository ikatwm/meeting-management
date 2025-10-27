import { createCandidateHistory, findCandidateHistory } from '../candidateHistory';
import prisma from '../../utilities/prisma';
import type { CreateCandidateHistoryRequest } from '../../utilities/types';

jest.mock('../../utilities/prisma', () => ({
  __esModule: true,
  default: {
    candidateHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Candidate History Collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCandidateHistory', () => {
    it('should create candidate history with meeting reference', async () => {
      const candidateId = 1;
      const data: CreateCandidateHistoryRequest = {
        meetingId: 10,
        feedback: 'Excellent technical skills, good communication',
      };

      const mockResult = {
        id: 1,
        candidateId,
        meetingId: 10,
        feedback: 'Excellent technical skills, good communication',
        recordedAt: new Date('2025-10-28T10:00:00Z'),
        meeting: {
          id: 10,
          title: 'Technical Interview',
          startTime: new Date('2025-10-28T09:00:00Z'),
        },
      };

      (prisma.candidateHistory.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createCandidateHistory(candidateId, data);

      expect(prisma.candidateHistory.create).toHaveBeenCalledWith({
        data: {
          candidateId,
          meetingId: 10,
          feedback: 'Excellent technical skills, good communication',
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              startTime: true,
            },
          },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should create candidate history without meeting reference', async () => {
      const candidateId = 2;
      const data: CreateCandidateHistoryRequest = {
        feedback: 'General feedback without specific meeting',
      };

      const mockResult = {
        id: 2,
        candidateId,
        meetingId: null,
        feedback: 'General feedback without specific meeting',
        recordedAt: new Date('2025-10-28T11:00:00Z'),
        meeting: null,
      };

      (prisma.candidateHistory.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createCandidateHistory(candidateId, data);

      expect(prisma.candidateHistory.create).toHaveBeenCalledWith({
        data: {
          candidateId,
          meetingId: undefined,
          feedback: 'General feedback without specific meeting',
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              startTime: true,
            },
          },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle empty feedback string', async () => {
      const candidateId = 3;
      const data: CreateCandidateHistoryRequest = {
        meetingId: 11,
        feedback: '',
      };

      const mockResult = {
        id: 3,
        candidateId,
        meetingId: 11,
        feedback: '',
        recordedAt: new Date('2025-10-28T12:00:00Z'),
        meeting: {
          id: 11,
          title: 'Follow-up Interview',
          startTime: new Date('2025-10-28T11:00:00Z'),
        },
      };

      (prisma.candidateHistory.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createCandidateHistory(candidateId, data);

      expect(result.feedback).toBe('');
    });

    it('should handle long feedback text', async () => {
      const candidateId = 4;
      const longFeedback = 'A'.repeat(1000);
      const data: CreateCandidateHistoryRequest = {
        meetingId: 12,
        feedback: longFeedback,
      };

      const mockResult = {
        id: 4,
        candidateId,
        meetingId: 12,
        feedback: longFeedback,
        recordedAt: new Date('2025-10-28T13:00:00Z'),
        meeting: {
          id: 12,
          title: 'Final Interview',
          startTime: new Date('2025-10-28T12:00:00Z'),
        },
      };

      (prisma.candidateHistory.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createCandidateHistory(candidateId, data);

      expect(result.feedback).toBe(longFeedback);
      expect(result.feedback.length).toBe(1000);
    });

    it('should handle database error', async () => {
      const candidateId = 5;
      const data: CreateCandidateHistoryRequest = {
        meetingId: 13,
        feedback: 'Test feedback',
      };

      const error = new Error('Database connection failed');
      (prisma.candidateHistory.create as jest.Mock).mockRejectedValue(error);

      await expect(createCandidateHistory(candidateId, data)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findCandidateHistory', () => {
    it('should find all history records for a candidate', async () => {
      const candidateId = 1;
      const mockHistories = [
        {
          id: 1,
          candidateId,
          meetingId: 10,
          feedback: 'First interview feedback',
          recordedAt: new Date('2025-10-28T10:00:00Z'),
          meeting: {
            id: 10,
            title: 'Technical Interview',
            startTime: new Date('2025-10-28T09:00:00Z'),
          },
        },
        {
          id: 2,
          candidateId,
          meetingId: 11,
          feedback: 'Second interview feedback',
          recordedAt: new Date('2025-10-27T10:00:00Z'),
          meeting: {
            id: 11,
            title: 'HR Interview',
            startTime: new Date('2025-10-27T09:00:00Z'),
          },
        },
      ];

      (prisma.candidateHistory.findMany as jest.Mock).mockResolvedValue(mockHistories);

      const result = await findCandidateHistory(candidateId);

      expect(prisma.candidateHistory.findMany).toHaveBeenCalledWith({
        where: { candidateId },
        orderBy: { recordedAt: 'desc' },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              startTime: true,
            },
          },
        },
      });
      expect(result).toEqual(mockHistories);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when candidate has no history', async () => {
      const candidateId = 99;

      (prisma.candidateHistory.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findCandidateHistory(candidateId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return history records ordered by recordedAt descending', async () => {
      const candidateId = 2;
      const mockHistories = [
        {
          id: 3,
          candidateId,
          meetingId: null,
          feedback: 'Latest feedback',
          recordedAt: new Date('2025-10-28T15:00:00Z'),
          meeting: null,
        },
        {
          id: 2,
          candidateId,
          meetingId: 12,
          feedback: 'Middle feedback',
          recordedAt: new Date('2025-10-28T12:00:00Z'),
          meeting: {
            id: 12,
            title: 'Mid Interview',
            startTime: new Date('2025-10-28T11:00:00Z'),
          },
        },
        {
          id: 1,
          candidateId,
          meetingId: 11,
          feedback: 'Earliest feedback',
          recordedAt: new Date('2025-10-28T09:00:00Z'),
          meeting: {
            id: 11,
            title: 'First Interview',
            startTime: new Date('2025-10-28T08:00:00Z'),
          },
        },
      ];

      (prisma.candidateHistory.findMany as jest.Mock).mockResolvedValue(mockHistories);

      const result = await findCandidateHistory(candidateId);

      expect(result[0].recordedAt.getTime()).toBeGreaterThan(result[1].recordedAt.getTime());
      expect(result[1].recordedAt.getTime()).toBeGreaterThan(result[2].recordedAt.getTime());
    });

    it('should include meeting details when available', async () => {
      const candidateId = 3;
      const mockHistories = [
        {
          id: 1,
          candidateId,
          meetingId: 10,
          feedback: 'Feedback with meeting',
          recordedAt: new Date('2025-10-28T10:00:00Z'),
          meeting: {
            id: 10,
            title: 'Technical Interview',
            startTime: new Date('2025-10-28T09:00:00Z'),
          },
        },
      ];

      (prisma.candidateHistory.findMany as jest.Mock).mockResolvedValue(mockHistories);

      const result = await findCandidateHistory(candidateId);

      expect(result[0].meeting).toBeDefined();
      expect(result[0].meeting?.id).toBe(10);
      expect(result[0].meeting?.title).toBe('Technical Interview');
    });

    it('should handle null meeting when no meeting associated', async () => {
      const candidateId = 4;
      const mockHistories = [
        {
          id: 1,
          candidateId,
          meetingId: null,
          feedback: 'General feedback',
          recordedAt: new Date('2025-10-28T10:00:00Z'),
          meeting: null,
        },
      ];

      (prisma.candidateHistory.findMany as jest.Mock).mockResolvedValue(mockHistories);

      const result = await findCandidateHistory(candidateId);

      expect(result[0].meeting).toBeNull();
      expect(result[0].meetingId).toBeNull();
    });

    it('should handle database error', async () => {
      const candidateId = 5;
      const error = new Error('Database query failed');

      (prisma.candidateHistory.findMany as jest.Mock).mockRejectedValue(error);

      await expect(findCandidateHistory(candidateId)).rejects.toThrow('Database query failed');
    });

    it('should handle candidate ID as zero', async () => {
      const candidateId = 0;

      (prisma.candidateHistory.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findCandidateHistory(candidateId);

      expect(prisma.candidateHistory.findMany).toHaveBeenCalledWith({
        where: { candidateId: 0 },
        orderBy: { recordedAt: 'desc' },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              startTime: true,
            },
          },
        },
      });
      expect(result).toEqual([]);
    });

    it('should handle negative candidate ID', async () => {
      const candidateId = -1;

      (prisma.candidateHistory.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findCandidateHistory(candidateId);

      expect(result).toEqual([]);
    });
  });
});
