/**
 * Meeting Management Backend API
 * Built with Express.js, TypeScript, and Prisma
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as path from 'path';

// Import routes
import authRoutes from './endpoints/auth';
import meetingsRoutes from './endpoints/meetings';
import candidatesRoutes from './endpoints/candidates';
import positionsRoutes from './endpoints/positions';
import participantsRoutes from './endpoints/participants';
import candidateHistoryRoutes from './endpoints/candidateHistory';

// Import middleware
import { errorHandler } from './utilities/middleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API health check endpoint (additional endpoint for deployment platforms)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Meeting Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      meetings: '/api/meetings',
      candidates: '/api/candidates',
      positions: '/api/positions',
      appliedPositions: '/api/positions/applied',
      participants: '/api/meetings/:id/participants',
      candidateHistory: '/api/candidates/:id/history',
    },
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/positions', positionsRoutes);
app.use('/api/meetings', participantsRoutes);
app.use('/api/candidates', candidateHistoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  Meeting Management API Server                 ║
║  Environment: ${process.env.NODE_ENV || 'development'.padEnd(33)}║
║  Port: ${port.toString().padEnd(40)}║
║  URL: http://localhost:${port}/api${' '.repeat(23)}║
╚════════════════════════════════════════════════╝
  `);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
