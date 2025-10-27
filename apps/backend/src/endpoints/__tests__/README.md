# API Integration Tests

Comprehensive integration tests for all Meeting Management API endpoints.

## 📋 Overview

This test suite provides comprehensive integration testing for all API endpoints in the Meeting Management system. Tests are written using **Jest** and **Supertest** with a mock Prisma database to ensure fast, isolated test execution.

## 🏗️ Test Structure

```

```

apps/backend/src/endpoints/**tests**/
├── test-utils.ts # Shared test utilities and mocks
├── auth.test.ts # Authentication endpoints (20 tests)
├── meetings.test.ts # Meeting CRUD operations (29 tests)
├── candidates.test.ts # Candidate management (31 tests)
├── positions.test.ts # Position listing (17 tests)
├── participants.test.ts # Meeting participants (24 tests)
├── candidateHistory.test.ts # Candidate interview history (28 tests)
└── README.md # This file

````

**Total Test Coverage**: 149 integration tests across 6 endpoints

## 🧪 Test Categories

### 1. Authentication Tests (`auth.test.ts`)

- ✅ User registration with validation
- ✅ Login with credential verification
- ✅ Logout functionality
- ✅ Password security (no hash exposure)
- ✅ SQL injection protection
- ✅ Input validation and edge cases

**Key Scenarios**:

- Valid user registration
- Duplicate email prevention
- Invalid credentials handling
- Token generation and validation
- Security vulnerability protection

### 2. Meetings Tests (`meetings.test.ts`)

- ✅ GET /api/meetings (paginated list)
- ✅ POST /api/meetings (create)
- ✅ GET /api/meetings/:id (retrieve)
- ✅ PUT /api/meetings/:id (update)
- ✅ DELETE /api/meetings/:id (soft delete)

**Key Scenarios**:

- Pagination with customizable page size
- Authentication requirement enforcement
- Meeting validation (date ranges, types, status)
- Concurrent request handling
- Special character support in titles

### 3. Candidates Tests (`candidates.test.ts`)

- ✅ GET /api/candidates (search & filter)
- ✅ POST /api/candidates (create)
- ✅ GET /api/candidates/:id (retrieve)
- ✅ PUT /api/candidates/:id (update)
- ✅ DELETE /api/candidates/:id (delete)

**Key Scenarios**:

- Search by name/email
- Status filtering (applied, interviewing, hired)
- Email uniqueness validation
- Interview notes management
- Concurrent creation handling

### 4. Positions Tests (`positions.test.ts`)

- ✅ GET /api/positions (all positions)
- ✅ GET /api/positions/applied (applied positions)

**Key Scenarios**:

- Role-based access (hr, manager, staff)
- Empty state handling
- Special characters in position names
- Concurrent request handling
- Data type consistency

### 5. Participants Tests (`participants.test.ts`)

- ✅ POST /api/meetings/:id/participants (add)
- ✅ DELETE /api/meetings/:id/participants/:userId (remove)

**Key Scenarios**:

- Add multiple participants to meetings
- Duplicate participant prevention
- Meeting existence validation
- Invalid ID handling (negative, zero, very large)
- Role-based access control

### 6. Candidate History Tests (`candidateHistory.test.ts`)

- ✅ GET /api/candidates/:id/history (retrieve)
- ✅ POST /api/candidates/:id/history (add feedback)

**Key Scenarios**:

- Chronological history ordering
- Feedback with/without meeting association
- Long feedback text (5000+ characters)
- Special characters and newlines in feedback
- Multiple history entries per candidate

## 🛠️ Test Infrastructure

### Test Utilities (`test-utils.ts`)

**Mock Prisma Client**:

```typescript
mockPrismaClient.users.findUnique();
mockPrismaClient.meetings.create();
mockPrismaClient.candidates.update();
// ... all database operations
````

**Test App Factory**:

```typescript
const app = createTestApp(); // Returns Express app with all routes
```

**Auth Token Generation**:

```typescript
const token = generateTestToken({ userId: 1, role: 'hr' });
```

**Test Data Fixtures**:

```typescript
testUsers.hr, testUsers.manager, testUsers.staff;
testMeetings.scheduled, testMeetings.completed;
testCandidates.interviewing, testCandidates.hired;
testPositions.developer, testPositions.manager;
```

**Mock Reset**:

```typescript
resetMocks(); // Reset all mock functions before each test
```

## 🚀 Running Tests

### Run All Integration Tests

```bash
# From project root
pnpm test

