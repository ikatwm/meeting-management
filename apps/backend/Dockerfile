# Backend Dockerfile - Multi-stage build for Meeting Manager API
# Stage 1: Build dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml .npmrc ./
COPY nx.json tsconfig.base.json tsconfig.json ./

# Copy backend configuration files
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/webpack.config.js ./apps/backend/

# Install dependencies (pnpm workspace installs all in root node_modules)
# Use --ignore-scripts=false to allow essential build scripts like @swc/core
RUN pnpm install --frozen-lockfile --ignore-scripts=false

# Stage 2: Build application
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage (pnpm workspace: all deps in root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (includes prisma directory)
COPY . .

# Build the backend application (Prisma client will be generated at runtime)
RUN pnpm nx build backend --prod

# Stage 3: Production runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy necessary files from builder
COPY --from=builder /app/dist/apps/backend ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json for potential runtime needs
COPY --from=builder /app/apps/backend/package.json ./package.json

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3333

# Change ownership to non-root user
RUN chown -R expressjs:nodejs /app

# Switch to non-root user
USER expressjs

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3333/health || exit 1

# Create startup script for Prisma generation, migrations, and server
COPY --chown=expressjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh
set -e

echo "Generating Prisma Client with real DATABASE_URL..."
pnpm prisma generate

echo "Running database migrations..."
pnpm prisma migrate deploy

echo "Starting application..."
exec node dist/main.js
EOF

RUN chmod +x /app/start.sh

# Start application with migrations
CMD ["/app/start.sh"]
