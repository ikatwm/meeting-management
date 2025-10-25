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
  });
});
