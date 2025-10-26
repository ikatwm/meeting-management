# CI/CD Guide

Comprehensive guide to the automated CI/CD pipeline for the Meeting Manager application.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Setup Instructions](#setup-instructions)
- [Workflow Details](#workflow-details)
- [Secrets Configuration](#secrets-configuration)
- [Branch Protection](#branch-protection)
- [Troubleshooting](#troubleshooting)

## Overview

The Meeting Manager application uses GitHub Actions for continuous integration and deployment:

**CI Pipeline (`ci.yml`)**:

- Runs on every push to main/develop and pull requests
- Parallel execution for optimal speed (target: <10 minutes)
- Automated testing, linting, type checking, and building
- Docker image validation
- Security scanning

**Deployment Pipeline (`deploy.yml`)**:

- Runs after successful CI on main branch
- Automatic frontend deployment to Vercel
- Backend deployment instructions/automation
- Environment-specific configurations

## GitHub Actions Workflows

### Workflow Files

```
.github/
└── workflows/
    ├── ci.yml       # Continuous Integration
    └── deploy.yml   # Deployment
```

## Setup Instructions

### 1. Fork or Clone Repository

```bash
git clone <repository-url>
cd meeting-management
```

### 2. Configure GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Required for CI Pipeline

**Database Testing:**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meeting_manager_test?schema=public
JWT_SECRET=test-secret-key-for-ci-pipeline
```

#### Required for Deployment

**Vercel Deployment:**

```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
PRODUCTION_API_URL=https://your-backend-url.onrender.com
```

**Backend Deployment (choose one):**

Render (Recommended):

```
RENDER_API_KEY=<your-render-api-key>
RENDER_SERVICE_ID=<your-render-service-id>
```

Railway:

```
RAILWAY_TOKEN=<your-railway-token>
```

Fly.io:

```
FLY_API_TOKEN=<your-fly-api-token>
FLY_APP_NAME=<your-fly-app-name>
```

### 3. Enable GitHub Actions

1. Go to repository → Actions tab
2. Enable workflows if disabled
3. Verify workflows appear in the list

### 4. Create Development Branch

```bash
git checkout -b develop
git push origin develop
```

### 5. Test CI Pipeline

Create a test pull request:

```bash
git checkout -b test-ci
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify CI pipeline"
git push origin test-ci
```

Create PR on GitHub and verify CI runs successfully.

## Workflow Details

### CI Pipeline (ci.yml)

**Trigger Events:**

- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

**Jobs Execution Flow:**

```
┌─────────────────────────────────────────────────┐
│                   CI Pipeline                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐     │
│  │   Lint   │  │ TypeCheck │  │   Test   │     │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘     │
│       │              │              │            │
│       └──────────────┴──────────────┘            │
│                      │                           │
│              ┌───────▼────────┐                  │
│              │  Build (Matrix) │                 │
│              │  - Frontend     │                 │
│              │  - Backend      │                 │
│              └───────┬─────────┘                 │
│                      │                           │
│              ┌───────▼───────────┐               │
│              │ Docker Build      │               │
│              │ - Frontend Image  │               │
│              │ - Backend Image   │               │
│              └───────┬───────────┘               │
│                      │                           │
│              ┌───────▼───────┐                   │
│              │ Security Scan │                   │
│              └───────┬───────┘                   │
│                      │                           │
│              ┌───────▼───────┐                   │
│              │  CI Success   │                   │
│              └───────────────┘                   │
└─────────────────────────────────────────────────┘
```

#### Job 1: Lint (3-5 minutes)

**Purpose**: Code quality and formatting validation

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies (with cache)
4. Run ESLint on all projects
5. Check Prettier formatting

**Configuration**:

```yaml
timeout-minutes: 10
runs-on: ubuntu-latest
```

**Failure Conditions**:

- ESLint errors
- Formatting violations
- Missing dependencies

#### Job 2: TypeCheck (3-5 minutes)

**Purpose**: TypeScript compilation validation

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Generate Prisma Client
5. Run TypeScript compiler

**Failure Conditions**:

- Type errors
- Missing type definitions
- Invalid tsconfig

#### Job 3: Test (5-8 minutes)

**Purpose**: Automated testing with coverage

**Infrastructure**:

- PostgreSQL service container
- Health checks enabled
- Database migrations

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Generate Prisma Client
5. Run migrations
6. Execute tests with coverage
7. Upload coverage to Codecov

**Environment Variables**:

```yaml
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/meeting_manager_test
JWT_SECRET: test-secret-key
```

**Failure Conditions**:

- Test failures
- Coverage below threshold
- Database connection issues

#### Job 4: Build (5-7 minutes)

**Purpose**: Production build validation

**Strategy**: Matrix for parallel execution

```yaml
matrix:
  app: [frontend, backend]
```

**Steps**:

1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Generate Prisma Client (backend only)
5. Build application
6. Upload build artifacts

**Build Artifacts**:

- Retention: 7 days
- Used for deployment or debugging

**Failure Conditions**:

- Build errors
- Missing dependencies
- Invalid configuration

#### Job 5: Docker Build (8-12 minutes)

**Purpose**: Docker image validation

**Features**:

- BuildKit cache for speed
- Multi-platform support possible
- No push (validation only)

**Steps**:

1. Checkout code
2. Setup Docker Buildx
3. Build Docker image
4. Validate image

**Caching Strategy**:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

**Failure Conditions**:

- Dockerfile syntax errors
- Build failures
- Large image size warnings

#### Job 6: Security Scan (3-5 minutes)

**Purpose**: Dependency vulnerability scanning

**Steps**:

1. Install dependencies
2. Run npm audit
3. Report vulnerabilities

**Configuration**:

```yaml
continue-on-error: true # Won't fail pipeline
audit-level: moderate
```

#### Job 7: CI Success

**Purpose**: Pipeline status verification

**Behavior**:

- Runs after all critical jobs
- Checks all job statuses
- Fails if any critical job failed
- Required for branch protection

### Deployment Pipeline (deploy.yml)

**Trigger Events:**

- Push to `main` branch (after CI passes)
- Manual workflow dispatch

**Jobs:**

#### 1. Deploy Frontend to Vercel

**Steps**:

1. Checkout code
2. Setup Node.js and pnpm
3. Install Vercel CLI
4. Pull Vercel environment
5. Build project
6. Deploy to production
7. Comment PR with URL (if applicable)

**Environment**:

- Name: production
- URL: Deployment URL

**Secrets Required**:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `PRODUCTION_API_URL`

#### 2. Backend Deployment

**Current**: Instructions displayed

**Options**: Uncomment for automation

- Render (Recommended)
- Railway
- Fly.io

Example Render deployment:

```yaml
deploy-backend-render:
  name: Deploy Backend to Render
  runs-on: ubuntu-latest
  steps:
    - name: Trigger Render Deploy
      run: |
        curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

Example Railway deployment:

```yaml
deploy-backend-railway:
  name: Deploy Backend to Railway
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to Railway
      run: railway up --service backend
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Secrets Configuration

### How to Get Secret Values

#### Vercel Secrets

1. **VERCEL_TOKEN**:

   ```bash
   # Create token at: https://vercel.com/account/tokens
   # Settings → Tokens → Create
   ```

2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**:
   ```bash
   cd apps/frontend
   vercel link
   cat .vercel/project.json
   ```

#### Render API Key (Recommended)

1. Go to https://dashboard.render.com/u/settings#api-keys
2. Click "Create API Key"
3. Copy the API key
4. Get your service ID from the service's "Settings" tab on Render

Or use Deploy Hook:

1. Go to Render dashboard
2. Select your service
3. Settings → Deploy Hooks
4. Create deploy hook
5. Copy URL

#### Railway Token

```bash
# Login to Railway
railway login

# Create token in dashboard
# Settings → Tokens → Create Token
```

#### Fly.io Token

```bash
# Create token
flyctl auth token

# Get app name
flyctl apps list
```

### Adding Secrets to GitHub

**Via Web Interface**:

1. Go to repository → Settings
2. Secrets and variables → Actions
3. New repository secret
4. Enter name and value
5. Add secret

**Via GitHub CLI**:

```bash
gh secret set VERCEL_TOKEN
# Paste token and press Enter
```

## Branch Protection

### Recommended Settings

Configure in: Repository Settings → Branches → Branch protection rules

**For `main` branch:**

```yaml
Branch name pattern: main

Settings:
☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
  ☑ Require review from Code Owners

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Required status checks:
    - Lint Code
    - Type Check
    - Run Tests
    - Build Applications (frontend)
    - Build Applications (backend)
    - Build Docker Images
    - CI Success

☑ Require conversation resolution before merging
☑ Require signed commits
☑ Include administrators
☑ Restrict who can push to matching branches
☑ Allow force pushes: ☐
☑ Allow deletions: ☐
```

**For `develop` branch:**

Similar to main but with:

- Require approvals: 0 (optional)
- Less strict checks

### Setup Branch Protection

```bash
# Via GitHub CLI
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Success"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}'
```

## Performance Optimization

### Caching Strategy

**pnpm Cache**:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'
```

**Docker Layer Cache**:

```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Nx Computation Cache**:

```yaml
- run: pnpm nx build backend
  env:
    NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_TOKEN }}
```

### Parallel Execution

**Matrix Strategy**:

```yaml
strategy:
  matrix:
    app: [frontend, backend]
```

**Independent Jobs**:
Jobs run in parallel unless dependencies specified.

### Timeout Configuration

```yaml
timeout-minutes: 10 # Fail fast if stuck
```

## Monitoring and Notifications

### Workflow Status Badge

Add to README.md:

```markdown
![CI](https://github.com/username/repo/workflows/CI%20Pipeline/badge.svg)
![Deploy](https://github.com/username/repo/workflows/Deploy%20to%20Production/badge.svg)
```

### Notifications

**Email Notifications**:

- Enabled by default for workflow failures
- Configure in GitHub settings

**Slack Integration**:
Add to workflow:

```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "CI Pipeline Failed!"
      }
```

**Discord Integration**:

```yaml
- name: Notify Discord
  if: failure()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

## Troubleshooting

### Common Issues

#### 1. Workflow Not Triggering

**Symptoms**: Push to main but workflow doesn't run

**Solutions**:

- Verify GitHub Actions are enabled
- Check workflow file syntax (YAML)
- Ensure branch name matches trigger
- Check if workflow is in correct directory

#### 2. Dependency Installation Fails

**Symptoms**: `pnpm install` fails

**Solutions**:

- Clear cache: Re-run workflow
- Check pnpm-lock.yaml is committed
- Verify Node version compatibility
- Check for private package access

#### 3. Test Failures

**Symptoms**: Tests pass locally but fail in CI

**Solutions**:

- Check environment variables
- Verify database connection
- Review test logs
- Check for timing issues
- Verify all test dependencies

#### 4. Build Timeouts

**Symptoms**: Build exceeds timeout

**Solutions**:

- Increase timeout limit
- Optimize build configuration
- Enable build caching
- Check for infinite loops

#### 5. Docker Build Fails

**Symptoms**: Docker image build fails

**Solutions**:

- Check Dockerfile syntax
- Verify all COPY paths exist
- Check build context
- Review Docker logs
- Test locally first

#### 6. Deployment Secrets Not Found

**Symptoms**: Deployment fails with missing secrets

**Solutions**:

- Verify secret names match exactly
- Check secret is set for correct environment
- Re-add secret if corrupted
- Verify organization/repository access

### Debugging Workflows

**Enable Debug Logging**:

1. Set repository secret:

```
ACTIONS_STEP_DEBUG = true
ACTIONS_RUNNER_DEBUG = true
```

2. Re-run workflow

**View Detailed Logs**:

1. Go to Actions tab
2. Select workflow run
3. Click on job
4. Expand step logs

**Download Logs**:

1. Go to workflow run
2. Click "..." menu
3. Download log archive

**Re-run Failed Jobs**:

1. Go to workflow run
2. Click "Re-run failed jobs"

## Best Practices

### 1. Keep Workflows Fast

- Target: <10 minutes total
- Use parallel execution
- Enable caching
- Optimize Docker layers

### 2. Fail Fast

```yaml
timeout-minutes: 10
```

### 3. Use Matrix Builds

```yaml
strategy:
  matrix:
    node-version: [18, 20]
```

### 4. Cache Dependencies

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 5. Secure Secrets

- Never log secrets
- Use least privilege
- Rotate regularly
- Use environment-specific secrets

### 6. Monitor Resources

```yaml
- name: Check disk space
  run: df -h
```

### 7. Conditional Execution

```yaml
if: github.ref == 'refs/heads/main'
```

## Advanced Configuration

### Conditional Jobs

```yaml
deploy:
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

### Job Dependencies

```yaml
deploy:
  needs: [lint, test, build]
```

### Manual Approval

```yaml
deploy-production:
  environment:
    name: production
    url: https://example.com
  # Requires manual approval in GitHub UI
```

### Scheduled Workflows

```yaml
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
```

### Workflow Dispatch Inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
```

## Maintenance

### Regular Tasks

**Weekly**:

- Review failed workflows
- Update dependencies
- Check cache efficiency

**Monthly**:

- Rotate secrets
- Review workflow metrics
- Update action versions
- Clean old artifacts

**Quarterly**:

- Audit security settings
- Review branch protection
- Optimize workflow performance

### Updating Actions

```yaml
# Before
- uses: actions/checkout@v3

# After
- uses: actions/checkout@v4
```

Check for updates: https://github.com/marketplace

## Support Resources

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Vercel Deployment**: https://vercel.com/docs/concepts/deployments/overview
- **Railway CLI**: https://docs.railway.app/develop/cli
- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate

## Next Steps

- [Docker Setup Guide](DOCKER_SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
