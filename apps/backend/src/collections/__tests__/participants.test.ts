import { addParticipant, removeParticipant, findParticipantsByMeetingId } from '../participants';
import prisma from '../../utilities/prisma';

jest.mock('../../utilities/prisma', () => ({
  __esModule: true,
  default: {
    interviewParticipant: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Participants Collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addParticipant', () => {
    it('should add participant to meeting', async () => {
      const meetingId = 1;
      const userId = 10;

      const mockResult = {
        id: 1,
        meetingId,
        userId,
        user: {
          id: userId,
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      (prisma.interviewParticipant.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await addParticipant(meetingId, userId);

      expect(prisma.interviewParticipant.create).toHaveBeenCalledWith({
        data: {
          meetingId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockResult);
      expect(result.user.id).toBe(userId);
    });

    it('should handle adding multiple participants to same meeting', async () => {
      const meetingId = 1;
      const userIds = [10, 11, 12];

      for (const userId of userIds) {
        const mockResult = {
          id: userId,
          meetingId,
          userId,
          user: {
            id: userId,
            name: `User ${userId}`,
            email: `user${userId}@example.com`,
          },
        };

        (prisma.interviewParticipant.create as jest.Mock).mockResolvedValue(mockResult);

        const result = await addParticipant(meetingId, userId);
        expect(result.userId).toBe(userId);
      }
    });

    it('should handle duplicate participant error', async () => {
      const meetingId = 1;
      const userId = 10;
      const error = new Error('Unique constraint violation');

      (prisma.interviewParticipant.create as jest.Mock).mockRejectedValue(error);

      await expect(addParticipant(meetingId, userId)).rejects.toThrow(
        'Unique constraint violation'
      );
    });

    it('should handle non-existent user ID', async () => {
      const meetingId = 1;
      const userId = 999;
      const error = new Error('Foreign key constraint failed');

      (prisma.interviewParticipant.create as jest.Mock).mockRejectedValue(error);

      await expect(addParticipant(meetingId, userId)).rejects.toThrow(
        'Foreign key constraint failed'
      );
    });

    it('should handle non-existent meeting ID', async () => {
      const meetingId = 999;
      const userId = 10;
      const error = new Error('Foreign key constraint failed');

      (prisma.interviewParticipant.create as jest.Mock).mockRejectedValue(error);

      await expect(addParticipant(meetingId, userId)).rejects.toThrow(
        'Foreign key constraint failed'
      );
    });

    it('should include user details in response', async () => {
      const meetingId = 1;
      const userId = 10;

      const mockResult = {
        id: 1,
        meetingId,
        userId,
        user: {
          id: userId,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
        },
      };

      (prisma.interviewParticipant.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await addParticipant(meetingId, userId);

      expect(result.user).toBeDefined();
      expect(result.user.name).toBe('Jane Smith');
      expect(result.user.email).toBe('jane.smith@example.com');
    });

    it('should handle zero meeting ID', async () => {
      const meetingId = 0;
      const userId = 10;
      const error = new Error('Invalid meeting ID');

      (prisma.interviewParticipant.create as jest.Mock).mockRejectedValue(error);

      await expect(addParticipant(meetingId, userId)).rejects.toThrow();
    });

    it('should handle negative user ID', async () => {
      const meetingId = 1;
      const userId = -1;
      const error = new Error('Invalid user ID');

      (prisma.interviewParticipant.create as jest.Mock).mockRejectedValue(error);

      await expect(addParticipant(meetingId, userId)).rejects.toThrow();
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant from meeting', async () => {
      const meetingId = 1;
      const userId = 10;

      const mockResult = {
        id: 1,
        meetingId,
        userId,
      };

      (prisma.interviewParticipant.delete as jest.Mock).mockResolvedValue(mockResult);

      const result = await removeParticipant(meetingId, userId);

      expect(prisma.interviewParticipant.delete).toHaveBeenCalledWith({
        where: {
          meetingId_userId: {
            meetingId,
            userId,
          },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle removing non-existent participant', async () => {
      const meetingId = 1;
      const userId = 999;
      const error = new Error('Record not found');

      (prisma.interviewParticipant.delete as jest.Mock).mockRejectedValue(error);

      await expect(removeParticipant(meetingId, userId)).rejects.toThrow('Record not found');
    });

    it('should handle removing participant from non-existent meeting', async () => {
      const meetingId = 999;
      const userId = 10;
      const error = new Error('Record not found');

      (prisma.interviewParticipant.delete as jest.Mock).mockRejectedValue(error);

      await expect(removeParticipant(meetingId, userId)).rejects.toThrow('Record not found');
    });

    it('should use composite key for deletion', async () => {
      const meetingId = 5;
      const userId = 15;

      const mockResult = {
        id: 10,
        meetingId,
        userId,
      };

      (prisma.interviewParticipant.delete as jest.Mock).mockResolvedValue(mockResult);

      await removeParticipant(meetingId, userId);

      expect(prisma.interviewParticipant.delete).toHaveBeenCalledWith({
        where: {
          meetingId_userId: {
            meetingId: 5,
            userId: 15,
          },
        },
      });
    });

    it('should handle database connection error', async () => {
      const meetingId = 1;
      const userId = 10;
      const error = new Error('Database connection failed');

      (prisma.interviewParticipant.delete as jest.Mock).mockRejectedValue(error);

      await expect(removeParticipant(meetingId, userId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle removing same participant twice', async () => {
      const meetingId = 1;
      const userId = 10;

      const mockResult = { id: 1, meetingId, userId };
      (prisma.interviewParticipant.delete as jest.Mock).mockResolvedValueOnce(mockResult);

      await removeParticipant(meetingId, userId);

      const error = new Error('Record not found');
      (prisma.interviewParticipant.delete as jest.Mock).mockRejectedValueOnce(error);

      await expect(removeParticipant(meetingId, userId)).rejects.toThrow('Record not found');
    });
  });

  describe('findParticipantsByMeetingId', () => {
    it('should find all participants for a meeting', async () => {
      const meetingId = 1;
      const mockParticipants = [
        {
          id: 1,
          meetingId,
          userId: 10,
          user: {
            id: 10,
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
        {
          id: 2,
          meetingId,
          userId: 11,
          user: {
            id: 11,
            name: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
      ];

      (prisma.interviewParticipant.findMany as jest.Mock).mockResolvedValue(mockParticipants);

      const result = await findParticipantsByMeetingId(meetingId);

      expect(prisma.interviewParticipant.findMany).toHaveBeenCalledWith({
        where: { meetingId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockParticipants);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when meeting has no participants', async () => {
      const meetingId = 99;

      (prisma.interviewParticipant.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findParticipantsByMeetingId(meetingId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should include user details for each participant', async () => {
      const meetingId = 1;
      const mockParticipants = [
        {
          id: 1,
          meetingId,
          userId: 10,
          user: {
            id: 10,
            name: 'Alice Johnson',
            email: 'alice@example.com',
          },
        },
      ];

      (prisma.interviewParticipant.findMany as jest.Mock).mockResolvedValue(mockParticipants);

      const result = await findParticipantsByMeetingId(meetingId);

      expect(result[0].user).toBeDefined();
      expect(result[0].user.name).toBe('Alice Johnson');
      expect(result[0].user.email).toBe('alice@example.com');
    });

    it('should handle meeting with single participant', async () => {
      const meetingId = 2;
      const mockParticipants = [
        {
          id: 5,
          meetingId,
          userId: 20,
          user: {
            id: 20,
            name: 'Solo Participant',
            email: 'solo@example.com',
          },
        },
      ];

      (prisma.interviewParticipant.findMany as jest.Mock).mockResolvedValue(mockParticipants);

      const result = await findParticipantsByMeetingId(meetingId);

      expect(result).toHaveLength(1);
      expect(result[0].user.name).toBe('Solo Participant');
    });

    it('should handle meeting with many participants', async () => {
      const meetingId = 3;
      const mockParticipants = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        meetingId,
        userId: i + 10,
        user: {
          id: i + 10,
          name: `User ${i + 10}`,
          email: `user${i + 10}@example.com`,
        },
      }));

      (prisma.interviewParticipant.findMany as jest.Mock).mockResolvedValue(mockParticipants);

      const result = await findParticipantsByMeetingId(meetingId);

      expect(result).toHaveLength(10);
      expect(result[0].user.name).toBe('User 10');
      expect(result[9].user.name).toBe('User 19');
    });

    it('should handle database error', async () => {
      const meetingId = 1;
      const error = new Error('Database query failed');

      (prisma.interviewParticipant.findMany as jest.Mock).mockRejectedValue(error);

      await expect(findParticipantsByMeetingId(meetingId)).rejects.toThrow('Database query failed');
    });

    it('should handle zero meeting ID', async () => {
      const meetingId = 0;

      (prisma.interviewParticipant.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findParticipantsByMeetingId(meetingId);

      expect(prisma.interviewParticipant.findMany).toHaveBeenCalledWith({
        where: { meetingId: 0 },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual([]);
    });

    it('should handle negative meeting ID', async () => {
      const meetingId = -1;

      (prisma.interviewParticipant.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findParticipantsByMeetingId(meetingId);

      expect(result).toEqual([]);
    });
  });
});
