# Docker Setup Guide

Complete guide to running the Meeting Manager application using Docker and Docker Compose.

## Prerequisites

Before starting, ensure you have the following installed:

- **Docker Desktop** (version 20.10 or later)
  - [Download for macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)
- **Docker Compose** (included with Docker Desktop)
- **Git** (for cloning the repository)

Verify installations:

```bash
docker --version
docker compose version
```

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd meeting-management

# Copy environment file
cp .env.docker.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

### 2. Configure Environment Variables

Edit `.env` file and update the following critical values:

```env
# Change these values for security
POSTGRES_PASSWORD=your_secure_password_here
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

### 3. Build and Run

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode (background)
docker compose up -d --build
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3333
- **API Documentation**: http://localhost:3333/api
- **Health Check**: http://localhost:3333/health

## Docker Commands Reference

### Starting Services

```bash
# Start all services in foreground
docker compose up

# Start all services in background
docker compose up -d

# Rebuild images and start
docker compose up --build

# Start specific service
docker compose up frontend
```

### Stopping Services

```bash
# Stop all services (keeps containers)
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers, volumes, and images
docker compose down -v --rmi all
```

### Viewing Logs

```bash
# View logs from all services
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs from specific service
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# View last 100 lines
docker compose logs --tail=100 backend
```

### Database Operations

```bash
# Access PostgreSQL container
docker compose exec postgres psql -U postgres -d meeting_manager

# Run database migrations
docker compose exec backend pnpm prisma migrate deploy

# Generate Prisma client
docker compose exec backend pnpm prisma generate

# Create a new migration
docker compose exec backend pnpm prisma migrate dev --name migration_name

# View database data
docker compose exec postgres psql -U postgres -d meeting_manager -c "SELECT * FROM users;"
```

### Container Management

```bash
# List running containers
docker compose ps

# Restart a service
docker compose restart backend

# Execute command in container
docker compose exec backend sh

# View container resource usage
docker stats

# Remove all stopped containers
docker container prune
```

## Development Workflow

### Hot Reloading

The docker-compose configuration includes volume mounts for development:

```yaml
volumes:
  - ./apps/backend/src:/app/apps/backend/src
  - ./apps/frontend/src:/app/apps/frontend/src
```

This enables hot-reloading: changes to source code automatically restart the services.

### Running Tests

```bash
# Run backend tests
docker compose exec backend pnpm test

# Run tests in watch mode
docker compose exec backend pnpm test:watch

# Run with coverage
docker compose exec backend pnpm test -- --coverage
```

### Debugging

```bash
# View environment variables
docker compose exec backend env

# Check service health
docker compose exec backend curl http://localhost:3333/health
docker compose exec frontend curl http://localhost:3000/api/health

# Inspect container
docker inspect meeting-manager-backend
```

## Production Build

For production deployment, use optimized builds:

```bash
# Build production images
docker compose -f docker-compose.yml build --no-cache

# Run with production settings
NODE_ENV=production docker compose up -d
```

## Troubleshooting

### Port Already in Use

If you get "port already allocated" errors:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Verify database URL
docker compose exec backend env | grep DATABASE_URL

# Test connection manually
docker compose exec postgres pg_isready -U postgres
```

### Build Failures

```bash
# Clean Docker cache
docker builder prune

# Remove all containers and volumes
docker compose down -v

# Rebuild from scratch
docker compose build --no-cache
```

### Container Won't Start

```bash
# Check container logs
docker compose logs <service-name>

# Inspect failed container
docker ps -a
docker logs <container-id>

# Remove and recreate
docker compose rm <service-name>
docker compose up <service-name>
```

### Permission Issues

If you encounter permission errors:

```bash
# Fix ownership (Linux/macOS)
sudo chown -R $USER:$USER .

# On Windows, run Docker Desktop as Administrator
```

### Out of Disk Space

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

## Advanced Configuration

### Custom Network

Modify `docker-compose.yml` to use custom network settings:

```yaml
networks:
  meeting-manager-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

### Resource Limits

Add resource constraints to services:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Multi-Stage Build Optimization

The Dockerfiles use multi-stage builds to minimize image size:

- **Backend**: ~150-200MB (Alpine-based)
- **Frontend**: ~200-300MB (Next.js standalone)

### Health Checks

Services include health checks for reliability:

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:3333/health']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Security Best Practices

1. **Change Default Passwords**: Never use example passwords in production
2. **Use Secrets**: Store sensitive data in Docker secrets or environment files
3. **Non-Root Users**: Containers run as non-root users (nodejs/nextjs)
4. **Network Isolation**: Services communicate through internal network
5. **Regular Updates**: Keep base images and dependencies updated

```bash
# Update base images
docker compose pull

# Rebuild with latest updates
docker compose build --pull --no-cache
```

## Performance Optimization

### Build Cache

Speed up builds using BuildKit:

```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache
docker compose build
```

### Layer Caching

Dockerfile order optimized for cache efficiency:

1. Install dependencies (changes rarely)
2. Copy source code (changes frequently)
3. Build application

### Volume Performance

For better I/O performance on macOS/Windows:

```yaml
volumes:
  - ./apps/backend/src:/app/apps/backend/src:cached
```

## Monitoring

### Container Stats

```bash
# Real-time resource usage
docker stats

# Specific service
docker stats meeting-manager-backend
```

### Log Aggregation

```bash
# Export logs to file
docker compose logs > docker-logs.txt

# Monitor logs with grep
docker compose logs -f | grep ERROR
```

## Cleanup

### Regular Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

### Complete Reset

```bash
# Stop all containers
docker compose down -v

# Remove all Docker data
docker system prune -a --volumes -f

# Remove project-specific volumes
docker volume rm meeting-manager-postgres-data
```

## Next Steps

- [Deployment Guide](DEPLOYMENT.md) - Deploy to production
- [CI/CD Guide](CI_CD_GUIDE.md) - Automated pipelines
- [Backend API Documentation](apps/backend/API_DOCUMENTATION.md)
- [Frontend Documentation](apps/frontend/README.md)

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Docker logs: `docker compose logs`
3. Verify configuration: `.env` file and `docker-compose.yml`
4. Check Docker Desktop is running
5. Ensure ports are available

For more information:

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project Issues](https://github.com/your-repo/issues)
