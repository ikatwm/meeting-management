import { createUser, findUserByEmail, findUserById, updateUserLastLogin } from '../users';
import prisma from '../../utilities/prisma';
import { hashPassword } from '../../utilities/auth';
import type { RegisterRequest } from '../../utilities/types';

jest.mock('../../utilities/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../utilities/auth', () => ({
  hashPassword: jest.fn(),
}));

describe('Users Collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with all fields including positionId', async () => {
      const userData: RegisterRequest = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'hr',
        positionId: 5,
      };

      const hashedPassword = 'hashed_password_123';
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      const mockResult = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'hr',
        positionId: 5,
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createUser(userData);

      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'hr',
          passwordHash: hashedPassword,
          positionId: 5,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          positionId: true,
        },
      });
      expect(result).toEqual(mockResult);
    });

    it('should create user without positionId', async () => {
      const userData: RegisterRequest = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'securepass456',
        role: 'manager',
      };

      const hashedPassword = 'hashed_password_456';
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      const mockResult = {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'manager',
        positionId: null,
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createUser(userData);

      expect(result.positionId).toBeNull();
    });

    it('should hash password before storing', async () => {
      const userData: RegisterRequest = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'plaintext',
        role: 'staff',
      };

      const hashedPassword = 'hashed_plaintext';
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      const mockResult = {
        id: 3,
        name: 'Test User',
        email: 'test@example.com',
        role: 'staff',
        positionId: null,
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockResult);

      await createUser(userData);

      expect(hashPassword).toHaveBeenCalledWith('plaintext');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: hashedPassword,
          }),
        })
      );
    });

    it('should handle all role types', async () => {
      const roles: Array<'hr' | 'manager' | 'staff'> = ['hr', 'manager', 'staff'];

      for (const role of roles) {
        const userData: RegisterRequest = {
          name: `User ${role}`,
          email: `${role}@example.com`,
          password: 'password123',
          role,
        };

        const hashedPassword = `hashed_${role}`;
        (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

        const mockResult = {
          id: 1,
          name: `User ${role}`,
          email: `${role}@example.com`,
          role,
          positionId: null,
        };

        (prisma.user.create as jest.Mock).mockResolvedValue(mockResult);

        const result = await createUser(userData);
        expect(result.role).toBe(role);
      }
    });

    it('should not include passwordHash in response', async () => {
      const userData: RegisterRequest = {
        name: 'Secure User',
        email: 'secure@example.com',
        password: 'password123',
        role: 'hr',
      };

      const hashedPassword = 'hashed_password';
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      const mockResult = {
        id: 1,
        name: 'Secure User',
        email: 'secure@example.com',
        role: 'hr',
        positionId: null,
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockResult);

      const result = await createUser(userData);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('password');
    });

    it('should handle duplicate email error', async () => {
      const userData: RegisterRequest = {
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'staff',
      };

      const hashedPassword = 'hashed_password';
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      const error = new Error('Unique constraint violation');
      (prisma.user.create as jest.Mock).mockRejectedValue(error);

      await expect(createUser(userData)).rejects.toThrow('Unique constraint violation');
    });

    it('should handle invalid positionId foreign key error', async () => {
      const userData: RegisterRequest = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'staff',
        positionId: 999,
      };

      const hashedPassword = 'hashed_password';
      (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

      const error = new Error('Foreign key constraint failed');
      (prisma.user.create as jest.Mock).mockRejectedValue(error);

      await expect(createUser(userData)).rejects.toThrow('Foreign key constraint failed');
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email including passwordHash', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'hr',
        passwordHash: 'hashed_password',
        positionId: 5,
        lastLogin: new Date('2025-10-28T10:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserByEmail('john@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(result).toEqual(mockUser);
      expect(result?.passwordHash).toBe('hashed_password');
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle email case sensitivity', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'Test@Example.com',
        role: 'staff',
        passwordHash: 'hashed',
        positionId: null,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserByEmail('Test@Example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'Test@Example.com' },
      });
      expect(result?.email).toBe('Test@Example.com');
    });

    it('should handle database error', async () => {
      const error = new Error('Database connection failed');

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(findUserByEmail('test@example.com')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should find user with null positionId', async () => {
      const mockUser = {
        id: 2,
        name: 'No Position User',
        email: 'noposition@example.com',
        role: 'staff',
        passwordHash: 'hashed',
        positionId: null,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserByEmail('noposition@example.com');

      expect(result?.positionId).toBeNull();
    });

    it('should find user with null lastLogin', async () => {
      const mockUser = {
        id: 3,
        name: 'Never Logged In',
        email: 'neverlogin@example.com',
        role: 'hr',
        passwordHash: 'hashed',
        positionId: 1,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserByEmail('neverlogin@example.com');

      expect(result?.lastLogin).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find user by ID with position details', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'hr',
        positionId: 5,
        position: {
          id: 5,
          name: 'HR Manager',
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserById(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          positionId: true,
          position: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
      expect(result?.position?.name).toBe('HR Manager');
    });

    it('should not include passwordHash in response', async () => {
      const mockUser = {
        id: 1,
        name: 'Secure User',
        email: 'secure@example.com',
        role: 'staff',
        positionId: null,
        position: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserById(1);

      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findUserById(999);

      expect(result).toBeNull();
    });

    it('should find user without position', async () => {
      const mockUser = {
        id: 2,
        name: 'No Position User',
        email: 'nopos@example.com',
        role: 'staff',
        positionId: null,
        position: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await findUserById(2);

      expect(result?.position).toBeNull();
      expect(result?.positionId).toBeNull();
    });

    it('should handle database error', async () => {
      const error = new Error('Database query failed');

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(findUserById(1)).rejects.toThrow('Database query failed');
    });

    it('should handle zero ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findUserById(0);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 0 },
        })
      );
      expect(result).toBeNull();
    });

    it('should handle negative ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await findUserById(-1);

      expect(result).toBeNull();
    });
  });

  describe('updateUserLastLogin', () => {
    it('should update user last login timestamp', async () => {
      const userId = 1;
      const now = new Date();

      const mockResult = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'hr',
        passwordHash: 'hashed',
        positionId: 5,
        lastLogin: now,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateUserLastLogin(userId);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { lastLogin: expect.any(Date) },
      });
      expect(result).toEqual(mockResult);
      expect(result.lastLogin).toBeDefined();
    });

    it('should update from null to timestamp', async () => {
      const userId = 2;

      const mockResult = {
        id: userId,
        name: 'First Login User',
        email: 'first@example.com',
        role: 'staff',
        passwordHash: 'hashed',
        positionId: null,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateUserLastLogin(userId);

      expect(result.lastLogin).toBeDefined();
      expect(result.lastLogin).toBeInstanceOf(Date);
    });

    it('should update existing lastLogin timestamp', async () => {
      const userId = 3;
      const oldLogin = new Date('2025-10-27T10:00:00Z');
      const newLogin = new Date('2025-10-28T10:00:00Z');

      const mockResult = {
        id: userId,
        name: 'Repeat User',
        email: 'repeat@example.com',
        role: 'manager',
        passwordHash: 'hashed',
        positionId: 1,
        lastLogin: newLogin,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockResult);

      const result = await updateUserLastLogin(userId);

      expect(result.lastLogin?.getTime()).toBeGreaterThan(oldLogin.getTime());
    });

    it('should handle update of non-existent user', async () => {
      const userId = 999;
      const error = new Error('Record not found');

      (prisma.user.update as jest.Mock).mockRejectedValue(error);

      await expect(updateUserLastLogin(userId)).rejects.toThrow('Record not found');
    });

    it('should handle database error', async () => {
      const userId = 1;
      const error = new Error('Database connection failed');

      (prisma.user.update as jest.Mock).mockRejectedValue(error);

      await expect(updateUserLastLogin(userId)).rejects.toThrow('Database connection failed');
    });

    it('should create timestamp at time of call', async () => {
      const userId = 1;
      const beforeCall = new Date();

      const mockResult = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'staff',
        passwordHash: 'hashed',
        positionId: null,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockResult);

      await updateUserLastLogin(userId);

      const afterCall = new Date();

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { lastLogin: expect.any(Date) },
      });

      const callArgs = (prisma.user.update as jest.Mock).mock.calls[0][0];
      const lastLoginArg = callArgs.data.lastLogin;

      expect(lastLoginArg.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(lastLoginArg.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should handle multiple consecutive updates', async () => {
      const userId = 1;

      for (let i = 0; i < 3; i++) {
        const mockResult = {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          role: 'staff',
          passwordHash: 'hashed',
          positionId: null,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (prisma.user.update as jest.Mock).mockResolvedValue(mockResult);

        await updateUserLastLogin(userId);
      }

      expect(prisma.user.update).toHaveBeenCalledTimes(3);
    });
  });
});
