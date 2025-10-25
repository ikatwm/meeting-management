# Vercel Deployment Guide

Comprehensive guide for deploying the Meeting Manager Next.js frontend to Vercel with Nx monorepo integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Build Settings](#build-settings)
5. [Deployment Process](#deployment-process)
6. [Preview Deployments](#preview-deployments)
7. [Troubleshooting](#troubleshooting)
8. [Verification & Testing](#verification--testing)
9. [Best Practices](#best-practices)

---

## Prerequisites

Before deploying to Vercel, ensure you have:

- **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- **GitHub Repository**: Code pushed to GitHub (Vercel integrates with GitHub)
- **Backend API**: Deployed backend with accessible API endpoint
- **Database**: PostgreSQL database (Vercel Postgres or external provider)
- **Environment Variables**: Production values ready (API URLs, secrets, etc.)

### Required Tools

```bash
# Install Vercel CLI (optional but recommended)
npm install -g vercel

# Verify installation
vercel --version
```

---

## Initial Setup

### Step 1: Connect GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select "Import Git Repository"
4. Authorize Vercel to access your GitHub account
5. Select the `meeting-management` repository
6. Click "Import"

### Step 2: Configure Project Settings

Vercel will auto-detect the Nx monorepo and Next.js framework.

**Project Configuration:**

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `.` (monorepo root)
- **Build Command**: `pnpm nx build frontend --prod`
- **Output Directory**: `dist/apps/frontend/.next`
- **Install Command**: `pnpm install --frozen-lockfile`

**Important Notes:**

- The root-level `vercel.json` overrides these settings
- Vercel automatically detects Nx workspace configuration
- No need to navigate to `apps/frontend/` - build from root

### Step 3: Project Name & Domain

- **Project Name**: `meeting-manager` (or your preferred name)
- **Production Domain**: `meeting-manager.vercel.app` (customize later)

---

## Environment Variables Configuration

### Required Environment Variables

Add these in **Vercel Dashboard → Settings → Environment Variables**:

#### Frontend Variables (Required)

```bash
# Backend API endpoint
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api

# NextAuth configuration
NEXTAUTH_URL=https://meeting-manager.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Database connection (if frontend needs direct access)
DATABASE_URL=postgresql://user:password@host:5432/meeting_management
```

#### Build Variables (Nx Optimization)

```bash
# Disable Nx Cloud for Vercel serverless
NX_CLOUD_DISTRIBUTED_EXECUTION=false
NX_DAEMON=false

# Production environment
NODE_ENV=production
```

#### Optional Variables

```bash
# Analytics
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX

# Monitoring (Sentry)
SENTRY_DSN=https://your-sentry-dsn

# Email (if applicable)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
```

### How to Add Environment Variables

#### Method 1: Vercel Dashboard (Recommended)

1. Go to **Project Settings → Environment Variables**
2. Click "Add" for each variable
3. Select environment scope:
   - **Production**: Live deployment
   - **Preview**: Pull request previews
   - **Development**: Local development (optional)

**Example:**

```
Key: NEXTAUTH_SECRET
Value: <paste-your-secret>
Environments: ✓ Production ✓ Preview
```

#### Method 2: Vercel CLI

```bash
# Add production environment variable
vercel env add NEXTAUTH_SECRET production

# Add to all environments
vercel env add NEXT_PUBLIC_API_URL production preview development

# List all environment variables
vercel env ls

# Pull environment variables for local development
vercel env pull .env.local
```

#### Method 3: Import from .env file

```bash
# Create a temporary .env.production file with actual values
cp .env.production.example .env.production
# Edit and add real values

# Import using Vercel CLI
vercel env import .env.production

# DELETE the file immediately after import (security)
rm .env.production
```

### Environment Variable Scopes

| Scope           | Usage                         | Auto-inject |
| --------------- | ----------------------------- | ----------- |
| **Production**  | Live deployment (main branch) | Yes         |
| **Preview**     | Pull request deployments      | Yes         |
| **Development** | Local `vercel dev`            | No          |

---

## Build Settings

### Default Configuration (from vercel.json)

The root `vercel.json` file contains all build configuration:

```json
{
  "buildCommand": "pnpm nx build frontend --prod",
  "outputDirectory": "dist/apps/frontend/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

### Nx Build Optimization

**Build Environment Variables** (automatically applied):

```bash
NX_CLOUD_DISTRIBUTED_EXECUTION=false  # Disable cloud caching
NX_DAEMON=false                       # Disable Nx daemon in serverless
```

**Why these settings?**

- Vercel serverless environment doesn't support Nx daemon
- Build caching handled by Vercel's native cache
- Reduces build time and prevents daemon conflicts

### Build Performance

**Expected Build Times:**

- **Cold build** (no cache): 3-5 minutes
- **Cached build** (no changes): 30-60 seconds
- **Incremental build** (small changes): 1-2 minutes

**Nx Caching Benefits:**

- Only rebuilds affected projects
- Shares cache between builds
- Faster CI/CD pipeline

---

## Deployment Process

### Automatic Deployment (Recommended)

Vercel automatically deploys when you push to GitHub:

#### Production Deployment

```bash
# Push to main branch
git checkout main
git add .
git commit -m "feat: implement new feature"
git push origin main
```

**Trigger**: Push to `main` branch
**Result**: Deploys to production domain (`meeting-manager.vercel.app`)

#### Preview Deployment

```bash
# Create feature branch
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create Pull Request on GitHub
```

**Trigger**: Pull request created or updated
**Result**: Generates preview URL (e.g., `meeting-manager-git-feature-new-feature.vercel.app`)

### Manual Deployment (CLI)

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
vercel --prod --branch main
```

### Deployment Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Push                                                 │
│  (main or feature branch)                                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Detects Change                                      │
│  - Triggers build pipeline                                  │
│  - Clones repository                                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Install Dependencies                                       │
│  $ pnpm install --frozen-lockfile                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Build Frontend                                             │
│  $ pnpm nx build frontend --prod                           │
│  - Nx resolves dependencies                                │
│  - Builds only affected projects                           │
│  - Outputs to dist/apps/frontend/.next                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Deploy to Vercel Edge Network                              │
│  - Uploads build artifacts                                  │
│  - Configures serverless functions                          │
│  - Applies headers and rewrites                             │
│  - Assigns domain                                           │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Deployment Ready                                           │
│  ✓ Production: meeting-manager.vercel.app                  │
│  ✓ Preview: meeting-manager-git-branch.vercel.app         │
└─────────────────────────────────────────────────────────────┘
```

---

## Preview Deployments

### Automatic Preview URLs

Every pull request gets a unique preview deployment:

**URL Format:**

```
https://<project>-<git-branch>-<team>.vercel.app
```

**Example:**

```
https://meeting-manager-git-feature-auth-fix-yourteam.vercel.app
```

### Preview Environment Variables

Preview deployments use environment variables scoped to "Preview":

- Same configuration as production
- Safe testing without affecting live users
- Automatic cleanup when PR is closed

### Testing Preview Deployments

1. **Verify Build**: Check Vercel dashboard for build logs
2. **Test Functionality**: Click preview URL and test new features
3. **Check Integration**: Ensure API calls work with backend
4. **Review Changes**: Compare with production

### Preview Deployment Best Practices

- Always test preview before merging to main
- Use preview URLs in PR descriptions
- Share preview links with stakeholders for feedback
- Monitor build times and optimize if needed

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: Build Fails with "Module not found"

**Symptoms:**

```
Error: Cannot find module '@/components/...'
```

**Solutions:**

1. **Check TypeScript paths** in `tsconfig.base.json`:

   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["apps/frontend/src/*"]
       }
     }
   }
   ```

2. **Verify dependencies** are installed:

   ```bash
   vercel env pull .env.local
   pnpm install
   pnpm nx build frontend --prod
   ```

3. **Check build logs** in Vercel dashboard for missing dependencies

#### Issue 2: Environment Variables Not Applied

**Symptoms:**

```
NEXT_PUBLIC_API_URL is undefined
```

**Solutions:**

1. **Check variable scope**: Ensure marked for "Production" or "Preview"
2. **Redeploy**: Environment changes require redeployment
3. **Verify naming**: `NEXT_PUBLIC_` prefix required for client-side access
4. **Check build logs**: Verify variables are injected during build

**Command to verify:**

```bash
vercel env ls
```

#### Issue 3: Build Timeout

**Symptoms:**

```
Error: Build exceeded maximum duration of 45 minutes
```

**Solutions:**

1. **Optimize dependencies**: Remove unused packages

   ```bash
   pnpm prune
   ```

2. **Check Nx affected builds**: Ensure only necessary projects build

   ```bash
   pnpm nx affected:build --base=main
   ```

3. **Upgrade Vercel plan**: Free tier has build time limits

#### Issue 4: Output Directory Not Found

**Symptoms:**

```
Error: No output directory found
```

**Solutions:**

1. **Verify output path** in `vercel.json`:

   ```json
   {
     "outputDirectory": "dist/apps/frontend/.next"
   }
   ```

2. **Check build command** runs successfully locally:

   ```bash
   pnpm nx build frontend --prod
   ls -la dist/apps/frontend/.next
   ```

3. **Review build logs** for errors during Next.js build

#### Issue 5: Nx Daemon Errors

**Symptoms:**

```
Error: Nx daemon failed to start
```

**Solutions:**

1. **Ensure NX_DAEMON=false** in build environment variables
2. **Add to vercel.json**:
   ```json
   {
     "build": {
       "env": {
         "NX_DAEMON": "false"
       }
     }
   }
   ```

#### Issue 6: API Routes 404 Error

**Symptoms:**

```
404 Not Found when calling /api/...
```

**Solutions:**

1. **Check API route exports** in Next.js:

   ```typescript
   // app/api/route.ts must export HTTP methods
   export async function GET(request: Request) { ... }
   ```

2. **Verify rewrites** in `vercel.json`:

   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "/api/:path*"
       }
     ]
   }
   ```

3. **Check backend URL**: Ensure `NEXT_PUBLIC_API_URL` points to correct endpoint

---

## Verification & Testing

### Post-Deployment Checklist

After successful deployment, verify:

#### 1. Build Success

```bash
# Check Vercel dashboard
- Go to Deployments tab
- Verify "Ready" status with green checkmark
- Review build logs for warnings
```

#### 2. Application Health

**Manual Testing:**

- [ ] Application loads without errors
- [ ] Authentication flow works (login/logout)
- [ ] API calls succeed (check Network tab)
- [ ] Dashboard displays data correctly
- [ ] Navigation between pages works
- [ ] Forms submit successfully

**Automated Checks:**

```bash
# Use curl to test API endpoints
curl -I https://meeting-manager.vercel.app

# Expected response: 200 OK
HTTP/2 200
x-content-type-options: nosniff
x-frame-options: DENY
```

#### 3. Security Headers

Verify security headers are applied:

```bash
curl -I https://meeting-manager.vercel.app | grep -i 'x-'
```

**Expected headers:**

```
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
strict-transport-security: max-age=31536000; includeSubDomains
```

#### 4. Environment Variables

Test that environment variables are correctly injected:

1. Open browser console on deployed site
2. Run:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_API_URL);
   ```
3. Should output your backend API URL (not undefined)

#### 5. Performance Metrics

Use Vercel Analytics or Lighthouse:

**Vercel Speed Insights:**

- Go to Vercel Dashboard → Analytics
- Review performance metrics

**Google Lighthouse:**

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://meeting-manager.vercel.app --view
```

**Target Scores:**

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

---

## Best Practices

### 1. Environment Management

**DO:**

- ✅ Use Vercel environment variables for all secrets
- ✅ Scope variables appropriately (Production/Preview/Development)
- ✅ Use `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Rotate secrets regularly (NEXTAUTH_SECRET, JWT_SECRET)

**DON'T:**

- ❌ Commit `.env.production` with real values to Git
- ❌ Hardcode API URLs or secrets in code
- ❌ Share production secrets in preview environments

### 2. Branch Strategy

**Production Branch:**

```bash
main → Production deployment (meeting-manager.vercel.app)
```

**Feature Branches:**

```bash
feature/* → Preview deployment (unique URL per branch)
```

**Recommended Workflow:**

1. Create feature branch from `main`
2. Develop and test locally
3. Push to GitHub (triggers preview deployment)
4. Test preview URL
5. Create PR and request review
6. Merge to `main` (triggers production deployment)

### 3. Deployment Frequency

**Recommendations:**

- **Production**: 1-3 deployments per week (stable releases)
- **Preview**: As often as needed (continuous development)
- **Hotfixes**: Immediate deployment for critical bugs

### 4. Monitoring & Alerts

**Set up monitoring:**

1. **Vercel Analytics**: Track performance and usage

   ```
   Dashboard → Analytics → Enable
   ```

2. **Error Tracking**: Integrate Sentry for runtime errors

   ```bash
   # Add SENTRY_DSN environment variable
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

3. **Uptime Monitoring**: Use external service (Uptime Robot, Pingdom)

### 5. Build Optimization

**Nx Caching:**

```bash
# View Nx cache statistics
pnpm nx run-many --target=build --all --graph

# Clear Nx cache if needed
pnpm nx reset
```

**Vercel Caching:**

- Automatically caches `node_modules` between builds
- Caches Next.js build output for faster deployments

**Performance Tips:**

- Use Nx affected commands to build only changed projects
- Minimize dependencies (remove unused packages)
- Optimize images with Next.js Image component

### 6. Security Best Practices

**Headers Configuration:**

All security headers are configured in root `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

**Additional Security:**

- Keep dependencies up to date (`pnpm audit`)
- Use HTTPS-only for all communications
- Implement rate limiting on API routes
- Validate and sanitize all user inputs

### 7. Rollback Strategy

**If a deployment breaks production:**

1. **Instant Rollback** (Vercel Dashboard):

   ```
   Dashboard → Deployments → Previous deployment → Promote to Production
   ```

2. **Git Revert** (if code issue):

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Fix Forward** (preferred):
   ```bash
   git checkout -b hotfix/critical-bug
   # Fix the issue
   git push origin hotfix/critical-bug
   # Merge to main immediately
   ```

---

## Additional Resources

### Official Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Nx Integration](https://vercel.com/docs/frameworks/nx)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Nx Documentation](https://nx.dev/getting-started/intro)

### Vercel CLI Commands

```bash
# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs <deployment-url>

# List deployments
vercel ls

# Environment variables
vercel env ls
vercel env add <name> <environment>
vercel env rm <name> <environment>

# Pull environment variables for local dev
vercel env pull .env.local

# Inspect deployment
vercel inspect <deployment-url>
```

### Support & Community

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Vercel Discord**: [vercel.com/discord](https://vercel.com/discord)
- **GitHub Issues**: Open issue in repository for project-specific questions

---

## Summary

This guide covered:

1. ✅ Connecting GitHub repository to Vercel
2. ✅ Configuring build settings for Nx monorepo
3. ✅ Setting up environment variables securely
4. ✅ Deploying to production and preview environments
5. ✅ Troubleshooting common deployment issues
6. ✅ Verifying deployments and monitoring performance
7. ✅ Following best practices for security and optimization

**Next Steps:**

1. Complete initial Vercel setup
2. Configure all required environment variables
3. Test preview deployment with a feature branch
4. Deploy to production from `main` branch
5. Set up monitoring and analytics
6. Document any project-specific deployment notes

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or reach out to the team.
