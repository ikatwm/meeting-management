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

### Option 1: Vercel + Render.com (Recommended)

**Total time: 15-20 minutes**

#### Step 1: Deploy Database on Render (3 minutes)

1. Go to https://render.com and sign in
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `meeting-db`
   - Database: `meeting_db`
   - User: `meeting_user`
   - Region: Choose closest to your users
   - Plan: Free (or paid for production)
4. Click "Create Database"
5. Copy the "Internal Database URL" for next step

#### Step 2: Deploy Backend on Render (5 minutes)

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: `meeting-backend`
   - Region: Same as database
   - Branch: `main`
   - Root Directory: `apps/backend`
   - Environment: `Docker`
   - Dockerfile Path: `apps/backend/Dockerfile`
   - Instance Type: Free (or paid for production)
4. Add Environment Variables:
   ```
   DATABASE_URL=<paste internal database URL from step 1>
   JWT_SECRET=<generate with: openssl rand -base64 32>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=3333
   ```
5. Click "Create Web Service"
6. Wait for deployment to complete (~3-5 minutes)
7. Copy your backend URL (e.g., `https://meeting-backend.onrender.com`)

#### Step 3: Deploy Frontend on Vercel (5 minutes)

```bash
cd apps/frontend

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://meeting-backend.onrender.com/api

vercel env add NEXTAUTH_URL production
# Enter: https://your-app.vercel.app

vercel env add NEXTAUTH_SECRET production
# Enter a random secret (use: openssl rand -base64 32)

# Deploy to production
vercel --prod
```

#### Step 4: Update Backend CORS (2 minutes)

1. Go back to Render dashboard
2. Open your backend service
3. Go to "Environment" tab
4. Add environment variable:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
5. Service will auto-redeploy with new settings

Done! Your app is live.

### Option 2: Alternative Platforms

**Railway:**

```bash
railway login
railway init
railway add postgresql
railway up
```

**Fly.io:**

```bash
fly launch
fly deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on alternative platforms.

## GitHub Actions Setup

### 1. Add Secrets

Go to GitHub → Settings → Secrets → Actions

```
VERCEL_TOKEN=<from https://vercel.com/account/tokens>
VERCEL_ORG_ID=<from vercel link command>
VERCEL_PROJECT_ID=<from vercel link command>
PRODUCTION_API_URL=https://meeting-backend.onrender.com
RENDER_API_KEY=<from https://dashboard.render.com/u/settings#api-keys>
RENDER_SERVICE_ID=<from your service's "Settings" tab on Render>
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

# Render deployment failed
# Check logs in Render dashboard or use Render CLI:
render logs -s <service-id>

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
# Connect to Render service shell and run migrations:
# In Render dashboard: Service → Shell tab, then run:
pnpm prisma migrate reset
pnpm prisma migrate deploy

# Or use Render CLI:
render shell -s <service-id>
# Then run migration commands above
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

# Render (via Dashboard)
# Most operations done through https://dashboard.render.com
# - Deploy: Push to GitHub (auto-deploys)
# - Logs: Service → Logs tab
# - Environment: Service → Environment tab
# - Shell: Service → Shell tab

# Render CLI (optional)
render login                      # Login to Render
render services                   # List services
render logs -s <service-id>       # View logs
render shell -s <service-id>      # Open shell

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
