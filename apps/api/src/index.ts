import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma, connectDatabase } from './config/database';
import { connectRedis, cacheService } from './config/redis';
import { config } from './config/env';
import { logger } from './config/logger';
import { corsMiddleware, securityHeadersMiddleware, contentTypeValidation } from './middleware/security';
import { rateLimitMiddleware, authRateLimitMiddleware } from './middleware/rateLimit';
import { globalErrorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import paymentRoutes from './routes/payments';
import { blockchainListener } from './modules/payment/blockchain-listener';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.server.corsOrigin,
  },
});

// Request logging — attach requestId and log every request/response.
app.use(logger.requestLogger);

// Security middleware.
app.use(corsMiddleware);
app.use(securityHeadersMiddleware);
app.use(contentTypeValidation);

app.use(express.json({ limit: '1mb' }));

// Add cache service to request object
app.use((req, _res, next) => {
  (req as any).cacheService = cacheService;
  next();
});

// Global rate limiting (100 requests/minute)
app.use(rateLimitMiddleware);

// Routes with specific rate limiting
app.use('/api/auth', authRateLimitMiddleware, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    const redisStats = await cacheService.getStats();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      services: {
        database: 'connected',
        redis: redisStats.connected ? 'connected' : 'disconnected',
        blockchain: blockchainListener ? 'listening' : 'inactive',
      },
      redis: redisStats,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        redis: 'unknown',
        blockchain: 'unknown',
      },
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Cache stats endpoint (admin only)
app.get('/health/cache', async (_req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ...stats,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Cache stats failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe:payment', (paymentId: string) => {
    socket.join(`payment:${paymentId}`);
  });

  socket.on('subscribe:user', (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available globally
app.set('io', io);

// Global error handler — must be the last middleware registered (Requirements 8.7–8.9).
app.use(globalErrorHandler);

// Connect to database and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis (non-blocking - allows fallback)
    connectRedis().catch((error: Error) => {
      console.warn('⚠️ Redis connection failed, continuing with fallback:', error.message);
    });

    httpServer.listen(config.server.port, () => {
      console.log(`🚀 Ghost API running on port ${config.server.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   CORS Origin: ${config.server.corsOrigin}`);
      console.log(`   Rate Limit: ${config.rateLimit.maxRequests} requests/minute`);
      console.log(`   Cache TTL: ${config.cache.routesTtlMs / 60000} minutes for routes`);
    });

    // Start blockchain listener (non-blocking)
    if (process.env['ENABLE_BLOCKCHAIN_LISTENER'] !== 'false') {
      blockchainListener.start().catch((error: Error) => {
        console.warn('⚠️ Failed to start blockchain listener:', error.message);
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };
