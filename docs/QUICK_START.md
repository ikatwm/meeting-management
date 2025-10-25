# Quick Start Guide

Get the Meeting Manager application running in under 10 minutes.

## Prerequisites

- Docker Desktop installed
- Node.js 20 installed
- Git installed

## Local Development (Docker)

### 1. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd meeting-management

# Copy environment file
cp .env.docker.example .env
```

### 2. Edit Environment Variables

Open `.env` and update:

```env
POSTGRES_PASSWORD=change_me_to_secure_password
JWT_SECRET=change_me_to_random_32_char_string
```

### 3. Start All Services

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f
```

### 4. Access Applications

- Frontend: http://localhost:3000
- Backend API: http://localhost:3333
- API Docs: http://localhost:3333/api

### 5. Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Production Deployment

### Option 1: Vercel + Railway (Recommended)

**Total time: 15-20 minutes**

#### Step 1: Deploy Database (2 minutes)

```bash
# Railway
railway login
railway init
railway add postgresql
railway variables get DATABASE_URL  # Copy this
```

#### Step 2: Deploy Backend (5 minutes)

```bash
cd apps/backend

# Set environment variables
railway variables set JWT_SECRET="your-32-char-secret"
railway variables set CORS_ORIGIN="https://your-app.vercel.app"
railway variables set NODE_ENV="production"

# Deploy
railway up

# Run migrations
railway run pnpm prisma migrate deploy

# Get URL
railway domain  # Copy backend URL
```

#### Step 3: Deploy Frontend (5 minutes)

```bash
cd apps/frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-backend.railway.app

# Deploy to production
vercel --prod
```

#### Step 4: Update CORS (2 minutes)

```bash
# Update backend CORS with frontend URL
railway variables set CORS_ORIGIN="https://your-app.vercel.app"
```

Done! Your app is live.

### Option 2: All-in-One Render

**Total time: 20 minutes**

1. Go to https://render.com
2. Connect GitHub repository
3. Create PostgreSQL database
4. Create Web Service for backend
   - Environment: Docker
   - Dockerfile: `apps/backend/Dockerfile`
   - Add environment variables
5. Deploy frontend to Vercel (same as above)

## GitHub Actions Setup

### 1. Add Secrets

Go to GitHub → Settings → Secrets → Actions

```
VERCEL_TOKEN=<from https://vercel.com/account/tokens>
VERCEL_ORG_ID=<from vercel link command>
VERCEL_PROJECT_ID=<from vercel link command>
PRODUCTION_API_URL=https://your-backend.railway.app
RAILWAY_TOKEN=<from railway dashboard>
```

### 2. Enable Branch Protection

Settings → Branches → Add rule for `main`:

- Require status checks: ✓
- Require approvals: 1
- Required checks: CI Success

### 3. Test Pipeline

```bash
git checkout -b test-ci
git push origin test-ci
# Create PR and watch Actions tab
```

## Troubleshooting

### Docker Issues

```bash
# Container won't start
docker compose logs <service-name>

# Database connection failed
docker compose exec postgres pg_isready

# Reset everything
docker compose down -v
docker system prune -a
docker compose up --build
```

### Deployment Issues

```bash
# Vercel deployment failed
vercel logs

# Railway deployment failed
railway logs

# Check health endpoints
curl https://your-backend/health
curl https://your-frontend/api/health
```

### Common Errors

**Port already in use:**

```bash
lsof -i :3000
kill -9 <PID>
```

**Database migration failed:**

```bash
railway run pnpm prisma migrate reset
railway run pnpm prisma migrate deploy
```

**CORS errors:**

- Verify CORS_ORIGIN matches frontend URL exactly
- Include https://
- No trailing slash

## Next Steps

- Read [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker commands
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment details
- Read [CI_CD_GUIDE.md](CI_CD_GUIDE.md) for CI/CD pipeline details
- Configure monitoring and backups
- Set up custom domains

## Getting Help

1. Check logs: `docker compose logs`
2. Review troubleshooting guides in documentation
3. Check GitHub Issues
4. Verify environment variables

## Quick Commands Reference

```bash
# Docker
docker compose up -d              # Start services
docker compose down               # Stop services
docker compose logs -f            # Follow logs
docker compose ps                 # List services
docker compose restart backend    # Restart service

# Railway
railway login                     # Login
railway init                      # Initialize project
railway up                        # Deploy
railway logs                      # View logs
railway variables                 # List variables

# Vercel
vercel login                      # Login
vercel                            # Deploy to preview
vercel --prod                     # Deploy to production
vercel logs                       # View logs
vercel env ls                     # List environment variables
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database deployed and accessible
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and healthy
- [ ] CORS configured correctly
- [ ] Database migrations applied
- [ ] Health checks passing
- [ ] GitHub secrets configured
- [ ] Branch protection enabled
- [ ] Custom domains configured (optional)
- [ ] Monitoring set up (optional)

**Everything ready?** Your Meeting Manager app is production-ready! 🚀
