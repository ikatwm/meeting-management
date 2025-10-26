# Deployment Guide

Complete production deployment guide for the Meeting Manager application.

## Table of Contents

- [Overview](#overview)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment Options](#backend-deployment-options)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

**Recommended Production Stack:**

- **Frontend**: Vercel (optimized for Next.js)
- **Backend**: Render, Railway, or Fly.io (Render recommended)
- **Database**: Managed PostgreSQL (Neon, Supabase, Render, or Railway)

**Deployment Checklist:**

- [ ] Set up managed PostgreSQL database
- [ ] Deploy backend API
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Deploy frontend to Vercel
- [ ] Configure custom domains
- [ ] Set up monitoring and logging
- [ ] Test all endpoints

## Frontend Deployment (Vercel)

### Prerequisites

- Vercel account ([signup](https://vercel.com/signup))
- GitHub repository connected to Vercel
- Backend API deployed and accessible

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Configure Project

From the project root:

```bash
cd apps/frontend
vercel
```

Follow the prompts:

- Set up and deploy: **Yes**
- Scope: Choose your team or personal account
- Link to existing project: **No**
- Project name: **meeting-manager** (or your choice)
- Directory: **apps/frontend**
- Override settings: **Yes**
  - Build Command: `cd ../.. && pnpm nx build frontend --configuration=production`
  - Output Directory: `../../dist/apps/frontend`
  - Install Command: `cd ../.. && pnpm install --frozen-lockfile`

### Step 4: Set Environment Variables

In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add the following variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

Or via CLI:

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-backend-url.onrender.com
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

### Step 6: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update CORS settings in backend to include your domain

### GitHub Integration

For automatic deployments on push:

1. Go to Vercel Dashboard → Git
2. Connect your GitHub repository
3. Configure automatic deployments:
   - Production Branch: `main`
   - Preview Branches: all branches

**GitHub Secrets Required:**

```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>
```

Get these from:

- Token: https://vercel.com/account/tokens
- IDs: Run `vercel project ls` and `vercel org ls`

## Backend Deployment Options

### Option 1: Render (Recommended)

**Advantages**: Free tier available, automatic SSL, integrated database, Docker support

#### Setup Steps

1. **Create Account**: https://render.com/

2. **Create PostgreSQL Database**

   - Click "New +" → PostgreSQL
   - Name: meeting-manager-db
   - Database: meeting_manager
   - User: (auto-generated)
   - Region: Choose closest to users
   - Plan: Free or Starter

3. **Create Web Service**

   - Click "New +" → Web Service
   - Connect your GitHub repository
   - Name: meeting-manager-backend
   - Environment: Docker
   - Region: Same as database
   - Branch: main
   - Root Directory: `.` (leave blank or set to root)
   - Dockerfile Path: `apps/backend/Dockerfile`
   - Docker Build Context Directory: `.` (monorepo root - very important!)
   - Plan: Free or Starter

4. **Set Environment Variables**

```env
DATABASE_URL=<internal-database-url-from-step-2>
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
PORT=3333
```

5. **Deploy**

   - Click "Create Web Service"
   - Wait for deployment to complete (Render will automatically build using Docker)

6. **Verify Deployment**

   - Check deployment logs in Render dashboard
   - Verify health endpoint: `https://your-backend.onrender.com/health`
   - Migrations run automatically via the Dockerfile startup script

7. **Optional: Manual Migrations** (if needed)
   - Go to Shell tab in Render dashboard
   - Run: `pnpm prisma migrate deploy`

### Option 2: Railway

**Advantages**: Easy PostgreSQL integration, automatic SSL, simple pricing

#### Setup Steps

1. **Install Railway CLI**

```bash
npm install -g @railway/cli
```

2. **Login to Railway**

```bash
railway login
```

3. **Create New Project**

```bash
cd apps/backend
railway init
```

4. **Add PostgreSQL Database**

```bash
railway add postgresql
```

5. **Set Environment Variables**

```bash
railway variables set JWT_SECRET="your-super-secret-key"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set CORS_ORIGIN="https://your-frontend.vercel.app"
railway variables set NODE_ENV="production"
```

6. **Deploy**

```bash
railway up
```

7. **Get Database URL**

```bash
railway variables get DATABASE_URL
```

8. **Run Migrations**

```bash
railway run pnpm prisma migrate deploy
```

9. **Get Deployment URL**

```bash
railway domain
```

#### Railway Configuration File

Create `railway.json` in `apps/backend/`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd ../.. && pnpm install && pnpm nx build backend --production"
  },
  "deploy": {
    "startCommand": "cd ../.. && node dist/apps/backend/main.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Option 3: Fly.io

**Advantages**: Global edge deployment, excellent performance

#### Setup Steps

1. **Install Flyctl**

```bash
# macOS
brew install flyctl

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Linux
curl -L https://fly.io/install.sh | sh
```

2. **Login**

```bash
flyctl auth login
```

3. **Launch App**

```bash
cd apps/backend
flyctl launch
```

Configure:

- App name: meeting-manager-backend
- Region: Choose closest to users
- PostgreSQL: Yes
- Redis: No
- Deploy now: No

4. **Create fly.toml**

Create `fly.toml` in `apps/backend/`:

```toml
app = "meeting-manager-backend"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3333"

[http_service]
  internal_port = 3333
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[services.ports]]
  port = 80
  handlers = ["http"]

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]

[checks]
  [checks.health]
    port = 3333
    type = "http"
    interval = "30s"
    timeout = "10s"
    method = "get"
    path = "/health"
```

5. **Set Secrets**

```bash
flyctl secrets set JWT_SECRET="your-super-secret-key"
flyctl secrets set JWT_EXPIRES_IN="7d"
flyctl secrets set CORS_ORIGIN="https://your-frontend.vercel.app"
```

6. **Deploy**

```bash
flyctl deploy
```

7. **Run Migrations**

```bash
flyctl ssh console
pnpm prisma migrate deploy
exit
```

## Database Setup

### Option 1: Neon (Recommended for Vercel)

1. Create account: https://neon.tech/
2. Create new project
3. Get connection string
4. Enable connection pooling
5. Use pooled connection string in backend

**Connection String Format:**

```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### Option 2: Supabase

1. Create account: https://supabase.com/
2. Create new project
3. Go to Settings → Database
4. Copy connection string (session mode)
5. Use in backend DATABASE_URL

### Option 3: Railway PostgreSQL

Automatically created with Railway deployment (see Railway section above)

### Option 4: Render PostgreSQL

Automatically created with Render deployment (see Render section above)

## Environment Variables

### Backend Environment Variables

**Required:**

```env
DATABASE_URL=postgresql://user:password@host:port/database?schema=public&sslmode=require
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.vercel.app
NODE_ENV=production
PORT=3333
```

**Optional:**

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

**Required:**

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

**Optional:**

```env
NEXT_TELEMETRY_DISABLED=1
```

## Post-Deployment

### 1. Run Database Migrations

After first deployment:

```bash
# Railway
railway run pnpm prisma migrate deploy

# Render
# Use Shell tab in Render dashboard
pnpm prisma migrate deploy

# Fly.io
flyctl ssh console -a meeting-manager-backend
pnpm prisma migrate deploy
```

### 2. Verify Health Endpoints

```bash
# Backend
curl https://your-backend-url.onrender.com/health

# Frontend
curl https://your-frontend.vercel.app/api/health
```

### 3. Test API Endpoints

```bash
# Get API info
curl https://your-backend-url.onrender.com/api

# Test authentication (if seed data exists)
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 4. Configure CORS

Ensure backend CORS_ORIGIN matches frontend domain:

```env
CORS_ORIGIN=https://your-app.vercel.app
```

For multiple domains:

```typescript
// apps/backend/src/main.ts
app.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true,
  })
);
```

### 5. Set Up Monitoring

**Recommended Tools:**

- **Vercel Analytics**: Built-in for frontend
- **Railway Metrics**: Built-in for Railway
- **Sentry**: Error tracking
- **LogTail**: Log aggregation
- **UptimeRobot**: Uptime monitoring

### 6. Configure Custom Domains

**Vercel:**

1. Go to Project Settings → Domains
2. Add custom domain
3. Configure DNS records

**Railway:**

```bash
railway domain add your-api-domain.com
```

**Render:**

1. Go to Service → Settings → Custom Domain
2. Add domain and configure DNS

**Fly.io:**

```bash
flyctl certs add your-api-domain.com
```

### 7. Enable HTTPS

All platforms provide automatic SSL/TLS certificates:

- Vercel: Automatic via Let's Encrypt
- Railway: Automatic
- Render: Automatic
- Fly.io: Automatic

## Production Checklist

- [ ] **Security**

  - [ ] Strong JWT secret (min 32 characters)
  - [ ] Secure database password
  - [ ] CORS properly configured
  - [ ] Rate limiting enabled
  - [ ] Helmet security headers enabled
  - [ ] HTTPS enforced

- [ ] **Database**

  - [ ] Managed PostgreSQL provisioned
  - [ ] Connection pooling enabled
  - [ ] Backups configured
  - [ ] Migrations applied
  - [ ] Indexes optimized

- [ ] **Backend**

  - [ ] Environment variables set
  - [ ] Health check working
  - [ ] API endpoints tested
  - [ ] Error logging configured
  - [ ] Graceful shutdown implemented

- [ ] **Frontend**

  - [ ] API URL configured
  - [ ] Environment variables set
  - [ ] Build successful
  - [ ] Custom domain configured (if applicable)
  - [ ] Analytics enabled

- [ ] **Monitoring**

  - [ ] Error tracking enabled
  - [ ] Uptime monitoring configured
  - [ ] Log aggregation set up
  - [ ] Performance monitoring enabled

- [ ] **Testing**
  - [ ] API endpoints functional
  - [ ] Authentication working
  - [ ] Database queries optimized
  - [ ] Frontend-backend integration working
  - [ ] CORS configured correctly

## Troubleshooting

### Build Failures

**Symptom**: Deployment fails during build

**Solutions**:

1. Check build logs for specific errors
2. Verify all dependencies in package.json
3. Ensure pnpm version compatibility
4. Check Dockerfile syntax
5. Verify build commands are correct

### Database Connection Errors

**Symptom**: Backend cannot connect to database

**Solutions**:

1. Verify DATABASE_URL format
2. Check SSL mode: `?sslmode=require`
3. Ensure database is accessible from backend
4. Verify firewall rules
5. Check connection pooling settings

### CORS Errors

**Symptom**: Frontend gets CORS errors when calling API

**Solutions**:

1. Verify CORS_ORIGIN matches frontend domain exactly
2. Include protocol (https://)
3. No trailing slash in domain
4. Check credentials setting if using cookies
5. Verify backend CORS middleware is before routes

### Migration Failures

**Symptom**: Prisma migrations fail

**Solutions**:

1. Ensure database is empty on first deploy
2. Run migrations manually via platform shell
3. Check migration files for syntax errors
4. Verify DATABASE_URL is correct
5. Use `prisma migrate deploy` not `prisma migrate dev`

### Environment Variables Not Loading

**Symptom**: App can't read environment variables

**Solutions**:

1. Restart service after adding variables
2. Verify variable names match exactly
3. Check for typos in variable names
4. Use platform-specific CLI to verify variables
5. Ensure variables are set for production environment

### 500 Internal Server Errors

**Symptom**: API returns 500 errors

**Solutions**:

1. Check backend logs for stack traces
2. Verify all required environment variables are set
3. Ensure Prisma client is generated
4. Check database connection
5. Verify JWT secret is set

## Rollback Procedures

### Vercel Rollback

```bash
# View deployments
vercel ls

# Rollback to previous deployment
vercel rollback
```

Or via dashboard:

1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Railway Rollback

1. Go to Railway dashboard
2. Click on service → Deployments
3. Find previous working deployment
4. Click "Redeploy"

### Render Rollback

1. Go to Render dashboard
2. Click on service → Events
3. Find previous deploy
4. Click "Rollback to this deploy"

### Fly.io Rollback

```bash
# List releases
flyctl releases

# Rollback to previous release
flyctl releases rollback
```

## Support Resources

- **Vercel**: https://vercel.com/docs
- **Railway**: https://docs.railway.app
- **Render**: https://render.com/docs
- **Fly.io**: https://fly.io/docs
- **Prisma**: https://www.prisma.io/docs

## Next Steps

- Configure monitoring and alerts
- Set up automated backups
- Enable CDN for static assets
- Configure rate limiting
- Set up logging aggregation
- Review security best practices
- Plan scaling strategy
