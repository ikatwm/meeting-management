/**
 * Integration tests for authentication endpoints
 * Tests: POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout
 */

const request = require('supertest');
import type { Express } from 'express';
import { createTestApp, mockPrismaClient, resetMocks, testUsers } from './test-utils';
import * as authUtils from '../../utilities/auth';

describe('Auth Endpoints Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/auth/register', () => {
    const registerData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      role: 'staff',
      positionId: 1,
    };

    it('should register a new user successfully', async () => {
      const newUser = {
        ...testUsers.staff,
        id: 99,
        name: registerData.name,
        email: registerData.email,
      };

      mockPrismaClient.user.findUnique.mockResolvedValueOnce(null); // No existing user
      mockPrismaClient.user.create.mockResolvedValueOnce(newUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
      expect(response.body.user).not.toHaveProperty('passwordHash');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(mockPrismaClient.user.create).toHaveBeenCalled();
    });

    it('should return 400 if user already exists', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(testUsers.staff);

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'BadRequest',
        message: 'User with this email already exists',
      });
      expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid input data (missing required fields)', async () => {
      const invalidData = {
        name: 'Test User',
        // Missing email, password, role, positionId
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
      expect(response.body).toHaveProperty('details');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...registerData,
        email: 'invalid-email',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
    });

    it('should return 400 for weak password', async () => {
      const invalidData = {
        ...registerData,
        password: '123', // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
    });

    it('should return 400 for invalid role', async () => {
      const invalidData = {
        ...registerData,
        role: 'invalid_role',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.user.create.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to register user',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'hr@example.com',
      password: 'correctPassword123!',
    };

    it('should login successfully with valid credentials', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(testUsers.hr);
      mockPrismaClient.user.update.mockResolvedValueOnce(testUsers.hr);
      jest.spyOn(authUtils, 'comparePassword').mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        id: testUsers.hr.id,
        name: testUsers.hr.name,
        email: testUsers.hr.email,
        role: testUsers.hr.role,
      });
      expect(response.body.user).not.toHaveProperty('passwordHash');

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(mockPrismaClient.user.update).toHaveBeenCalled();
    });

    it('should return 401 for non-existent email', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    });

    it('should return 401 for incorrect password', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(testUsers.hr);
      jest.spyOn(authUtils, 'comparePassword').mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
      expect(mockPrismaClient.user.update).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        email: 'test@example.com',
        // Missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });

    it('should return 500 if database operation fails', async () => {
      mockPrismaClient.user.findUnique.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'InternalServerError',
        message: 'Failed to login',
      });
    });

    it('should update lastLoginAt timestamp on successful login', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(testUsers.hr);
      mockPrismaClient.user.update.mockResolvedValueOnce(testUsers.hr);
      jest.spyOn(authUtils, 'comparePassword').mockResolvedValueOnce(true);

      await request(app).post('/api/auth/login').send(loginData).expect(200);

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: testUsers.hr.id },
        data: { lastLogin: expect.any(Date) },
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Logged out successfully',
      });
    });

    it('should logout without authentication (stateless)', async () => {
      // Logout doesn't require authentication in JWT-based system
      const response = await request(app)
        .post('/api/auth/logout')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Logged out successfully',
      });
    });
  });

  describe('Edge Cases and Security', () => {
    it('should not expose password hash in registration response', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePassword123!',
        role: 'staff',
        positionId: 1,
      };

      mockPrismaClient.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.user.create.mockResolvedValueOnce({
        ...testUsers.staff,
        email: registerData.email,
        passwordHash: 'hashed_password',
      });

      const response = await request(app).post('/api/auth/register').send(registerData).expect(201);

      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should not expose password hash in login response', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(testUsers.hr);
      mockPrismaClient.user.update.mockResolvedValueOnce(testUsers.hr);
      jest.spyOn(authUtils, 'comparePassword').mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'hr@example.com',
          password: 'password',
        })
        .expect(200);

      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should handle SQL injection attempts in email field', async () => {
      const maliciousData = {
        email: "admin@example.com' OR '1'='1",
        password: 'password',
      };

      // The malicious email will be rejected by Zod email validation as invalid format
      // This returns 400 ValidationError, not 401 Unauthorized
      const response = await request(app).post('/api/auth/login').send(maliciousData).expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
        message: 'Invalid input data',
      });
    });

    it('should handle very long input strings gracefully', async () => {
      const longString = 'a'.repeat(10000);
      const invalidData = {
        email: `${longString}@example.com`,
        password: longString,
        name: longString,
        role: 'staff',
        positionId: 1,
      };

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400);

      expect(response.body).toMatchObject({
        error: 'ValidationError',
      });
    });
  });
});
