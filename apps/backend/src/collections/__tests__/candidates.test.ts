import {
  createCandidate,
  findCandidates,
  findCandidateById,
  updateCandidate,
  deleteCandidate,
  findCandidateByEmail,
} from '../candidates';
import prisma from '../../utilities/prisma';
import type { CreateCandidateRequest, UpdateCandidateRequest } from '../../utilities/types';

jest.mock('../../utilities/prisma', () => ({
  __esModule: true,
  default: {
    candidate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Candidates Collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCandidate', () => {
    it('should create a candidate with all fields', async () => {
      const data: CreateCandidateRequest = {
        name: 'John Doe',
        email: 'john@example.com',
        appliedPositionId: 1,
        status: 'interview',
        interviewNotes: 'Strong technical skills',
      };

      const mockResult = {
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedPosition: {
          id: 1,
          name: 'Software Engineer',
        },
      };

      (prisma.candidate.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createCandidate(data);

      expect(prisma.candidate.create).toHaveBeenCalledWith({
        data,
        include: {
          appliedPosition: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should create a candidate without optional interviewNotes', async () => {
      const data: CreateCandidateRequest = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        appliedPositionId: 2,
        status: 'applied',
      };

      const mockResult = {
        id: 2,
        ...data,
        interviewNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedPosition: {
          id: 2,
          name: 'Product Manager',
        },
      };

      (prisma.candidate.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createCandidate(data);

      expect(result.interviewNotes).toBeNull();
    });

    it('should handle database constraint error', async () => {
      const data: CreateCandidateRequest = {
        name: 'Test User',
        email: 'test@example.com',
        appliedPositionId: 1,
        status: 'screening',
      };

      const error = new Error('Unique constraint violation');
      (prisma.candidate.create as jest.Mock).mockRejectedValue(error);

      await expect(createCandidate(data)).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('findCandidates', () => {
    it('should return paginated candidates with default parameters', async () => {
      const mockCandidates = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          appliedPositionId: 1,
          status: 'interview',
          interviewNotes: 'Good fit',
          createdAt: new Date(),
          updatedAt: new Date(),
          appliedPosition: { id: 1, name: 'Software Engineer' },
        },
      ];

      (prisma.candidate.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (prisma.candidate.count as jest.Mock).mockResolvedValue(1);

      const result = await findCandidates();

      expect(prisma.candidate.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          appliedPosition: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result.candidates).toEqual(mockCandidates);
      expect(result.total).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      const mockCandidates = [{ id: 11 }, { id: 12 }];

      (prisma.candidate.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (prisma.candidate.count as jest.Mock).mockResolvedValue(25);

      const result = await findCandidates(2, 10);

      expect(prisma.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.total).toBe(25);
    });

    it('should filter by search term in name', async () => {
      const mockCandidates = [{ id: 1, name: 'John Doe', email: 'john@example.com' }];

      (prisma.candidate.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (prisma.candidate.count as jest.Mock).mockResolvedValue(1);

      await findCandidates(1, 10, 'John');

      expect(prisma.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'John', mode: 'insensitive' } },
              { email: { contains: 'John', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should filter by search term in email', async () => {
      const mockCandidates = [{ id: 1, name: 'Jane Doe', email: 'jane@example.com' }];

      (prisma.candidate.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (prisma.candidate.count as jest.Mock).mockResolvedValue(1);

      await findCandidates(1, 10, 'jane@');

      expect(prisma.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'jane@', mode: 'insensitive' } },
              { email: { contains: 'jane@', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should filter by status', async () => {
      const mockCandidates = [{ id: 1, status: 'interview' }];

      (prisma.candidate.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (prisma.candidate.count as jest.Mock).mockResolvedValue(1);

      await findCandidates(1, 10, undefined, 'interview');

      expect(prisma.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'interview' },
        })
      );
    });

    it('should filter by both search and status', async () => {
      const mockCandidates = [{ id: 1, name: 'John Doe', status: 'interview' }];

      (prisma.candidate.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (prisma.candidate.count as jest.Mock).mockResolvedValue(1);

      await findCandidates(1, 10, 'John', 'interview');

      expect(prisma.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'John', mode: 'insensitive' } },
              { email: { contains: 'John', mode: 'insensitive' } },
            ],
            status: 'interview',
          },
        })
      );
    });

    it('should return empty array when no candidates found', async () => {
      (prisma.candidate.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.candidate.count as jest.Mock).mockResolvedValue(0);

      const result = await findCandidates();

      expect(result.candidates).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle custom page size', async () => {
      const mockCandidates = Array(5).fill({ id: 1 });

      (prisma.candidate.findMany as jest.Mock).mockResolvedValue(mockCandidates);
      (prisma.candidate.count as jest.Mock).mockResolvedValue(5);

      await findCandidates(1, 5);

      expect(prisma.candidate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('findCandidateById', () => {
    it('should find candidate by ID', async () => {
      const mockCandidate = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        appliedPositionId: 1,
        status: 'interview',
        interviewNotes: 'Good candidate',
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedPosition: {
          id: 1,
          name: 'Software Engineer',
        },
      };

      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(mockCandidate);

      const result = await findCandidateById(1);

      expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          appliedPosition: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCandidate);
    });

    it('should return null when candidate not found', async () => {
      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findCandidateById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateCandidate', () => {
    it('should update candidate with all fields', async () => {
      const updateData: UpdateCandidateRequest = {
        name: 'John Updated',
        email: 'john.updated@example.com',
        status: 'offer',
        interviewNotes: 'Updated notes',
      };

      const mockResult = {
        id: 1,
        ...updateData,
        appliedPositionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedPosition: {
          id: 1,
          name: 'Software Engineer',
        },
      };

      (prisma.candidate.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateCandidate(1, updateData);

      expect(prisma.candidate.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
        include: {
          appliedPosition: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should update only status field', async () => {
      const updateData: UpdateCandidateRequest = {
        status: 'hired',
      };

      const mockResult = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        appliedPositionId: 1,
        status: 'hired',
        interviewNotes: 'Original notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        appliedPosition: {
          id: 1,
          name: 'Software Engineer',
        },
      };

      (prisma.candidate.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateCandidate(1, updateData);

      expect(result.status).toBe('hired');
    });

    it('should handle update of non-existent candidate', async () => {
      const updateData: UpdateCandidateRequest = { status: 'rejected' };
      const error = new Error('Record not found');

      (prisma.candidate.update as jest.Mock).mockRejectedValue(error);

      await expect(updateCandidate(999, updateData)).rejects.toThrow('Record not found');
    });
  });

  describe('deleteCandidate', () => {
    it('should delete candidate by ID', async () => {
      const mockDeleted = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        appliedPositionId: 1,
        status: 'rejected',
        interviewNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.candidate.delete as jest.Mock).mockResolvedValue(mockDeleted);

      const result = await deleteCandidate(1);

      expect(prisma.candidate.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockDeleted);
    });

    it('should handle deletion of non-existent candidate', async () => {
      const error = new Error('Record not found');

      (prisma.candidate.delete as jest.Mock).mockRejectedValue(error);

      await expect(deleteCandidate(999)).rejects.toThrow('Record not found');
    });
  });

  describe('findCandidateByEmail', () => {
    it('should find candidate by email', async () => {
      const mockCandidate = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        appliedPositionId: 1,
        status: 'interview',
        interviewNotes: 'Good candidate',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(mockCandidate);

      const result = await findCandidateByEmail('john@example.com');

      expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(result).toEqual(mockCandidate);
    });

    it('should return null when email not found', async () => {
      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findCandidateByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle email case sensitivity correctly', async () => {
      const mockCandidate = {
        id: 1,
        name: 'John Doe',
        email: 'John@Example.com',
        appliedPositionId: 1,
        status: 'interview',
        interviewNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(mockCandidate);

      const result = await findCandidateByEmail('John@Example.com');

      expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
        where: { email: 'John@Example.com' },
      });
      expect(result?.email).toBe('John@Example.com');
    });
  });
});
