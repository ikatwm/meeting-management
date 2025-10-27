import type { Request, Response, NextFunction } from 'express';
import { authMiddleware, errorHandler } from '../middleware';
import { verifyToken } from '../jwt';
import type { JwtPayload } from '../types';

jest.mock('../jwt');

describe('Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    const mockPayload: JwtPayload = {
      userId: 1,
      email: 'test@example.com',
      role: 'hr',
    };

    it('should authenticate valid token with Bearer prefix', () => {
      const token = 'valid-token-123';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      (verifyToken as jest.Mock).mockReturnValue(mockPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should authenticate valid token without Bearer prefix', () => {
      const token = 'valid-token-123';
      mockRequest.headers = { authorization: token };
      (verifyToken as jest.Mock).mockReturnValue(mockPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no authorization header provided', () => {
      mockRequest.headers = {};

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(verifyToken).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is empty string', () => {
      mockRequest.headers = { authorization: '' };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification fails with Error', () => {
      const token = 'invalid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      const error = new Error('Token expired');
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw error;
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token expired',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 with generic message when token verification fails with non-Error', () => {
      const token = 'invalid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed JWT token', () => {
      const token = 'malformed.token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      (verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'jwt malformed',
      });
    });

    it('should properly extract token after "Bearer " prefix with extra spaces', () => {
      const token = 'valid-token-123';
      mockRequest.headers = { authorization: `Bearer  ${token}` };
      (verifyToken as jest.Mock).mockReturnValue(mockPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Token should have extra space at the start
      expect(verifyToken).toHaveBeenCalledWith(` ${token}`);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      delete process.env.NODE_ENV;
    });

    it('should handle error with default 500 status code', () => {
      const error = new Error('Something went wrong');
      mockResponse.statusCode = 200;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'Something went wrong',
      });
    });

    it('should use existing status code if not 200', () => {
      const error = new Error('Validation failed');
      mockResponse.statusCode = 400;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'Validation failed',
      });
    });

    it('should include custom error name', () => {
      const error = new Error('Database connection failed');
      error.name = 'DatabaseError';
      mockResponse.statusCode = 200;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'DatabaseError',
        message: 'Database connection failed',
      });
    });

    it('should use default message when error message is empty', () => {
      const error = new Error('');
      mockResponse.statusCode = 200;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'Internal server error',
      });
    });

    it('should include stack trace in development environment', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Dev error');
      error.stack = 'Error stack trace...';
      mockResponse.statusCode = 200;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'Dev error',
        stack: 'Error stack trace...',
      });
    });

    it('should not include stack trace in production environment', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');
      error.stack = 'Error stack trace...';
      mockResponse.statusCode = 200;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'Production error',
      });
    });

    it('should handle error without stack trace', () => {
      const error = new Error('No stack error');
      delete error.stack;
      mockResponse.statusCode = 200;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'No stack error',
      });
    });

    it('should handle error with status code 401', () => {
      const error = new Error('Unauthorized access');
      mockResponse.statusCode = 401;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'Unauthorized access',
      });
    });

    it('should handle error with status code 403', () => {
      const error = new Error('Forbidden');
      mockResponse.statusCode = 403;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle error with status code 404', () => {
      const error = new Error('Not found');
      mockResponse.statusCode = 404;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should log error to console', () => {
      const error = new Error('Logged error');
      mockResponse.statusCode = 200;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });
  });
});