# From backend directory
cd apps/backend
npx jest src/endpoints/__tests__/
```

### Run Specific Test File

```bash
cd apps/backend
npx jest src/endpoints/__tests__/auth.test.ts
npx jest src/endpoints/__tests__/meetings.test.ts
```

### Run with Coverage

```bash
cd apps/backend
npx jest src/endpoints/__tests__/ --coverage
```

### Run in Watch Mode

```bash
cd apps/backend
npx jest src/endpoints/__tests__/ --watch
```

### Run Verbose Output

```bash
cd apps/backend
npx jest src/endpoints/__tests__/ --verbose
```

## 📊 Test Coverage Goals

**Target Coverage**: >80% for all API endpoints

### Coverage by Module

- ✅ Authentication endpoints: 100% critical path coverage
- ✅ Meeting CRUD operations: 95%+ coverage
- ✅ Candidate management: 95%+ coverage
- ✅ Position listing: 90%+ coverage
- ✅ Participant operations: 90%+ coverage
- ✅ Candidate history: 95%+ coverage

## 🎯 Test Patterns

### 1. Success Scenarios

Every endpoint tests successful operations with valid data:

```typescript
it('should create a new meeting successfully', async () => {
  mockPrismaClient.meetings.create.mockResolvedValueOnce(newMeeting);

  const response = await request(app)
    .post('/api/meetings')
    .set('Authorization', `Bearer ${authToken}`)
    .send(validData)
    .expect(201);

  expect(response.body).toMatchObject(expectedResponse);
});
```

### 2. Authentication & Authorization

All protected routes test authentication requirements:

```typescript
it('should return 401 without authentication', async () => {
  const response = await request(app).get('/api/meetings').expect(401);

  expect(response.body).toMatchObject({
    error: 'Unauthorized',
  });
});
```

### 3. Validation Errors

Test input validation with invalid data:

```typescript
it('should return 400 for missing required fields', async () => {
  const response = await request(app)
    .post('/api/candidates')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ name: 'Test' }) // Missing required fields
    .expect(400);

  expect(response.body).toMatchObject({
    error: 'ValidationError',
    message: 'Invalid input data',
  });
});
```

### 4. Not Found Scenarios

Test handling of non-existent resources:

```typescript
it('should return 404 for non-existent meeting', async () => {
  mockPrismaClient.meetings.findUnique.mockResolvedValueOnce(null);

  const response = await request(app)
    .get('/api/meetings/999')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(404);
});
```

### 5. Database Error Handling

Test graceful handling of database failures:

```typescript
it('should return 500 if database operation fails', async () => {
  mockPrismaClient.meetings.create.mockRejectedValueOnce(new Error('Database error'));

  const response = await request(app)
    .post('/api/meetings')
    .set('Authorization', `Bearer ${authToken}`)
    .send(validData)
    .expect(500);
});
```

### 6. Edge Cases

Test boundary conditions and special scenarios:

```typescript
it('should handle special characters in meeting title', async () => {
  const title = 'Meeting with \'quotes\' and "double quotes" & symbols!';
  // Test implementation
});

it('should handle very long feedback text', async () => {
  const longFeedback = 'A'.repeat(5000);
  // Test implementation
});
```

## 🔧 Configuration

### Jest Configuration

Tests use the backend Jest configuration (`apps/backend/jest.config.ts`):

```typescript
{
  testEnvironment: 'node',
  transform: { '^.+\\.[tj]s$': 'ts-jest' },
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  coverageDirectory: '../../coverage/apps/backend',
}
```

### Mock Setup

Prisma client is mocked at the module level to prevent real database connections:

```typescript
jest.mock('../../utilities/prisma', () => ({
  prisma: mockPrismaClient,
}));
```

## 🧹 Best Practices

### 1. Test Isolation

- Each test is independent and can run in any order
- `beforeEach` resets all mocks to prevent test contamination
- No shared mutable state between tests

### 2. Clear Test Names

- Descriptive test names explain what is being tested
- Follow pattern: "should [expected behavior] when [condition]"

### 3. Arrange-Act-Assert

```typescript
// Arrange: Set up mocks and test data
mockPrismaClient.users.findUnique.mockResolvedValueOnce(testUser);

// Act: Execute the operation
const response = await request(app).post('/api/auth/login').send(credentials);

// Assert: Verify the results
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('token');
```

### 4. Mock Verification

- Verify mocks were called with correct parameters
- Check both successful and error paths
- Reset mocks between tests

### 5. Realistic Test Data

- Use fixtures that resemble production data
- Test with edge cases (empty strings, special characters, very long values)
- Cover different user roles and permissions

## 🐛 Troubleshooting

### Tests Fail to Import

**Issue**: `TypeError: (0, express_1.default) is not a function`

**Solution**: Ensure express and supertest use CommonJS require:

```typescript
const express = require('express');
const request = require('supertest');
```

### Mocks Not Working

**Issue**: Real database is being called

**Solution**: Verify Prisma mock is set up before importing routes:

```typescript
jest.mock('../../utilities/prisma', () => ({
  prisma: mockPrismaClient,
}));
```

### Tests Hang Indefinitely

**Issue**: Async operations not resolving

**Solution**: Ensure all Prisma mocks return resolved promises:

```typescript
mockPrismaClient.users.findUnique.mockResolvedValueOnce(testUser);
```

### Authentication Failures

**Issue**: All protected routes return 401

**Solution**: Generate valid JWT token:

```typescript
const authToken = generateTestToken({ userId: 1, role: 'hr' });
// Use in requests: .set('Authorization', `Bearer ${authToken}`)
```

## 📚 Additional Resources

- **Supertest Documentation**: https://github.com/ladjs/supertest
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Testing Best Practices**: See `CLAUDE.md` Pre-Completion Checklist

## 🎯 Next Steps

To improve test coverage further:

1. **Add E2E Tests**: Use Playwright MCP for full browser automation tests
2. **Performance Testing**: Add load testing for high-traffic scenarios
3. **Security Testing**: Expand security vulnerability tests
4. **Integration Testing**: Test with real database in staging environment
5. **Coverage Reports**: Set up automated coverage reporting in CI/CD

---

**Maintained by**: Meeting Management Development Team
**Last Updated**: 2025
**Test Framework**: Jest 30.x + Supertest 7.x
