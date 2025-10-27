import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../jwt';
import type { JwtPayload } from '../types';

describe('JWT Utilities', () => {
  const mockPayload: JwtPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'hr',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include payload data in token', () => {
      const token = generateToken(mockPayload);

      // Verify token can be decoded
      expect(() => {
        const decoded = verifyToken(token);
        expect(decoded.userId).toBe(mockPayload.userId);
        expect(decoded.email).toBe(mockPayload.email);
        expect(decoded.role).toBe(mockPayload.role);
      }).not.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('not.a.valid.jwt.token')).toThrow();
    });

    it('should handle TokenExpiredError by name property', () => {
      const expiredError = { name: 'TokenExpiredError', message: 'jwt expired' };
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw expiredError;
      });

      expect(() => verifyToken('expired-token')).toThrow('Token expired');
    });

    it('should handle JsonWebTokenError by name property', () => {
      const invalidError = { name: 'JsonWebTokenError', message: 'invalid token' };
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw invalidError;
      });

      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should handle generic errors with fallback message', () => {
      const genericError = new Error('Unexpected error');
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw genericError;
      });

      expect(() => verifyToken('token-with-error')).toThrow('Token verification failed');
    });

    it('should handle non-Error objects thrown by verify', () => {
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'String error';
      });

      expect(() => verifyToken('token-with-string-error')).toThrow('Token verification failed');
    });

    it('should handle null or undefined errors', () => {
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw null;
      });

      expect(() => verifyToken('token-with-null-error')).toThrow('Token verification failed');
    });

    it('should handle error objects without name property', () => {
      const errorWithoutName = { message: 'some error' };
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw errorWithoutName;
      });

      expect(() => verifyToken('token-with-error')).toThrow('Token verification failed');
    });
  });
});
