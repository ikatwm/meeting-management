# Backend Testing Infrastructure

Comprehensive Jest testing utilities and documentation for the Meeting Manager backend application.

## Table of Contents

- [Getting Started](#getting-started)
- [Test Structure](#test-structure)
- [Test Utilities](#test-utilities)
  - [Database Helpers](#database-helpers)
  - [API Helpers](#api-helpers)
  - [Test Fixtures](#test-fixtures)
  - [Mock Factories](#mock-factories)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)

## Getting Started

### Prerequisites

```bash
# All dependencies are already installed
pnpm install
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test src/utilities/__tests__/auth.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="should hash password"
```

## Test Structure

```
apps/backend/src/
├── __tests__/
│   ├── utils/                    # Test utilities
│   │   ├── database.helpers.ts   # Prisma mocking utilities
│   │   ├── api.helpers.ts        # Supertest/API utilities
│   │   ├── fixtures.ts           # Sample test data
│   │   ├── factories.ts          # Data factory functions
│   │   └── index.ts              # Centralized exports
│   └── README.md                 # This file
├── utilities/__tests__/          # Utility function tests
├── endpoints/__tests__/          # API endpoint tests (to be created)
├── collections/__tests__/        # Collection tests (to be created)
└── test-setup.ts                 # Global test configuration
```

## Test Utilities

### Database Helpers

Located in `__tests__/utils/database.helpers.ts`

#### Creating Mock Prisma Client

```typescript
import { createMockPrisma } from './__tests__/utils';

// Create a mock Prisma client
const mockPrisma = createMockPrisma();

// Mock Prisma in your module
jest.mock('./utilities/prisma', () => ({
  prisma: mockPrisma,
}));
```

#### Mocking Database Operations

```typescript
import { createMockPrisma, userFixtures } from './__tests__/utils';

const mockPrisma = createMockPrisma();

describe('User Service', () => {
  it('should find user by email', async () => {
    // Setup mock response
    mockPrisma.user.findUnique.mockResolvedValue(userFixtures.hrUser);

    // Call your service
    const user = await findUserByEmail('hr@example.com');

    // Assertions
    expect(user).toBeDefined();
    expect(user?.email).toBe('hr@example.com');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'hr@example.com' },
    });
  });
});
```

#### Resetting Mocks Between Tests

```typescript
import { resetPrismaMocks } from './__tests__/utils';

beforeEach(() => {
  resetPrismaMocks(mockPrisma);
});
```

#### Mocking Database Errors

```typescript
import { mockDatabaseError, PrismaErrorCodes } from './__tests__/utils';

it('should handle unique constraint violation', async () => {
  mockPrisma.user.create.mockRejectedValue(
    mockDatabaseError(PrismaErrorCodes.UNIQUE_CONSTRAINT, 'Email already exists')
  );

  await expect(createUser({ email: 'existing@example.com' })).rejects.toThrow();
});
```

#### Mocking Transactions

```typescript
import { mockTransaction, createMockPrisma } from './__tests__/utils';

it('should handle transaction', async () => {
  mockPrisma.$transaction.mockImplementation(
    mockTransaction(async (tx) => {
      // Transaction logic
      return result;
    })
  );
});
```

### API Helpers

Located in `__tests__/utils/api.helpers.ts`

#### Testing Protected Endpoints

```typescript
import { createAuthenticatedRequest } from './__tests__/utils';
import app from '../main';

describe('GET /api/meetings', () => {
  it('should return meetings for authenticated user', async () => {
    const request = createAuthenticatedRequest(app, {
      userId: 1,
      role: 'hr',
    });

    const response = await request.get('/api/meetings').expect(200);

    expect(response.body).toHaveProperty('meetings');
    expect(response.body).toHaveProperty('pagination');
  });
});
```

#### Testing Public Endpoints

```typescript
import { createRequest } from './__tests__/utils';
import app from '../main';

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const request = createRequest(app);

    const response = await request
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });
});
```

#### Creating Auth Tokens

```typescript
import { createAuthToken } from './__tests__/utils';
import request from 'supertest';
import app from '../main';

it('should access protected endpoint with token', async () => {
  const token = createAuthToken({ userId: 2, role: 'manager' });

  const response = await request(app)
    .get('/api/meetings')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});
```

#### Validating Responses

```typescript
import { expectValidResponse, expectErrorResponse } from './__tests__/utils';

it('should return valid response', async () => {
  const response = await request(app).get('/api/positions');

  expectValidResponse(response, 200, {
    positions: expect.any(Array),
  });
});

it('should return error for invalid request', async () => {
  const response = await request(app).get('/api/meetings/999');

  expectErrorResponse(response, 404, 'Meeting not found');
});
```

#### Testing Pagination

```typescript
import { expectPaginatedResponse } from './__tests__/utils';

it('should return paginated results', async () => {
  const response = await request(app).get('/api/meetings?page=2&pageSize=10');

  expectPaginatedResponse(response, {
    page: 2,
    pageSize: 10,
    total: 50,
    totalPages: 5,
  });
});
```

#### Testing Role-Based Authorization

```typescript
import { testRoleAuthorization } from './__tests__/utils';

it('should enforce role-based access', async () => {
  await testRoleAuthorization(app, '/api/meetings', ['hr', 'manager'], 'staff');
  // HR and manager can access, staff gets 403
});
```

### Test Fixtures

Located in `__tests__/utils/fixtures.ts`

Pre-defined sample data for all database models.

#### Using Fixtures

```typescript
import { userFixtures, meetingFixtures, candidateFixtures } from './__tests__/utils';

describe('Meeting Service', () => {
  it('should find meeting with user and candidate', async () => {
    mockPrisma.meeting.findUnique.mockResolvedValue({
      ...meetingFixtures.upcomingMeeting,
      user: userFixtures.hrUser,
      candidate: candidateFixtures.appliedCandidate,
    });

    const meeting = await findMeetingById(1);
    expect(meeting?.user?.name).toBe('HR Manager');
  });
});
```

#### Available Fixtures

```typescript
// Users with different roles
userFixtures.hrUser;
userFixtures.managerUser;
userFixtures.staffUser;

// Candidates in different stages
candidateFixtures.appliedCandidate;
candidateFixtures.screeningCandidate;
candidateFixtures.interviewCandidate;
candidateFixtures.offerCandidate;

// Meetings of different types
meetingFixtures.upcomingMeeting;
meetingFixtures.zoomMeeting;
meetingFixtures.pendingMeeting;
meetingFixtures.pastMeeting;

// Positions and applied positions
positionFixtures.seniorDeveloper;
appliedPositionFixtures.fullStackDeveloper;

// Interview participants and history
interviewParticipantFixtures.participant1;
candidateHistoryFixtures.history1;
```

#### Creating Complete Objects

```typescript
import { createCompleteMeeting, createCompleteCandidate } from './__tests__/utils';

// Meeting with all relationships
const meeting = createCompleteMeeting({
  title: 'Custom Interview',
});
// Returns meeting with user, candidate, and participants

// Candidate with all relationships
const candidate = createCompleteCandidate({
  status: 'interview',
});
// Returns candidate with appliedPosition, meetings, and histories
```

### Mock Factories

Located in `__tests__/utils/factories.ts`

Factory functions for creating test data with custom properties.

#### Creating Single Objects

```typescript
import { createUser, createMeeting, createCandidate } from './__tests__/utils';

// Create with defaults
const user = createUser();

// Create with overrides
const hrUser = createUser({
  role: 'hr',
  email: 'custom@example.com',
});

// Create meeting for tomorrow
const meeting = createMeeting({
  title: 'Technical Interview',
  candidateId: 5,
});

// Create candidate
const candidate = createCandidate({
  status: 'interview',
  interviewNotes: 'Strong technical background',
});
```

#### Creating Batches

```typescript
import { createBatch, createUser, createCandidate } from './__tests__/utils';

// Create 10 users with sequential IDs
const users = createBatch(createUser, 10, (index) => ({
  id: index + 1,
  email: `user${index + 1}@example.com`,
}));

// Create 5 candidates
const candidates = createBatch(createCandidate, 5, (index) => ({
  id: index + 1,
  status: index % 2 === 0 ? 'applied' : 'screening',
}));
```

#### Creating Request Objects

```typescript
import {
  createMeetingRequest,
  createCandidateRequest,
  createRegisterRequest,
} from './__tests__/utils';

// Create meeting request payload
const meetingData = createMeetingRequest({
  title: 'Custom Interview',
  meetingType: 'zoom',
});

// Use in API test
const response = await request(app).post('/api/meetings').send(meetingData).expect(201);
```

#### Creating Objects with Relations

```typescript
import { createMeetingWithRelations, createCandidateWithRelations } from './__tests__/utils';

// Meeting with user, candidate, and participants
const meeting = createMeetingWithRelations({
  title: 'Panel Interview',
});

// Candidate with position, meetings, and history
const candidate = createCandidateWithRelations({
  status: 'offer',
});
```

#### Creating Paginated Responses

```typescript
import { createPaginatedResponse, createBatch, createMeeting } from './__tests__/utils';

const meetings = createBatch(createMeeting, 10);
const paginatedResponse = createPaginatedResponse(meetings, 1, 10, 50);

// Returns:
// {
//   meetings: [...10 meetings...],
//   pagination: { total: 50, page: 1, pageSize: 10, totalPages: 5 }
// }
```

## Writing Tests

### Unit Test Example

```typescript
// src/utilities/__tests__/validation.test.ts
import { validateEmail, validatePassword } from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should require minimum length', () => {
      expect(validatePassword('short')).toBe(false);
    });

    it('should accept strong password', () => {
      expect(validatePassword('SecurePassword123!')).toBe(true);
    });
  });
});
```

### Integration Test Example

```typescript
// src/endpoints/__tests__/meetings.test.ts
import request from 'supertest';
import { createAuthToken, createMockPrisma, meetingFixtures } from '../../__tests__/utils';
import app from '../../main';

const mockPrisma = createMockPrisma();

jest.mock('../../utilities/prisma', () => ({
  prisma: mockPrisma,
}));

describe('GET /api/meetings', () => {
  it('should return paginated meetings', async () => {
    mockPrisma.meeting.findMany.mockResolvedValue([meetingFixtures.upcomingMeeting]);
    mockPrisma.meeting.count.mockResolvedValue(1);

    const token = createAuthToken({ userId: 1, role: 'hr' });

    const response = await request(app)
      .get('/api/meetings?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.meetings).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
  });
});
```

### API Endpoint Test Template

```typescript
import request from 'supertest';
import {
  createAuthToken,
  createMockPrisma,
  resetPrismaMocks,
  expectValidResponse,
  expectErrorResponse,
} from '../../__tests__/utils';
import app from '../../main';

const mockPrisma = createMockPrisma();

jest.mock('../../utilities/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Endpoint Name', () => {
  beforeEach(() => {
    resetPrismaMocks(mockPrisma);
  });

  describe('Success Cases', () => {
    it('should handle valid request', async () => {
      // Setup mocks
      mockPrisma.model.operation.mockResolvedValue(/* data */);

      // Make request
      const token = createAuthToken();
      const response = await request(app)
        .get('/api/endpoint')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assertions
      expectValidResponse(response, 200, {
        /* expected structure */
      });
    });
  });

  describe('Error Cases', () => {
    it('should handle not found', async () => {
      mockPrisma.model.operation.mockResolvedValue(null);

      const token = createAuthToken();
      const response = await request(app)
        .get('/api/endpoint/999')
        .set('Authorization', `Bearer ${token}`);

      expectErrorResponse(response, 404, 'Not found');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/endpoint');

      expect(response.status).toBe(401);
    });
  });
});
```

## Coverage Requirements

### Global Coverage Thresholds

```javascript
{
  branches: 70%,
  functions: 75%,
  lines: 75%,
  statements: 75%
}
```

### Critical Path Coverage (Utilities)

```javascript
{
  branches: 80%,
  functions: 85%,
  lines: 85%,
  statements: 85%
}
```

### API Endpoints Coverage

```javascript
{
  branches: 75%,
  functions: 80%,
  lines: 80%,
  statements: 80%
}
```

### Viewing Coverage

```bash
# Generate coverage report
pnpm test --coverage

# Open HTML report
open ../../coverage/apps/backend/index.html
```

## Best Practices

### 1. Test Organization

- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain what is being tested
- **Follow AAA pattern**: Arrange → Act → Assert

```typescript
describe('Meeting Service', () => {
  describe('createMeeting', () => {
    it('should create meeting with valid data', async () => {
      // Arrange
      const meetingData = createMeetingRequest();
      mockPrisma.meeting.create.mockResolvedValue(meetingFixtures.upcomingMeeting);

      // Act
      const result = await createMeeting(meetingData);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe(meetingData.title);
    });
  });
});
```

### 2. Mock Management

- **Reset mocks between tests** to prevent test interdependence
- **Be explicit about mock behavior** for each test
- **Don't over-mock**: Only mock external dependencies

```typescript
beforeEach(() => {
  resetPrismaMocks(mockPrisma);
});

it('should handle specific case', async () => {
  // Explicit mock setup for this test
  mockPrisma.meeting.findUnique.mockResolvedValue(meetingFixtures.upcomingMeeting);
});
```

### 3. Test Data Management

- **Use factories for dynamic data** that needs unique values
- **Use fixtures for static data** that doesn't change
- **Keep test data minimal** but representative

```typescript
// Good: Using factory for unique emails
const user1 = createUser(); // Generates unique email
const user2 = createUser(); // Different unique email

// Good: Using fixture for known data
const hrUser = userFixtures.hrUser; // Consistent test data
```

### 4. Async Testing

- **Always await async operations**
- **Use proper error handling**
- **Test both success and failure paths**

```typescript
it('should handle async operation', async () => {
  mockPrisma.meeting.create.mockResolvedValue(meetingFixtures.upcomingMeeting);

  await expect(createMeeting(validData)).resolves.toBeDefined();
});

it('should handle async errors', async () => {
  mockPrisma.meeting.create.mockRejectedValue(new Error('Database error'));

  await expect(createMeeting(validData)).rejects.toThrow('Database error');
});
```

### 5. API Testing

- **Test authentication and authorization**
- **Validate request/response structures**
- **Test error conditions**
- **Verify database calls**

```typescript
it('should create meeting with authentication', async () => {
  const token = createAuthToken({ userId: 1, role: 'hr' });
  const meetingData = createMeetingRequest();

  mockPrisma.meeting.create.mockResolvedValue(meetingFixtures.upcomingMeeting);

  const response = await request(app)
    .post('/api/meetings')
    .set('Authorization', `Bearer ${token}`)
    .send(meetingData)
    .expect(201);

  expect(response.body).toHaveProperty('id');
  expect(mockPrisma.meeting.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      title: meetingData.title,
      userId: 1,
    }),
  });
});
```

### 6. Testing Patterns to Avoid

❌ **Don't test implementation details**

```typescript
// Bad: Testing internal implementation
expect(service.internalMethod).toHaveBeenCalled();
```

✅ **Do test behavior and outcomes**

```typescript
// Good: Testing behavior
expect(result.status).toBe('created');
expect(mockPrisma.meeting.create).toHaveBeenCalled();
```

❌ **Don't write brittle tests**

```typescript
// Bad: Testing exact error message
expect(error.message).toBe('Validation failed at field X on line 42');
```

✅ **Do test error categories**

```typescript
// Good: Testing error type
expect(error).toBeInstanceOf(ValidationError);
expect(error.field).toBe('email');
```

## Troubleshooting

### Common Issues

#### Issue: Mocks not resetting between tests

**Solution**: Add `resetPrismaMocks` to `beforeEach`

```typescript
beforeEach(() => {
  resetPrismaMocks(mockPrisma);
});
```

#### Issue: TypeScript errors with Prisma types

**Solution**: Import types from `@prisma/client`

```typescript
import type { User, Meeting } from '@prisma/client';
```

#### Issue: Tests timing out

**Solution**: Increase timeout or check for unresolved promises

```typescript
it('should handle long operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

#### Issue: Module not found errors

**Solution**: Check Jest module resolution in `jest.config.ts`

```typescript
// Ensure proper module extensions
moduleFileExtensions: ['ts', 'js', 'html'];
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [TypeScript Jest Guide](https://kulshekhar.github.io/ts-jest/)

## Contributing

When adding new test utilities:

1. Add the utility function to the appropriate helper file
2. Include JSDoc comments with usage examples
3. Export from `__tests__/utils/index.ts`
4. Update this README with usage documentation
5. Add tests for the utility if it contains complex logic
