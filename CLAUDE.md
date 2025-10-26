# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Meeting Manager** - A full-stack TypeScript monorepo application for managing candidate interviews and meetings. Built with Nx monorepo structure, Next.js frontend, Express backend, and Vercel Postgres database.

## Tech Stack

- **Monorepo**: Nx workspace with separate frontend and backend apps
- **Frontend**: Next.js, TypeScript, Tailwind CSS, NextAuth.js
- **Backend**: Node.js, Express, TypeScript, JWT authentication, Prisma
- **Database**: PostgresSQL (Prisma Vercel)
- **Infrastructure**: Docker, GitHub Actions CI/CD, Vercel deployment
- **Quality Tools**: Husky, lint-staged, ESLint, unit tests

## Database Schema

Key entities and relationships (refer to [ERDIAGRAM.md](docs/ERDIAGRAM.md) for full ER diagram):

- **users**: HR/managers/staff with roles and positions
- **meetings**: Interview sessions with candidates (title, time, location, type, status)
- **candidates**: Job applicants with status tracking and interview notes
- **interview_participants**: Many-to-many join table for meeting attendees
- **positions** and **applied_positions**: Job roles tracking
- **candidate_histories**: Interview feedback and historical records

**Important relationships**:

- Users organize meetings; candidates are scheduled for meetings
- Meetings support multiple participants via interview_participants join table
- Candidates have historical feedback tracked through candidate_histories

## Architecture Patterns

### File Structure Convention

```
src/
├── collections/{feature}.ts    # Data collections/models
├── globals/{feature}.ts        # Global configurations
├── fields/{type}.ts            # Reusable field definitions
├── hooks/{collection}/{operation}.ts  # Lifecycle hooks
├── endpoints/{feature}.ts      # API route handlers
└── utilities/{function}.ts     # Shared utility functions
```

### TypeScript Style

- **Types over interfaces** except for public APIs
- **Functional programming**: Avoid classes, prefer pure functions
- **No 'any' or 'unknown'**: Use precise types that reflect data models
- **Avoid type assertions**: Minimize 'as' or '!' operators
- **Named exports**: For components and utilities
- **Naming**: PascalCase for types/components, camelCase for functions/variables

### Code Organization

- Structure files: exported component → GraphQL queries → helpers → static content → types
- Use descriptive variable names with auxiliary verbs (isLoaded, hasError)
- Prefer iteration and modularization over duplication
- Use constants for magic numbers and repeated values

## Security Requirements

- JWT-based authentication for all protected routes
- Input sanitization to prevent injection attacks
- Environment variables for all sensitive configuration
- Rate limiting on API endpoints
- HTTPS-only communications
- Principle of least privilege for API access

## Performance Considerations

- Database query optimization with proper indexing
- Pagination for large datasets (required for meeting lists)
- Caching strategies for frequently accessed data
- Lazy loading where appropriate
- Monitor API response times

## Testing Strategy

- Unit tests for backend business logic (required)
- Integration tests for API endpoints
- Mock external dependencies
- E2E tests for critical user flows (login, meeting CRUD)
- Follow TDD when appropriate

## Key User Flows

1. **Authentication**: Login/logout with JWT tokens
2. **Dashboard**: View upcoming meetings with pagination
3. **Meeting CRUD**: Create, view, edit, delete meetings
4. **Candidate Management**: View candidate profiles, add interview notes, track history
5. **Booking**: Schedule meetings with date/time pickers, meeting type selection

## Development Workflow

- **Git workflow**: Feature branches, clear commit messages
- **Husky + lint-staged**: Pre-commit hooks for linting
- **CI/CD**: GitHub Actions for build, lint, code review, unit tests, deployment
- **Containerization**: Docker for frontend, backend, and database
- **Deployment**: Vercel for production hosting

## Pre-Completion Checklist

**IMPORTANT**: Before marking any task as complete, verify ALL of the following:

### 1. Services Can Start

```bash
pnpm dev  # Both frontend and backend must start without errors
```

- ✅ Frontend starts on http://localhost:3000
- ✅ Backend starts on http://localhost:3333
- ✅ No startup errors or crashes

### 2. Lint Must Pass

```bash
pnpm format        # Auto-fix formatting issues
pnpm exec lint-staged  # Run pre-commit checks
```

- ✅ ESLint passes (no errors)
- ✅ Prettier formatting is correct
- ✅ Pre-commit hooks succeed

### 3. Tests Must Pass (when configured)

```bash
pnpm test  # Run all unit tests
```

- ✅ All unit tests pass
- ✅ No test failures or errors
- ⚠️ Note: Test infrastructure not yet configured in this project

### 4. TypeScript Validation (recommended but not blocking)

```bash
pnpm typecheck  # Check for type errors
```

- ⚠️ TypeScript errors should be fixed when possible
- ⚠️ Not currently blocking commits (not in pre-commit hook)

### Verification Commands

```bash
# Quick pre-completion check
pnpm format && pnpm dev &
sleep 10
pkill -f "nx|next"
```

**Never mark a task complete if any of these checks fail!**

## AI Collaboration Guidelines

- Ask clarifying questions when multiple implementation paths exist
- Present trade-offs between different approaches with pros/cons
- Confirm understanding of complex feature requirements
- Suggest alternatives for potential performance or security issues
- Request context about existing patterns before implementing new features
- Prioritize consistency with established codebase patterns
- Consider scalability for database schema design
- Balance performance optimization with code maintainability
  test
