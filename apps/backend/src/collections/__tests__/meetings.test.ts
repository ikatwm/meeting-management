import {
  createMeeting,
  findMeetings,
  findMeetingById,
  updateMeeting,
  softDeleteMeeting,
  hardDeleteMeeting,
} from '../meetings';
import prisma from '../../utilities/prisma';
import type { CreateMeetingRequest, UpdateMeetingRequest } from '../../utilities/types';

jest.mock('../../utilities/prisma', () => ({
  __esModule: true,
  default: {
    meeting: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Meetings Collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMeeting', () => {
    it('should create meeting with all fields including participants', async () => {
      const userId = 1;
      const meetingData: CreateMeetingRequest = {
        title: 'Technical Interview',
        startTime: '2025-11-01T10:00:00Z',
        endTime: '2025-11-01T11:00:00Z',
        location: 'Room 101',
        meetingType: 'onsite',
        notes: 'Interview for senior position',
        status: 'confirmed',
        candidateId: 5,
        participantIds: [2, 3],
      };

      const mockResult = {
        id: 1,
        title: 'Technical Interview',
        startTime: new Date('2025-11-01T10:00:00Z'),
        endTime: new Date('2025-11-01T11:00:00Z'),
        location: 'Room 101',
        meetingType: 'onsite',
        notes: 'Interview for senior position',
        status: 'confirmed',
        userId,
        candidateId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: 1, name: 'HR Manager', email: 'hr@example.com' },
        candidate: { id: 5, name: 'Jane Doe', email: 'jane@example.com' },
        interviewParticipants: [
          {
            id: 1,
            userId: 2,
            meetingId: 1,
            user: { id: 2, name: 'Tech Lead', email: 'tech@example.com' },
          },
          {
            id: 2,
            userId: 3,
            meetingId: 1,
            user: { id: 3, name: 'Senior Dev', email: 'dev@example.com' },
          },
        ],
      };

      (prisma.meeting.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createMeeting(userId, meetingData);

      expect(prisma.meeting.create).toHaveBeenCalledWith({
        data: {
          title: 'Technical Interview',
          startTime: new Date('2025-11-01T10:00:00Z'),
          endTime: new Date('2025-11-01T11:00:00Z'),
          location: 'Room 101',
          meetingType: 'onsite',
          notes: 'Interview for senior position',
          status: 'confirmed',
          userId,
          candidateId: 5,
          interviewParticipants: {
            create: [{ userId: 2 }, { userId: 3 }],
          },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          candidate: {
            select: { id: true, name: true, email: true },
          },
          interviewParticipants: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should create meeting without optional fields', async () => {
      const userId = 1;
      const meetingData: CreateMeetingRequest = {
        title: 'Quick Sync',
        startTime: '2025-11-02T14:00:00Z',
        endTime: '2025-11-02T14:30:00Z',
        meetingType: 'zoom',
        status: 'pending',
      };

      const mockResult = {
        id: 2,
        title: 'Quick Sync',
        startTime: new Date('2025-11-02T14:00:00Z'),
        endTime: new Date('2025-11-02T14:30:00Z'),
        location: null,
        meetingType: 'zoom',
        notes: null,
        status: 'pending',
        userId,
        candidateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: 1, name: 'HR Manager', email: 'hr@example.com' },
        candidate: null,
        interviewParticipants: [],
      };

      (prisma.meeting.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createMeeting(userId, meetingData);

      expect(result.location).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.candidateId).toBeNull();
      expect(result.interviewParticipants).toEqual([]);
    });

    it('should create meeting without participants', async () => {
      const userId = 1;
      const meetingData: CreateMeetingRequest = {
        title: 'Solo Meeting',
        startTime: '2025-11-03T09:00:00Z',
        endTime: '2025-11-03T10:00:00Z',
        meetingType: 'google_meet',
        status: 'confirmed',
      };

      const mockResult = {
        id: 3,
        ...meetingData,
        startTime: new Date(meetingData.startTime),
        endTime: new Date(meetingData.endTime),
        location: null,
        notes: null,
        userId,
        candidateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: 1, name: 'HR Manager', email: 'hr@example.com' },
        candidate: null,
        interviewParticipants: [],
      };

      (prisma.meeting.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createMeeting(userId, meetingData);

      expect(prisma.meeting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            interviewParticipants: undefined,
          }),
        })
      );
    });

    it('should handle all meeting types', async () => {
      const userId = 1;
      const types: Array<'onsite' | 'zoom' | 'google_meet'> = ['onsite', 'zoom', 'google_meet'];

      for (const type of types) {
        const meetingData: CreateMeetingRequest = {
          title: `${type} Meeting`,
          startTime: '2025-11-01T10:00:00Z',
          endTime: '2025-11-01T11:00:00Z',
          meetingType: type,
          status: 'confirmed',
        };

        const mockResult = {
          id: 1,
          ...meetingData,
          startTime: new Date(meetingData.startTime),
          endTime: new Date(meetingData.endTime),
          location: null,
          notes: null,
          userId,
          candidateId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { id: 1, name: 'HR', email: 'hr@example.com' },
          candidate: null,
          interviewParticipants: [],
        };

        (prisma.meeting.create as jest.Mock).mockResolvedValue(mockResult);

        const result = await createMeeting(userId, meetingData);
        expect(result.meetingType).toBe(type);
      }
    });

    it('should handle database error during creation', async () => {
      const userId = 1;
      const meetingData: CreateMeetingRequest = {
        title: 'Test Meeting',
        startTime: '2025-11-01T10:00:00Z',
        endTime: '2025-11-01T11:00:00Z',
        meetingType: 'zoom',
        status: 'confirmed',
      };

      const error = new Error('Foreign key constraint failed');
      (prisma.meeting.create as jest.Mock).mockRejectedValue(error);

      await expect(createMeeting(userId, meetingData)).rejects.toThrow(
        'Foreign key constraint failed'
      );
    });
  });

  describe('findMeetings', () => {
    it('should find meetings with pagination', async () => {
      const mockMeetings = [
        {
          id: 1,
          title: 'Meeting 1',
          startTime: new Date('2025-11-01T10:00:00Z'),
          endTime: new Date('2025-11-01T11:00:00Z'),
          location: null,
          meetingType: 'zoom',
          notes: null,
          status: 'confirmed',
          userId: 1,
          candidateId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          user: { id: 1, name: 'HR', email: 'hr@example.com' },
          candidate: null,
          interviewParticipants: [],
        },
      ];

      (prisma.meeting.findMany as jest.Mock).mockResolvedValue(mockMeetings);
      (prisma.meeting.count as jest.Mock).mockResolvedValue(1);

      const result = await findMeetings(1, 10);

      expect(prisma.meeting.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 10,
        orderBy: { startTime: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          candidate: { select: { id: true, name: true, email: true } },
          interviewParticipants: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      expect(result.meetings).toEqual(mockMeetings);
      expect(result.total).toBe(1);
    });

    it('should exclude soft-deleted meetings by default', async () => {
      const mockMeetings = [{ id: 1, deletedAt: null }];

      (prisma.meeting.findMany as jest.Mock).mockResolvedValue(mockMeetings);
      (prisma.meeting.count as jest.Mock).mockResolvedValue(1);

      await findMeetings(1, 10, false);

      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
        })
      );
    });

    it('should include soft-deleted meetings when requested', async () => {
      const mockMeetings = [
        { id: 1, deletedAt: null },
        { id: 2, deletedAt: new Date() },
      ];

      (prisma.meeting.findMany as jest.Mock).mockResolvedValue(mockMeetings);
      (prisma.meeting.count as jest.Mock).mockResolvedValue(2);

      await findMeetings(1, 10, true);

      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should handle pagination correctly', async () => {
      const mockMeetings = Array(10).fill({ id: 1 });

      (prisma.meeting.findMany as jest.Mock).mockResolvedValue(mockMeetings);
      (prisma.meeting.count as jest.Mock).mockResolvedValue(50);

      await findMeetings(3, 10);

      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });

    it('should return empty array when no meetings found', async () => {
      (prisma.meeting.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.meeting.count as jest.Mock).mockResolvedValue(0);

      const result = await findMeetings(1, 10);

      expect(result.meetings).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should order by startTime descending', async () => {
      const mockMeetings = [
        { id: 3, startTime: new Date('2025-11-03T10:00:00Z') },
        { id: 2, startTime: new Date('2025-11-02T10:00:00Z') },
        { id: 1, startTime: new Date('2025-11-01T10:00:00Z') },
      ];

      (prisma.meeting.findMany as jest.Mock).mockResolvedValue(mockMeetings);
      (prisma.meeting.count as jest.Mock).mockResolvedValue(3);

      const result = await findMeetings(1, 10);

      expect(result.meetings[0].startTime.getTime()).toBeGreaterThan(
        result.meetings[1].startTime.getTime()
      );
    });
  });

  describe('findMeetingById', () => {
    it('should find meeting by ID with all relations', async () => {
      const mockMeeting = {
        id: 1,
        title: 'Technical Interview',
        startTime: new Date('2025-11-01T10:00:00Z'),
        endTime: new Date('2025-11-01T11:00:00Z'),
        location: 'Room 101',
        meetingType: 'onsite',
        notes: 'Senior position',
        status: 'confirmed',
        userId: 1,
        candidateId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: 1, name: 'HR Manager', email: 'hr@example.com' },
        candidate: { id: 5, name: 'Jane Doe', email: 'jane@example.com' },
        interviewParticipants: [
          {
            id: 1,
            userId: 2,
            meetingId: 1,
            user: { id: 2, name: 'Tech Lead', email: 'tech@example.com' },
          },
        ],
      };

      (prisma.meeting.findUnique as jest.Mock).mockResolvedValue(mockMeeting);

      const result = await findMeetingById(1);

      expect(prisma.meeting.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: { select: { id: true, name: true, email: true } },
          candidate: { select: { id: true, name: true, email: true } },
          interviewParticipants: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      expect(result).toEqual(mockMeeting);
    });

    it('should return null when meeting not found', async () => {
      (prisma.meeting.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findMeetingById(999);

      expect(result).toBeNull();
    });

    it('should find soft-deleted meeting', async () => {
      const mockMeeting = {
        id: 1,
        title: 'Deleted Meeting',
        deletedAt: new Date(),
      };

      (prisma.meeting.findUnique as jest.Mock).mockResolvedValue(mockMeeting);

      const result = await findMeetingById(1);

      expect(result?.deletedAt).toBeDefined();
    });
  });

  describe('updateMeeting', () => {
    it('should update meeting with all fields', async () => {
      const updateData: UpdateMeetingRequest = {
        title: 'Updated Title',
        startTime: '2025-11-02T10:00:00Z',
        endTime: '2025-11-02T11:00:00Z',
        location: 'Room 202',
        meetingType: 'google_meet',
        notes: 'Updated notes',
        status: 'pending',
        candidateId: 6,
      };

      const mockResult = {
        id: 1,
        ...updateData,
        startTime: new Date(updateData.startTime!),
        endTime: new Date(updateData.endTime!),
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: 1, name: 'HR', email: 'hr@example.com' },
        candidate: { id: 6, name: 'John Doe', email: 'john@example.com' },
        interviewParticipants: [],
      };

      (prisma.meeting.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateMeeting(1, updateData);

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'Updated Title',
          location: 'Room 202',
          meetingType: 'google_meet',
          notes: 'Updated notes',
          status: 'pending',
          candidateId: 6,
          startTime: new Date('2025-11-02T10:00:00Z'),
          endTime: new Date('2025-11-02T11:00:00Z'),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          candidate: { select: { id: true, name: true, email: true } },
          interviewParticipants: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should update only specific fields', async () => {
      const updateData: UpdateMeetingRequest = {
        status: 'confirmed',
      };

      const mockResult = {
        id: 1,
        title: 'Original Title',
        startTime: new Date('2025-11-01T10:00:00Z'),
        endTime: new Date('2025-11-01T11:00:00Z'),
        location: 'Room 101',
        meetingType: 'zoom',
        notes: 'Original notes',
        status: 'confirmed',
        userId: 1,
        candidateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: 1, name: 'HR', email: 'hr@example.com' },
        candidate: null,
        interviewParticipants: [],
      };

      (prisma.meeting.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateMeeting(1, updateData);

      expect(result.status).toBe('confirmed');
      expect(result.title).toBe('Original Title');
    });

    it('should not update participantIds through this function', async () => {
      const updateData: UpdateMeetingRequest = {
        title: 'Updated',
        participantIds: [2, 3],
      };

      const mockResult = {
        id: 1,
        title: 'Updated',
        startTime: new Date(),
        endTime: new Date(),
        location: null,
        meetingType: 'zoom',
        notes: null,
        status: 'confirmed',
        userId: 1,
        candidateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        user: { id: 1, name: 'HR', email: 'hr@example.com' },
        candidate: null,
        interviewParticipants: [],
      };

      (prisma.meeting.update as jest.Mock).mockResolvedValue(mockResult);

      await updateMeeting(1, updateData);

      expect(prisma.meeting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            participantIds: expect.anything(),
          }),
        })
      );
    });

    it('should handle update of non-existent meeting', async () => {
      const updateData: UpdateMeetingRequest = { title: 'Updated' };
      const error = new Error('Record not found');

      (prisma.meeting.update as jest.Mock).mockRejectedValue(error);

      await expect(updateMeeting(999, updateData)).rejects.toThrow('Record not found');
    });
  });

  describe('softDeleteMeeting', () => {
    it('should soft delete meeting by setting deletedAt timestamp', async () => {
      const mockResult = {
        id: 1,
        title: 'Meeting to Delete',
        startTime: new Date(),
        endTime: new Date(),
        location: null,
        meetingType: 'zoom',
        notes: null,
        status: 'confirmed',
        userId: 1,
        candidateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      (prisma.meeting.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await softDeleteMeeting(1);

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).toBeDefined();
    });

    it('should handle soft delete of non-existent meeting', async () => {
      const error = new Error('Record not found');

      (prisma.meeting.update as jest.Mock).mockRejectedValue(error);

      await expect(softDeleteMeeting(999)).rejects.toThrow('Record not found');
    });

    it('should soft delete already deleted meeting', async () => {
      const mockResult = {
        id: 1,
        deletedAt: new Date(),
      };

      (prisma.meeting.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await softDeleteMeeting(1);

      expect(result.deletedAt).toBeDefined();
    });
  });

  describe('hardDeleteMeeting', () => {
    it('should permanently delete meeting', async () => {
      const mockResult = {
        id: 1,
        title: 'Deleted Meeting',
        startTime: new Date(),
        endTime: new Date(),
        location: null,
        meetingType: 'zoom',
        notes: null,
        status: 'confirmed',
        userId: 1,
        candidateId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (prisma.meeting.delete as jest.Mock).mockResolvedValue(mockResult);

      const result = await hardDeleteMeeting(1);

      expect(prisma.meeting.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle hard delete of non-existent meeting', async () => {
      const error = new Error('Record not found');

      (prisma.meeting.delete as jest.Mock).mockRejectedValue(error);

      await expect(hardDeleteMeeting(999)).rejects.toThrow('Record not found');
    });

    it('should handle cascade delete constraints', async () => {
      const error = new Error('Foreign key constraint failed');

      (prisma.meeting.delete as jest.Mock).mockRejectedValue(error);

      await expect(hardDeleteMeeting(1)).rejects.toThrow('Foreign key constraint failed');
    });
  });
});
