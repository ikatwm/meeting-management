import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  createMeetingSchema,
  createCandidateSchema,
  paginationSchema,
  validateData,
} from '../validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'hr' as const,
      };

      expect(() => validateData(registerSchema, validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        role: 'hr' as const,
      };

      expect(() => validateData(registerSchema, invalidData)).toThrow(z.ZodError);
    });

    it('should reject short password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short',
        role: 'hr' as const,
      };

      expect(() => validateData(registerSchema, invalidData)).toThrow(z.ZodError);
    });

    it('should reject invalid role', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalid-role',
      };

      expect(() => validateData(registerSchema, invalidData)).toThrow(z.ZodError);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'john@example.com',
        password: 'password123',
      };

      expect(() => validateData(loginSchema, validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      expect(() => validateData(loginSchema, invalidData)).toThrow(z.ZodError);
    });
  });

  describe('createMeetingSchema', () => {
    it('should validate correct meeting data', () => {
      const validData = {
        title: 'Interview Meeting',
        startTime: '2025-11-01T10:00:00Z',
        endTime: '2025-11-01T11:00:00Z',
        meetingType: 'zoom' as const,
        status: 'confirmed' as const,
      };

      expect(() => validateData(createMeetingSchema, validData)).not.toThrow();
    });

    it('should reject invalid meeting type', () => {
      const invalidData = {
        title: 'Interview Meeting',
        startTime: '2025-11-01T10:00:00Z',
        endTime: '2025-11-01T11:00:00Z',
        meetingType: 'invalid-type',
        status: 'confirmed' as const,
      };

      expect(() => validateData(createMeetingSchema, invalidData)).toThrow(z.ZodError);
    });
  });

  describe('createCandidateSchema', () => {
    it('should validate correct candidate data', () => {
      const validData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        appliedPositionId: 1,
        status: 'interview' as const,
      };

      expect(() => validateData(createCandidateSchema, validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'Jane Smith',
        email: 'invalid-email',
        appliedPositionId: 1,
        status: 'interview' as const,
      };

      expect(() => validateData(createCandidateSchema, invalidData)).toThrow(z.ZodError);
    });
  });

  describe('paginationSchema', () => {
    it('should validate correct pagination data', () => {
      const validData = { page: 1, pageSize: 10 };
      const result = validateData(paginationSchema, validData);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should use default values when not provided', () => {
      const result = validateData(paginationSchema, {});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should coerce string numbers to integers', () => {
      const result = validateData(paginationSchema, { page: '2', pageSize: '20' });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(20);
    });

    it('should reject page size over 100', () => {
      expect(() => validateData(paginationSchema, { page: 1, pageSize: 101 })).toThrow(z.ZodError);
    });
  });
});
