/**
 * API Test Helpers
 * Provides utilities for testing Express API endpoints with supertest
 */

import supertest from 'supertest';
import type { Express } from 'express';
import { generateToken } from '../../utilities/jwt';
import type { JwtPayload } from '../../utilities/types';

/**
 * Create a supertest request wrapper with authentication
 *
 * @example
 * ```typescript
 * const app = createTestApp();
 * const request = createAuthenticatedRequest(app);
 *
 * const response = await request
 *   .get('/api/meetings')
 *   .expect(200);
 * ```
 */
export const createAuthenticatedRequest = (
  app: Express,
  payload?: Partial<JwtPayload>
): {
  get: (url: string) => supertest.Test;
  post: (url: string) => supertest.Test;
  put: (url: string) => supertest.Test;
  delete: (url: string) => supertest.Test;
  patch: (url: string) => supertest.Test;
} => {
  const defaultPayload: JwtPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'hr',
    ...payload,
  };

  const token = generateToken(defaultPayload);
  const request = supertest(app);

  // Return a wrapped request object with authentication
  return {
    get: (url: string): supertest.Test => request.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string): supertest.Test =>
      request.post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string): supertest.Test => request.put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string): supertest.Test =>
      request.delete(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string): supertest.Test =>
      request.patch(url).set('Authorization', `Bearer ${token}`),
  };
};

/**
 * Create a standard supertest request without authentication
 *
 * @example
 * ```typescript
 * const app = createTestApp();
 * const request = createRequest(app);
 *
 * const response = await request
 *   .post('/api/auth/login')
 *   .send({ email: 'test@example.com', password: 'password' })
 *   .expect(200);
 * ```
 */
export const createRequest = (app: Express) => {
  return supertest(app);
};

/**
 * Generate authentication token for testing
 *
 * @example
 * ```typescript
 * const token = createAuthToken({ userId: 2, role: 'manager' });
 *
 * const response = await request(app)
 *   .get('/api/meetings')
 *   .set('Authorization', `Bearer ${token}`)
 *   .expect(200);
 * ```
 */
export const createAuthToken = (payload?: Partial<JwtPayload>): string => {
  const defaultPayload: JwtPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'hr',
    ...payload,
  };

  return generateToken(defaultPayload);
};

/**
 * Extract and verify response body structure
 *
 * @example
 * ```typescript
 * const response = await request(app).get('/api/meetings');
 * expectValidResponse(response, 200, {
 *   meetings: expect.any(Array),
 *   pagination: expect.any(Object)
 * });
 * ```
 */
export const expectValidResponse = (
  response: supertest.Response,
  expectedStatus: number,
  expectedBody?: Record<string, unknown>
): void => {
  expect(response.status).toBe(expectedStatus);

  if (expectedBody) {
    expect(response.body).toMatchObject(expectedBody);
  }
};

/**
 * Expect error response with specific structure
 *
 * @example
 * ```typescript
 * const response = await request(app)
 *   .get('/api/meetings/999')
 *   .set('Authorization', `Bearer ${token}`);
 *
 * expectErrorResponse(response, 404, 'Meeting not found');
 * ```
 */
export const expectErrorResponse = (
  response: supertest.Response,
  expectedStatus: number,
  expectedMessage?: string
): void => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('error');

  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }
};

/**
 * Helper to test pagination responses
 *
 * @example
 * ```typescript
 * const response = await request(app).get('/api/meetings?page=2&pageSize=10');
 * expectPaginatedResponse(response, {
 *   page: 2,
 *   pageSize: 10,
 *   total: 50,
 *   totalPages: 5
 * });
 * ```
 */
export const expectPaginatedResponse = (
  response: supertest.Response,
  expectedPagination: {
    page: number;
    pageSize: number;
    total?: number;
    totalPages?: number;
  }
): void => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('pagination');

  const { pagination } = response.body;
  expect(pagination.page).toBe(expectedPagination.page);
  expect(pagination.pageSize).toBe(expectedPagination.pageSize);

  if (expectedPagination.total !== undefined) {
    expect(pagination.total).toBe(expectedPagination.total);
  }

  if (expectedPagination.totalPages !== undefined) {
    expect(pagination.totalPages).toBe(expectedPagination.totalPages);
  }
};

/**
 * Test rate limiting by making multiple requests
 *
 * @example
 * ```typescript
 * await testRateLimit(app, '/api/meetings', 101);
 * // Should receive 429 Too Many Requests after limit
 * ```
 */
export const testRateLimit = async (
  app: Express,
  endpoint: string,
  requestCount: number
): Promise<supertest.Response> => {
  const request = supertest(app);
  let lastResponse: supertest.Response | undefined;

  for (let i = 0; i < requestCount; i++) {
    lastResponse = await request.get(endpoint);
  }

  return lastResponse as supertest.Response;
};

/**
 * Helper for testing authenticated endpoints with different roles
 *
 * @example
 * ```typescript
 * await testRoleAuthorization(app, '/api/meetings', ['hr', 'manager'], 'staff');
 * // HR and manager should succeed, staff should get 403
 * ```
 */
export const testRoleAuthorization = async (
  app: Express,
  endpoint: string,
  allowedRoles: string[],
  deniedRole: string
): Promise<void> => {
  // Test allowed roles
  for (const role of allowedRoles) {
    const token = createAuthToken({ role });
    const response = await supertest(app).get(endpoint).set('Authorization', `Bearer ${token}`);

    expect([200, 201, 204]).toContain(response.status);
  }

  // Test denied role
  const deniedToken = createAuthToken({ role: deniedRole });
  const deniedResponse = await supertest(app)
    .get(endpoint)
    .set('Authorization', `Bearer ${deniedToken}`);

  expect(deniedResponse.status).toBe(403);
};
