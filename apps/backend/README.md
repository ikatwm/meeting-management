# Meeting Management Backend API

A robust REST API built with Express.js, TypeScript, Prisma, and PostgreSQL for managing candidate interview meetings.

## Features

- JWT-based authentication with bcrypt password hashing
- Complete CRUD operations for meetings, candidates, and participants
- Pagination support for large datasets
- Input validation using Zod
- Rate limiting for API protection
- Security headers with Helmet
- CORS support
- Comprehensive error handling
- TypeScript for type safety
- Prisma ORM for database operations
- Soft delete for meetings

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Zod
- **Security:** Helmet, CORS, express-rate-limit
- **Testing:** Jest, Supertest

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- pnpm (or npm/yarn)

## Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and JWT secret:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/meeting_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3333
NODE_ENV="development"
```

3. Generate Prisma Client:

```bash
npx prisma generate
```

4. Run database migrations:

```bash
npx prisma migrate dev --name init
```

5. (Optional) Seed the database:

```bash
npx prisma db seed
```

## Running the Application

### Development Mode

```bash
pnpm dev:backend
```

### Production Mode

```bash
pnpm build:backend
pnpm start:backend
```

The API will be available at `http://localhost:3333/api`

## Database Schema

### Entities

1. **Users** - Application users (HR, managers, staff)
2. **Positions** - Employee positions within the organization
3. **Candidates** - Job applicants
4. **Applied Positions** - Positions candidates apply for
5. **Meetings** - Interview meetings
6. **Interview Participants** - Users participating in interviews
7. **Candidate Histories** - Feedback and notes from interviews

### ER Diagram

See `TASK.md` for the complete entity-relationship diagram.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (client-side token removal)

### Meetings

- `GET /api/meetings` - List meetings (paginated)
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Soft delete meeting

### Candidates

- `GET /api/candidates` - List all candidates
- `POST /api/candidates` - Create candidate
- `GET /api/candidates/:id` - Get candidate details
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate

### Positions

- `GET /api/positions` - List employee positions
- `GET /api/positions/applied` - List candidate positions

### Interview Participants

- `POST /api/meetings/:id/participants` - Add participant
- `DELETE /api/meetings/:id/participants/:userId` - Remove participant

### Candidate History

- `GET /api/candidates/:id/history` - Get candidate interview history
- `POST /api/candidates/:id/history` - Add feedback to history

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Testing

Run unit tests:

```bash
pnpm test
```

Run tests with coverage:

```bash
pnpm test:coverage
```

Watch mode:

```bash
pnpm test:watch
```

### Test Coverage

Current test coverage includes:

- Authentication utilities (password hashing, JWT)
- Validation schemas (all input validation)
- Database operations (CRUD for all entities)
- API endpoints (integration tests)

Target coverage: >80% for critical paths

## Project Structure

```
apps/backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── collections/           # Data access layer
│   │   ├── users.ts
│   │   ├── meetings.ts
│   │   ├── candidates.ts
│   │   ├── positions.ts
│   │   ├── participants.ts
│   │   └── candidateHistory.ts
│   ├── endpoints/             # API route handlers
│   │   ├── auth.ts
│   │   ├── meetings.ts
│   │   ├── candidates.ts
│   │   ├── positions.ts
│   │   ├── participants.ts
│   │   └── candidateHistory.ts
│   ├── utilities/             # Shared utilities
│   │   ├── prisma.ts         # Prisma client
│   │   ├── jwt.ts            # JWT utilities
│   │   ├── auth.ts           # Password hashing
│   │   ├── validation.ts     # Zod schemas
│   │   ├── middleware.ts     # Express middleware
│   │   └── types.ts          # TypeScript types
│   └── main.ts               # Application entry point
├── .env.example              # Environment variables template
├── jest.config.ts            # Jest configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Database Migrations

### Create a new migration:

```bash
npx prisma migrate dev --name migration_name
```

### Apply migrations in production:

```bash
npx prisma migrate deploy
```

### Reset database (development only):

```bash
npx prisma migrate reset
```

## Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Password Hashing** - bcrypt with salt rounds
3. **Rate Limiting** - 100 requests per 15 minutes per IP
4. **Helmet** - Security headers
5. **CORS** - Cross-origin resource sharing
6. **Input Validation** - Zod schema validation
7. **SQL Injection Prevention** - Parameterized queries via Prisma

## Environment Variables

| Variable                | Description                          | Default     | Required |
| ----------------------- | ------------------------------------ | ----------- | -------- |
| DATABASE_URL            | PostgreSQL connection string         | -           | Yes      |
| JWT_SECRET              | Secret key for JWT signing           | -           | Yes      |
| JWT_EXPIRES_IN          | JWT expiration time                  | 7d          | No       |
| PORT                    | Server port                          | 3333        | No       |
| NODE_ENV                | Environment (development/production) | development | No       |
| RATE_LIMIT_WINDOW_MS    | Rate limit window in ms              | 900000      | No       |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window              | 100         | No       |

## Error Handling

The API uses consistent error responses:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": {} // Optional, for validation errors
}
```

HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Performance Optimization

- Database indexes on frequently queried fields
- Connection pooling via Prisma
- Pagination for large datasets
- Efficient query selection (only needed fields)

## Development Best Practices

1. **Type Safety** - Use TypeScript types, avoid `any`
2. **Validation** - Validate all inputs with Zod
3. **Error Handling** - Always use try-catch blocks
4. **Testing** - Write tests for business logic
5. **Code Organization** - Follow the established structure
6. **Security** - Never expose sensitive data in responses

## Deployment

### Using Docker

```bash
docker build -t meeting-management-backend .
docker run -p 3333:3333 --env-file .env meeting-management-backend
```

### Using Vercel

The backend can be deployed to Vercel with the Vercel Postgres integration.

See the main project README for deployment instructions.

## License

MIT
