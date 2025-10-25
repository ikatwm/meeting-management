# Meeting Management Application

> A production-ready full-stack application for managing candidate interviews and meetings, built with Next.js, Express, PostgreSQL, and Nx monorepo architecture.

[![CI/CD](https://github.com/yourusername/meeting-management/workflows/CI/badge.svg)](https://github.com/yourusername/meeting-management/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd meeting-management

# Set up environment variables
cp .env.docker.example .env

# Start all services (frontend, backend, database)
docker compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3333
```

### Option 2: Local Development

```bash
# Install dependencies
pnpm install

# Set up backend environment
cp apps/backend/.env.example apps/backend/.env
# Update DATABASE_URL and JWT_SECRET in apps/backend/.env

# Set up frontend environment
cp apps/frontend/.env.local.example apps/frontend/.env.local
# Update NEXT_PUBLIC_API_URL in apps/frontend/.env.local

# Generate Prisma client
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Run both frontend and backend
cd ../..
pnpm dev

# Access the application
# Frontend: http://localhost:4200
# Backend: http://localhost:3333
```

## ✨ Features

### Core Functionality

- ✅ **Meeting Management**: Create, view, edit, and delete meetings with pagination
- ✅ **Candidate Tracking**: Manage candidates with status tracking and interview notes
- ✅ **Interview History**: Track all past interviews and feedback
- ✅ **Multi-Participant Meetings**: Support multiple interviewers per meeting
- ✅ **User Authentication**: Secure JWT-based authentication with role-based access
- ✅ **Real-time Validation**: Client and server-side validation with Zod

### Technical Features

- ✅ **Responsive Design**: Mobile, tablet, and desktop support
- ✅ **TypeScript**: 100% type-safe codebase with no 'any' types
- ✅ **REST API**: 18 fully documented endpoints
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **Containerization**: Docker support for all services
- ✅ **CI/CD**: Automated GitHub Actions pipeline
- ✅ **Testing**: Unit tests with Jest
- ✅ **Code Quality**: ESLint, Prettier, Husky pre-commit hooks

## 📦 Technology Stack

| Layer                | Technology                                                      |
| -------------------- | --------------------------------------------------------------- |
| **Frontend**         | Next.js 15, React 19, TypeScript 5.9, Tailwind CSS, NextAuth.js |
| **Backend**          | Node.js, Express 4.21, TypeScript 5.9, Prisma                   |
| **Database**         | PostgreSQL 16                                                   |
| **Authentication**   | JWT, bcrypt, NextAuth.js                                        |
| **Monorepo**         | Nx 22.0.1                                                       |
| **Package Manager**  | pnpm                                                            |
| **Containerization** | Docker, Docker Compose                                          |
| **CI/CD**            | GitHub Actions                                                  |
| **Deployment**       | Vercel (frontend), Render.com (backend)                         |
| **Code Quality**     | ESLint, Prettier, Husky, lint-staged, commitlint                |

## 🏗️ Architecture

```
meeting-management/
├── apps/
│   ├── frontend/              # Next.js application
│   │   ├── src/
│   │   │   ├── app/          # Pages (App Router)
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── lib/          # API client and utilities
│   │   │   └── types/        # TypeScript type definitions
│   │   ├── Dockerfile
│   │   └── vercel.json
│   │
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── collections/  # Data access layer
│   │   │   ├── endpoints/    # API route handlers
│   │   │   ├── utilities/    # Shared utilities
│   │   │   └── main.ts       # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   ├── migrations/   # DB migrations
│   │   │   └── seed.ts       # Sample data
│   │   └── Dockerfile
│   │
│   └── backend-e2e/          # E2E tests
│
├── .github/
│   └── workflows/            # CI/CD pipelines
│       ├── ci.yml           # Continuous integration
│       └── deploy.yml       # Deployment automation
│
├── docker-compose.yml        # Local development environment
├── nx.json                   # Nx workspace config
└── package.json              # Workspace dependencies
```

## 📚 Documentation

### Getting Started

- **[docs/QUICK_START.md](./docs/QUICK_START.md)** - 10-minute setup guide
- **[docs/SETUP.md](./docs/SETUP.md)** - Comprehensive setup and configuration
- **[START_HERE.md](./START_HERE.md)** - Quick demo guide for interviews

### Development

- **[CLAUDE.md](./CLAUDE.md)** - AI assistant guidelines for this project
- **[apps/backend/docs/API_DOCUMENTATION.md](./apps/backend/docs/API_DOCUMENTATION.md)** - Complete API reference
- **[TASK.md](./TASK.md)** - Original requirements and ER diagram

### Deployment & DevOps

- **[docs/DOCKER_SETUP.md](./docs/DOCKER_SETUP.md)** - Docker installation and usage
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production deployment guide
- **[docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md)** - Vercel deployment instructions
- **[docs/CI_CD_GUIDE.md](./docs/CI_CD_GUIDE.md)** - GitHub Actions workflow

### Implementation Details

- **[apps/backend/docs/BACKEND_SUMMARY.md](./apps/backend/docs/BACKEND_SUMMARY.md)** - Backend implementation overview
- **[apps/frontend/docs/FRONTEND_IMPLEMENTATION_SUMMARY.md](./apps/frontend/docs/FRONTEND_IMPLEMENTATION_SUMMARY.md)** - Frontend architecture
- **[docs/DEVOPS_IMPLEMENTATION_SUMMARY.md](./docs/DEVOPS_IMPLEMENTATION_SUMMARY.md)** - DevOps infrastructure
- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - Complete project overview

## 🎯 Available Scripts

### Development

```bash
pnpm dev              # Run both frontend & backend concurrently
pnpm dev:frontend     # Run frontend only (port 4200)
pnpm dev:backend      # Run backend only (port 3333)
```

### Build & Test

```bash
pnpm build            # Build all applications
pnpm build:frontend   # Build frontend only
pnpm build:backend    # Build backend only
pnpm test             # Run all tests
pnpm test:coverage    # Run tests with coverage
```

### Code Quality

```bash
pnpm lint             # Lint all projects
pnpm lint:fix         # Lint and auto-fix issues
pnpm format           # Format all files with Prettier
pnpm typecheck        # Type check all projects
```

### Database

```bash
cd apps/backend
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations (production)
npx prisma db seed            # Seed database with sample data
npx prisma studio             # Open Prisma Studio GUI
npx prisma generate           # Generate Prisma Client
```

### Docker

```bash
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose logs -f        # View logs
docker compose ps             # Check service status
docker compose build          # Rebuild images
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/meeting_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3333
NODE_ENV="development"
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3333/api"
NEXTAUTH_URL="http://localhost:4200"
NEXTAUTH_SECRET="your-nextauth-secret"
```

See `.env.example` files for complete configuration options.

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **users** - HR managers and staff
- **candidates** - Job applicants
- **meetings** - Interview sessions
- **positions** - Job positions
- **interview_participants** - Meeting attendees (many-to-many)
- **candidate_histories** - Interview feedback tracking

See [TASK.md](./TASK.md) for the complete ER diagram.

## 🧪 Testing

### Backend Unit Tests

```bash
cd apps/backend
pnpm test                    # Run tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Generate coverage report
```

**Current Coverage:**

- Authentication utilities: 100%
- JWT validation: 100%
- Input validation schemas: 100%

### Test User Credentials

After running `npx prisma db seed`:

```
Email: sarah@company.com
Password: password123
Role: HR

Email: mike@company.com
Password: password123
Role: Manager

Email: emily@company.com
Password: password123
Role: Staff
```

## 🚢 Deployment

This project uses **GitHub Actions** for automated deployment:

### Automated Deployment (Recommended)

**On every push to `main` branch:**

- ✅ **Frontend** → Automatically deploys to Vercel
- ✅ **Backend** → Automatically deploys to Render.com

**Required GitHub Secrets:**

```bash
# Frontend (Vercel)
VERCEL_TOKEN          # From Vercel Settings → Tokens
VERCEL_ORG_ID         # From .vercel/project.json
VERCEL_PROJECT_ID     # From .vercel/project.json
PRODUCTION_API_URL    # Your backend API URL

# Backend (Render.com)
RENDER_API_KEY        # From Render Dashboard → API Keys
RENDER_SERVICE_ID     # From service URL (srv-xxxxx)
DATABASE_URL          # PostgreSQL connection string
JWT_SECRET            # Generate: openssl rand -base64 32
```

**Setup:**

1. Configure GitHub secrets: `Settings → Secrets → Actions`
2. Push to main branch
3. View deployment status in Actions tab
4. Both apps deploy automatically in ~5-10 minutes

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed setup instructions.

### Manual Deployment

**Frontend (Vercel):**

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy from apps/frontend
cd apps/frontend
vercel --prod
```

**Backend (Render.com):**

```bash
# Via Render Dashboard
1. Connect GitHub repository
2. Select apps/backend as root directory
3. Set build command: pnpm install && pnpm nx build backend --prod
4. Set start command: node dist/apps/backend/main.js
5. Add environment variables
6. Deploy
```

See [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) for complete Vercel instructions.

## 🔒 Security Features

- JWT authentication with httpOnly cookies
- bcrypt password hashing (10 salt rounds)
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet security headers
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection (React default escaping)
- Environment variable validation

## 🎨 UI Components

The frontend includes these reusable components:

- **Button** - Primary, secondary, danger, ghost variants
- **Input** - With label, error handling, validation
- **Select** - Dropdown with options
- **Card** - Content container with header
- **Badge** - Status indicators
- **Modal** - Responsive dialog
- **Loading** - Spinner and full-page states
- **Toast** - Success/error notifications

## 📈 Performance Optimizations

- Multi-stage Docker builds (150-300MB images)
- Next.js standalone output
- Prisma connection pooling ready
- Database indexes on foreign keys
- Pagination for large datasets
- API response caching
- Build caching in CI/CD (~70% reduction)

## 🤝 Git Workflow

This project uses conventional commits with Husky hooks:

```bash
# Commit message format
type(scope): subject

# Examples
feat(backend): add meeting pagination
fix(frontend): resolve login redirect bug
docs: update deployment guide
```

**Allowed types:** feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Pre-commit:** Automatically runs lint-staged
**Commit-msg:** Validates conventional commit format

## 🔍 Nx Workspace Features

```bash
# Show project dependency graph
nx graph

# Run only affected projects
nx affected:build
nx affected:test

# Show project details
nx show project frontend
nx show project backend

# Clear Nx cache
nx reset
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Find and kill process on port 3333 or 4200
lsof -ti:3333 | xargs kill -9
lsof -ti:4200 | xargs kill -9
```

**Prisma Client out of sync:**

```bash
cd apps/backend
npx prisma generate
```

**Docker build fails:**

```bash
# Clear Docker cache
docker compose down -v
docker system prune -a
docker compose build --no-cache
```

See [docs/DOCKER_SETUP.md](./docs/DOCKER_SETUP.md#troubleshooting) for more solutions.

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:

- [Nx](https://nx.dev) - Monorepo tools
- [Next.js](https://nextjs.org) - React framework
- [Express](https://expressjs.com) - Web framework
- [Prisma](https://prisma.io) - Database ORM
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [NextAuth.js](https://next-auth.js.org) - Authentication

---

**Need help?** Check the documentation in the links above or open an issue.
