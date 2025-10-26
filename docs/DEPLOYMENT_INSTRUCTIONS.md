# Meeting Manager - Deployment Instructions

Complete step-by-step instructions for deploying the Meeting Manager application to production.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Testing](#local-testing)
4. [Production Deployment](#production-deployment)
5. [CI/CD Setup](#cicd-setup)
6. [Verification](#verification)

## Overview

> **Note:** This guide provides Railway-specific deployment instructions. For **Render.com deployment (recommended)**, see [QUICK_START.md](QUICK_START.md) or [DEPLOYMENT.md](DEPLOYMENT.md).

**Architecture:**

- Frontend: Next.js 15 → Vercel
- Backend: Express.js → Render (recommended) or Railway
- Database: PostgreSQL → Managed service (Render/Neon/Railway)
- CI/CD: GitHub Actions

**Estimated Time:** 20-30 minutes (Railway-specific instructions below)

## Prerequisites

Install the following:

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js 20](https://nodejs.org/)
- [Git](https://git-scm.com/)

Create accounts:

- [GitHub](https://github.com) (for code and CI/CD)
- [Vercel](https://vercel.com) (for frontend)
- [Railway](https://railway.app) (for backend and database)

## Local Testing

### 1. Test with Docker Compose

```bash
# Clone repository
git clone <repository-url>
cd meeting-management

# Configure environment
cp .env.docker.example .env

# Edit .env and set secure passwords
nano .env

# Start all services
docker compose up -d

# Check service health
docker compose ps
curl http://localhost:3333/health
curl http://localhost:3000/api/health

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Expected Output:**

- All services show "healthy" status
- Frontend accessible at http://localhost:3000
- Backend API at http://localhost:3333
- Database migrations completed

## Production Deployment

### Step 1: Database Setup (Railway)

**Time: 3 minutes**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init
# Enter project name: meeting-manager

# Add PostgreSQL
railway add postgresql

# Get database URL
railway variables get DATABASE_URL
# Copy this URL for backend configuration
```

**Alternative:** Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for managed PostgreSQL.

### Step 2: Backend Deployment (Railway)

**Time: 8 minutes**

```bash
cd apps/backend

# Link to Railway project
railway link

# Set environment variables
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set NODE_ENV="production"
railway variables set CORS_ORIGIN="https://your-app.vercel.app"  # Update later

# Deploy backend
railway up

# Run database migrations
railway run pnpm prisma migrate deploy

# Get backend URL
railway domain
# Copy this URL: https://meeting-manager-backend.up.railway.app
```

**Verify Backend:**

```bash
curl https://your-backend-url.railway.app/health
# Should return: {"status":"healthy",...}
```

### Step 3: Frontend Deployment (Vercel)

**Time: 7 minutes**

```bash
cd apps/frontend

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initial setup
vercel
# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: (choose your account)
# - Link to existing project: No
# - What's your project's name: meeting-manager
# - In which directory is your code located: apps/frontend
# - Override settings: Yes
#   - Build Command: cd ../.. && pnpm nx build frontend --production
#   - Output Directory: ../../dist/apps/frontend
#   - Install Command: cd ../.. && pnpm install --frozen-lockfile

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-backend-url.railway.app

# Deploy to production
vercel --prod

# Note the deployment URL
# Example: https://meeting-manager-xyz.vercel.app
```

### Step 4: Update Backend CORS

**Time: 2 minutes**

```bash
cd apps/backend

# Update CORS with actual frontend URL
railway variables set CORS_ORIGIN="https://meeting-manager-xyz.vercel.app"

# Restart backend
railway up
```

**Verify CORS:**

```bash
# Test from frontend domain
curl -H "Origin: https://meeting-manager-xyz.vercel.app" \
  https://your-backend-url.railway.app/api
```

### Step 5: Verify Deployment

**Time: 3 minutes**

1. **Test Frontend:**

   - Open: https://meeting-manager-xyz.vercel.app
   - Should load without errors

2. **Test Backend API:**

   ```bash
   curl https://your-backend-url.railway.app/health
   curl https://your-backend-url.railway.app/api
   ```

3. **Test Database:**

   ```bash
   railway run pnpm prisma studio
   # Opens Prisma Studio to view database
   ```

4. **Test Full Integration:**
   - Open frontend in browser
   - Try creating a meeting (after setting up auth)
   - Check browser console for errors

## CI/CD Setup

### Step 1: Configure GitHub Secrets

**Time: 5 minutes**

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Add the following secrets:

**For Vercel Deployment:**

Get Vercel tokens:

```bash
cd apps/frontend
vercel login
vercel link
cat .vercel/project.json
```

Add these secrets:

```
VERCEL_TOKEN=<from https://vercel.com/account/tokens>
VERCEL_ORG_ID=<from .vercel/project.json>
VERCEL_PROJECT_ID=<from .vercel/project.json>
PRODUCTION_API_URL=https://your-backend-url.railway.app
```

**For Railway Deployment:**

Get Railway token:

1. Go to https://railway.app
2. Account Settings → Tokens
3. Create new token

Add secret:

```
RAILWAY_TOKEN=<your-railway-token>
```

### Step 2: Enable Automated Backend Deployment (Optional)

**Time: 2 minutes**

Edit `.github/workflows/deploy.yml`:

1. Uncomment the Railway deployment section:

```yaml
deploy-backend-railway:
  name: Deploy Backend to Railway
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway up --service backend
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

2. Commit and push changes

### Step 3: Configure Branch Protection

**Time: 3 minutes**

1. Go to repository Settings → Branches
2. Add branch protection rule for `main`:
   - Require pull request reviews: 1 approval
   - Require status checks to pass:
     - CI Success
   - Require branches to be up to date
   - Require conversation resolution
3. Save changes

### Step 4: Test CI/CD Pipeline

**Time: 5 minutes**

```bash
# Create test branch
git checkout -b test-ci-pipeline

# Make a small change
echo "# Test CI/CD" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify CI/CD pipeline"
git push origin test-ci-pipeline

# Create pull request on GitHub
# Watch Actions tab for CI pipeline execution
```

**Expected Results:**

- CI pipeline runs all jobs
- All checks pass
- PR can be merged after approval
- Deployment runs after merge to main

## Verification

### Production Checklist

- [ ] **Database**

  - [ ] PostgreSQL database created
  - [ ] Migrations applied successfully
  - [ ] Connection pooling enabled
  - [ ] Backups configured

- [ ] **Backend**

  - [ ] Health check returns 200
  - [ ] API endpoints responding
  - [ ] Environment variables set
  - [ ] CORS configured correctly
  - [ ] Logs accessible

- [ ] **Frontend**

  - [ ] Application loads successfully
  - [ ] API connection working
  - [ ] No console errors
  - [ ] Build completed successfully

- [ ] **CI/CD**

  - [ ] GitHub Actions enabled
  - [ ] Secrets configured
  - [ ] Branch protection active
  - [ ] Pipeline runs successfully
  - [ ] Deployments automatic

- [ ] **Security**
  - [ ] JWT secret is strong (32+ characters)
  - [ ] Database password is secure
  - [ ] HTTPS enabled (automatic on Vercel/Railway)
  - [ ] Security headers configured
  - [ ] CORS properly restricted

### Health Check Commands

```bash
# Backend health
curl https://your-backend.railway.app/health

# Frontend health
curl https://your-frontend.vercel.app/api/health

# Database connection
railway run pnpm prisma db execute --stdin <<< "SELECT 1"

# API endpoints
curl https://your-backend.railway.app/api
```

### Monitoring Setup (Optional)

1. **Error Tracking** - Sentry:

   ```bash
   npm install @sentry/nextjs @sentry/node
   # Configure according to Sentry docs
   ```

2. **Uptime Monitoring** - UptimeRobot:

   - Add monitor for backend health endpoint
   - Add monitor for frontend
   - Set alert email

3. **Log Aggregation** - LogTail:
   - Connect to Railway
   - Configure log retention
   - Set up alerts

## Custom Domains (Optional)

### Frontend Domain (Vercel)

1. Go to Vercel project → Settings → Domains
2. Add your domain: `meetingmanager.com`
3. Configure DNS according to Vercel instructions
4. Wait for SSL certificate (automatic)

### Backend Domain (Railway)

```bash
railway domain add api.meetingmanager.com
# Configure DNS records as instructed
```

Update CORS:

```bash
railway variables set CORS_ORIGIN="https://meetingmanager.com"
```

## Rollback Procedures

### Frontend Rollback (Vercel)

**Via CLI:**

```bash
vercel rollback
```

**Via Dashboard:**

1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Backend Rollback (Railway)

**Via Dashboard:**

1. Go to Railway dashboard
2. Select backend service
3. Go to Deployments tab
4. Find previous deployment
5. Click "Redeploy"

### Database Rollback

```bash
# Rollback last migration
railway run pnpm prisma migrate rollback

# Restore from backup (if configured)
railway backup restore <backup-id>
```

## Troubleshooting

### Common Issues

**1. Backend deployment fails:**

```bash
railway logs
# Check for errors
railway variables
# Verify all variables are set
```

**2. Frontend can't connect to backend:**

```bash
# Check CORS
railway variables get CORS_ORIGIN
# Should match frontend URL exactly

# Test backend directly
curl https://your-backend.railway.app/api
```

**3. Database connection errors:**

```bash
# Verify DATABASE_URL
railway variables get DATABASE_URL

# Test connection
railway run pnpm prisma db execute --stdin <<< "SELECT 1"
```

**4. CI/CD pipeline fails:**

```bash
# Check GitHub Actions logs
# Verify all secrets are set
# Ensure branch protection isn't too strict
```

**5. Migration fails:**

```bash
# Reset database (CAUTION: deletes all data)
railway run pnpm prisma migrate reset

# Deploy migrations
railway run pnpm prisma migrate deploy
```

### Getting Help

1. Check application logs:

   ```bash
   railway logs --tail
   vercel logs
   ```

2. Review documentation:

   - [DOCKER_SETUP.md](/Users/wachiraporn_map/personal-work/meeting-management/DOCKER_SETUP.md)
   - [DEPLOYMENT.md](/Users/wachiraporn_map/personal-work/meeting-management/DEPLOYMENT.md)
   - [CI_CD_GUIDE.md](/Users/wachiraporn_map/personal-work/meeting-management/CI_CD_GUIDE.md)

3. Check platform status:
   - Vercel: https://www.vercel-status.com/
   - Railway: https://railway.statuspage.io/

## Cost Estimation

### Free Tier (Suitable for MVP)

- Vercel: Free (includes custom domains)
- Railway: $5/month (database + backend)
- **Total: $5/month**

### Standard Tier (Production-ready)

- Vercel Pro: $20/month
- Railway: $15/month (scaled resources)
- Monitoring: $10/month (Sentry/LogTail)
- **Total: $45/month**

### Enterprise Tier (High traffic)

- Vercel Enterprise: Custom pricing
- Railway: $50+/month (multiple instances)
- Monitoring & Analytics: $50/month
- **Total: $150+/month**

## Next Steps

1. **Immediate** (today):

   - ✅ Deploy to production
   - ✅ Verify all services
   - ✅ Test complete workflow

2. **This Week**:

   - [ ] Set up monitoring (Sentry)
   - [ ] Configure backups
   - [ ] Load testing
   - [ ] Security audit

3. **This Month**:
   - [ ] Custom domains
   - [ ] Staging environment
   - [ ] E2E tests in CI/CD
   - [ ] Performance optimization

## Success Criteria

Your deployment is successful when:

- ✅ Frontend loads at production URL
- ✅ Backend API responds to requests
- ✅ Database queries work correctly
- ✅ CORS configured properly
- ✅ HTTPS enabled (automatic)
- ✅ Health checks return 200
- ✅ CI/CD pipeline runs successfully
- ✅ No errors in logs
- ✅ Authentication works
- ✅ Data persists correctly

**Congratulations!** Your Meeting Manager application is now live in production! 🚀

---

**Need Help?**

- 📚 [Full Documentation](DEVOPS_IMPLEMENTATION_SUMMARY.md)
- 🐳 [Docker Guide](DOCKER_SETUP.md)
- 🚀 [Quick Start](QUICK_START.md)
- 🔧 [CI/CD Details](CI_CD_GUIDE.md)
