# Meeting Management - Nx Monorepo Setup

This document provides a comprehensive overview of the Nx monorepo setup for the Meeting Management application.

## Project Structure

```
meeting-management/
├── apps/
│   ├── frontend/              # Next.js application
│   │   ├── src/
│   │   │   ├── app/           # Next.js app directory
│   │   │   └── ...
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── backend/               # Express application
│   │   ├── src/
│   │   │   ├── collections/   # Feature collections
│   │   │   ├── globals/       # Global configurations
│   │   │   ├── fields/        # Field definitions
│   │   │   ├── hooks/         # Collection hooks
│   │   │   ├── endpoints/     # API endpoints
│   │   │   ├── utilities/     # Utility functions
│   │   │   └── main.ts        # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── backend-e2e/           # E2E tests for backend
├── .husky/                    # Git hooks
│   ├── pre-commit
│   └── commit-msg
├── package.json               # Root workspace configuration
├── nx.json                    # Nx workspace configuration
├── tsconfig.base.json         # Shared TypeScript configuration
├── .eslintrc.json             # ESLint configuration
├── .prettierrc                # Prettier configuration
├── .lintstagedrc.json         # Lint-staged configuration
└── commitlint.config.js       # Commitlint configuration
```

## Technology Stack

### Frontend

- **Framework**: Next.js 15.2.5
- **Language**: TypeScript 5.9.3
- **React**: 19.2.0

### Backend

- **Framework**: Express 4.21.2
- **Language**: TypeScript 5.9.3
- **Build Tool**: Webpack 5.x

### Development Tools

- **Monorepo Manager**: Nx 22.0.1
- **Package Manager**: pnpm
- **Linting**: ESLint with @nx/eslint-plugin
- **Formatting**: Prettier 2.8.8
- **Git Hooks**: Husky 9.1.7
- **Commit Linting**: commitlint with conventional commits
- **Staged Files**: lint-staged 16.2.6

## Configuration Details

### TypeScript Configuration

All projects use **strict mode** enabled in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true
    // ... other options
  }
}
```

### Nx Configuration

**Key Features**:

- **Computation Caching**: Build, lint, and test tasks are cached for faster execution
- **Task Pipeline**: Dependencies between tasks are automatically handled
- **Parallel Execution**: Independent tasks run concurrently
- **Affected Commands**: Only rebuild/test what changed

**Target Defaults** (`nx.json`):

- `build`: Cached, depends on dependencies' build
- `lint`: Cached
- `test`: Cached
- `typecheck`: Cached
- `serve`: Not cached (development server)

### ESLint Configuration

**Rules Enforced**:

- No explicit `any` types
- Unused variables error (except prefixed with `_`)
- Explicit function return types (warning)
- Console logs warning (except warn/error)
- Nx module boundary enforcement

### Git Hooks

**Pre-commit** (`.husky/pre-commit`):

- Runs lint-staged
- Lints and formats only staged files
- Ensures code quality before commit

**Commit-msg** (`.husky/commit-msg`):

- Validates commit messages against conventional commits
- Required format: `type(scope?): subject`
- Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

### Lint-staged Configuration

Automatically runs on staged files:

- **TypeScript/JavaScript**: ESLint fix → Prettier format
- **JSON/Markdown/CSS**: Prettier format

## Available Scripts

### Development

```bash
# Run both frontend and backend concurrently
pnpm dev

# Run frontend only
pnpm dev:frontend

# Run backend only
pnpm dev:backend
```

### Building

```bash
# Build all applications
pnpm build

# Build frontend only
pnpm build:frontend

# Build backend only
pnpm build:backend
```

### Code Quality

```bash
# Lint all projects
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Format all files
pnpm format

# Check formatting without changes
pnpm format:check

# Type checking all projects
pnpm typecheck
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Getting Started

### Prerequisites

- Node.js 20.x or later
- pnpm 8.x or later

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd meeting-management
```

2. Install dependencies:

```bash
pnpm install
```

3. Initialize git hooks:

```bash
pnpm prepare
```

### Running the Applications

**Development mode** (both apps):

```bash
pnpm dev
```

The applications will be available at:

- Frontend: http://localhost:4200 (or configured port)
- Backend: http://localhost:3000 (or configured port)

**Running individually**:

```bash
# Frontend only
pnpm dev:frontend

# Backend only
pnpm dev:backend
```

### Building for Production

```bash
# Build all applications
pnpm build

# Output locations:
# - Frontend: apps/frontend/.next
# - Backend: apps/backend/dist
```

## Nx Commands

### Project-specific Commands

```bash
# Serve a specific project
nx serve frontend
nx serve backend

# Build a specific project
nx build frontend
nx build backend

# Lint a specific project
nx lint frontend
nx lint backend

# Test a specific project
nx test backend-e2e
```

### Advanced Nx Commands

```bash
# Show project details
nx show project frontend
nx show project backend

# Show dependency graph
nx graph

# Run affected builds (only changed projects)
nx affected:build

# Run affected tests
nx affected:test

# Reset nx cache
nx reset
```

## Code Organization Guidelines

### Backend Structure

Following the structure defined in TASK.md:

- **collections/**: Feature-specific collections (`src/collections/{feature}.ts`)
- **globals/**: Global configurations (`src/globals/{feature}.ts`)
- **fields/**: Field type definitions (`src/fields/{type}.ts`)
- **hooks/**: Collection operation hooks (`src/hooks/{collection}/{operation}.ts`)
- **endpoints/**: API endpoint handlers (`src/endpoints/{feature}.ts`)
- **utilities/**: Shared utility functions (`src/utilities/{function}.ts`)

### TypeScript Style Guide

- Use TypeScript for all code
- Prefer `type` over `interface` (except for public APIs)
- Avoid `any` or `unknown` types
- Avoid type assertions (`as`, `!`)
- Use functional and declarative patterns
- Export types from central locations

### Naming Conventions

- **Components**: PascalCase
- **Functions/Variables**: camelCase
- **Types/Interfaces**: PascalCase
- **Files**: kebab-case or camelCase (consistent per project)

## Commit Message Guidelines

Follow conventional commits format:

```
type(scope): subject

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (maintenance, etc.)

**Examples**:

```
feat(backend): add meeting CRUD endpoints
fix(frontend): resolve authentication redirect issue
docs: update setup instructions
```

## Troubleshooting

### Clearing Nx Cache

If you encounter build issues:

```bash
nx reset
```

### Reinstalling Dependencies

```bash
rm -rf node_modules apps/*/node_modules
rm pnpm-lock.yaml
pnpm install
```

### Git Hooks Not Running

Ensure husky is initialized:

```bash
pnpm prepare
```

## Next Steps

1. **Environment Setup**: Create `.env` files for environment-specific configuration
2. **Database Setup**: Configure PostgreSQL connection with Prisma
3. **Authentication**: Implement JWT authentication with NextAuth.js
4. **Docker Setup**: Create Dockerfiles for containerization
5. **CI/CD**: Set up GitHub Actions workflows
6. **Deployment**: Configure Vercel deployment

## Additional Resources

- [Nx Documentation](https://nx.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Conventional Commits](https://www.conventionalcommits.org)
