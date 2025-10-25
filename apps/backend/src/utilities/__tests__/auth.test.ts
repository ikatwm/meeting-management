import { hashPassword, comparePassword } from '../auth';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'test-password-123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'test-password-123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'test-password-123';
      const hashed = await hashPassword(password);
      const result = await comparePassword(password, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'test-password-123';
      const wrongPassword = 'wrong-password';
      const hashed = await hashPassword(password);
      const result = await comparePassword(wrongPassword, hashed);

      expect(result).toBe(false);
    });
  });
});
