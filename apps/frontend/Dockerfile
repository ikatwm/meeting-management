# Frontend Dockerfile - Multi-stage build for Next.js application
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml .npmrc ./
COPY nx.json tsconfig.base.json tsconfig.json ./

# Copy ALL app package.json files for proper workspace resolution
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend-e2e/package.json ./apps/backend-e2e/

# Copy frontend configuration files
COPY apps/frontend/tsconfig*.json ./apps/frontend/
COPY apps/frontend/next.config.js ./apps/frontend/

# Install all workspace dependencies (includes frontend, Nx tools, and shared deps)
RUN pnpm install --frozen-lockfile --ignore-scripts=false
# Ensure frontend package deps (e.g., date-fns, react-hot-toast, next-auth) are installed
# Using filter guarantees the app's direct deps are present even if lockfile was created without them
RUN pnpm --filter @meeting-management/frontend... install --ignore-scripts=false --frozen-lockfile=false

# Stage 2: Build application
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage (pnpm workspace: all deps in root node_modules)
COPY --from=deps /app/node_modules ./node_modules
# Also copy the frontend package-level node_modules needed with pnpm's isolated linker
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js application with standalone output
RUN pnpm nx build frontend --prod --skip-nx-cache

# Stage 3: Production runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy Next.js standalone output
# Next.js standalone builds to apps/frontend/.next in the workspace
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start Next.js server
CMD ["node", "apps/frontend/server.js"]
