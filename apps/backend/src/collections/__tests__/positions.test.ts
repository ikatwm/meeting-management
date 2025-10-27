import {
  findAllPositions,
  findAllAppliedPositions,
  findPositionById,
  findAppliedPositionById,
} from '../positions';
import prisma from '../../utilities/prisma';

jest.mock('../../utilities/prisma', () => ({
  __esModule: true,
  default: {
    position: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    appliedPosition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Positions Collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllPositions', () => {
    it('should find all positions ordered by name ascending', async () => {
      const mockPositions = [
        { id: 1, name: 'Backend Developer' },
        { id: 2, name: 'Frontend Developer' },
        { id: 3, name: 'Product Manager' },
      ];

      (prisma.position.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllPositions();

      expect(prisma.position.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockPositions);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no positions exist', async () => {
      (prisma.position.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findAllPositions();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should order positions alphabetically', async () => {
      const mockPositions = [
        { id: 1, name: 'Analyst' },
        { id: 2, name: 'Engineer' },
        { id: 3, name: 'Manager' },
      ];

      (prisma.position.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllPositions();

      expect(result[0].name).toBe('Analyst');
      expect(result[1].name).toBe('Engineer');
      expect(result[2].name).toBe('Manager');
    });

    it('should handle database error', async () => {
      const error = new Error('Database connection failed');

      (prisma.position.findMany as jest.Mock).mockRejectedValue(error);

      await expect(findAllPositions()).rejects.toThrow('Database connection failed');
    });

    it('should handle single position', async () => {
      const mockPositions = [{ id: 1, name: 'Software Engineer' }];

      (prisma.position.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllPositions();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Software Engineer');
    });

    it('should handle positions with same name prefix', async () => {
      const mockPositions = [
        { id: 1, name: 'Software Engineer I' },
        { id: 2, name: 'Software Engineer II' },
        { id: 3, name: 'Software Engineer III' },
      ];

      (prisma.position.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllPositions();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Software Engineer I');
    });

    it('should handle positions with special characters', async () => {
      const mockPositions = [
        { id: 1, name: 'C++ Developer' },
        { id: 2, name: 'UI/UX Designer' },
      ];

      (prisma.position.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllPositions();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('C++ Developer');
    });
  });

  describe('findAllAppliedPositions', () => {
    it('should find all applied positions ordered by name ascending', async () => {
      const mockPositions = [
        { id: 1, name: 'Backend Developer' },
        { id: 2, name: 'Frontend Developer' },
        { id: 3, name: 'QA Engineer' },
      ];

      (prisma.appliedPosition.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllAppliedPositions();

      expect(prisma.appliedPosition.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockPositions);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no applied positions exist', async () => {
      (prisma.appliedPosition.findMany as jest.Mock).mockResolvedValue([]);

      const result = await findAllAppliedPositions();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should order applied positions alphabetically', async () => {
      const mockPositions = [
        { id: 1, name: 'Data Analyst' },
        { id: 2, name: 'DevOps Engineer' },
        { id: 3, name: 'Technical Writer' },
      ];

      (prisma.appliedPosition.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllAppliedPositions();

      expect(result[0].name).toBe('Data Analyst');
      expect(result[1].name).toBe('DevOps Engineer');
      expect(result[2].name).toBe('Technical Writer');
    });

    it('should handle database error', async () => {
      const error = new Error('Database query failed');

      (prisma.appliedPosition.findMany as jest.Mock).mockRejectedValue(error);

      await expect(findAllAppliedPositions()).rejects.toThrow('Database query failed');
    });

    it('should handle large number of applied positions', async () => {
      const mockPositions = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Position ${i + 1}`,
      }));

      (prisma.appliedPosition.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllAppliedPositions();

      expect(result).toHaveLength(50);
    });

    it('should handle applied positions with duplicate-like names', async () => {
      const mockPositions = [
        { id: 1, name: 'Developer' },
        { id: 2, name: 'Developer (Remote)' },
        { id: 3, name: 'Developer - Senior' },
      ];

      (prisma.appliedPosition.findMany as jest.Mock).mockResolvedValue(mockPositions);

      const result = await findAllAppliedPositions();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Developer');
    });
  });

  describe('findPositionById', () => {
    it('should find position by ID', async () => {
      const mockPosition = {
        id: 1,
        name: 'Software Engineer',
      };

      (prisma.position.findUnique as jest.Mock).mockResolvedValue(mockPosition);

      const result = await findPositionById(1);

      expect(prisma.position.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockPosition);
    });

    it('should return null when position not found', async () => {
      (prisma.position.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findPositionById(999);

      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      const error = new Error('Database connection failed');

      (prisma.position.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(findPositionById(1)).rejects.toThrow('Database connection failed');
    });

    it('should handle zero ID', async () => {
      (prisma.position.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findPositionById(0);

      expect(prisma.position.findUnique).toHaveBeenCalledWith({
        where: { id: 0 },
      });
      expect(result).toBeNull();
    });

    it('should handle negative ID', async () => {
      (prisma.position.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findPositionById(-1);

      expect(prisma.position.findUnique).toHaveBeenCalledWith({
        where: { id: -1 },
      });
      expect(result).toBeNull();
    });

    it('should find position with special characters in name', async () => {
      const mockPosition = {
        id: 5,
        name: 'C# .NET Developer',
      };

      (prisma.position.findUnique as jest.Mock).mockResolvedValue(mockPosition);

      const result = await findPositionById(5);

      expect(result?.name).toBe('C# .NET Developer');
    });
  });

  describe('findAppliedPositionById', () => {
    it('should find applied position by ID', async () => {
      const mockPosition = {
        id: 1,
        name: 'Backend Developer',
      };

      (prisma.appliedPosition.findUnique as jest.Mock).mockResolvedValue(mockPosition);

      const result = await findAppliedPositionById(1);

      expect(prisma.appliedPosition.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockPosition);
    });

    it('should return null when applied position not found', async () => {
      (prisma.appliedPosition.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findAppliedPositionById(999);

      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      const error = new Error('Record not found');

      (prisma.appliedPosition.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(findAppliedPositionById(1)).rejects.toThrow('Record not found');
    });

    it('should handle zero ID', async () => {
      (prisma.appliedPosition.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findAppliedPositionById(0);

      expect(prisma.appliedPosition.findUnique).toHaveBeenCalledWith({
        where: { id: 0 },
      });
      expect(result).toBeNull();
    });

    it('should handle negative ID', async () => {
      (prisma.appliedPosition.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findAppliedPositionById(-1);

      expect(result).toBeNull();
    });

    it('should find applied position with long name', async () => {
      const mockPosition = {
        id: 10,
        name: 'Senior Full Stack Developer with Cloud Architecture Experience',
      };

      (prisma.appliedPosition.findUnique as jest.Mock).mockResolvedValue(mockPosition);

      const result = await findAppliedPositionById(10);

      expect(result?.name).toBe('Senior Full Stack Developer with Cloud Architecture Experience');
    });

    it('should handle consecutive ID queries', async () => {
      const mockPositions = [
        { id: 1, name: 'Position 1' },
        { id: 2, name: 'Position 2' },
        { id: 3, name: 'Position 3' },
      ];

      for (const mockPosition of mockPositions) {
        (prisma.appliedPosition.findUnique as jest.Mock).mockResolvedValue(mockPosition);

        const result = await findAppliedPositionById(mockPosition.id);
        expect(result?.id).toBe(mockPosition.id);
      }
    });
  });
});
