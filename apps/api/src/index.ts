import dotenv from 'dotenv';
dotenv.config();

// Force Prisma to use library engine (library is standard for Node.js)
process.env['PRISMA_CLIENT_ENGINE_TYPE'] = 'library';

import express from 'express';
import { createServer } from 'http';
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
import { setupWebSocket } from './websocket/index';

const app = express();
const httpServer = createServer(app);

// ─── Middleware (order matters) ───────────────────────────────────────────────

// 1. Request logging — attach requestId and log every request/response.
app.use(logger.requestLogger);

// 2. CORS
app.use(corsMiddleware);

// 3. Security headers
app.use(securityHeadersMiddleware);

// 4. Content-Type validation
app.use(contentTypeValidation);

// 5. JSON body parsing
app.use(express.json({ limit: '1mb' }));

// 6. Attach cache service to every request
app.use((req, _res, next) => {
  (req as any).cacheService = cacheService;
  next();
});

// 7. Global rate limiting (100 requests/minute)
app.use(rateLimitMiddleware);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRateLimitMiddleware, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

// ─── Health / monitoring endpoints ───────────────────────────────────────────

/**
 * GET /health — liveness probe with service status.
 * Returns 200 with status 'ok' when all services are healthy.
 * Returns 200 with status 'degraded' when Redis is down but DB is up.
 * Returns 503 with status 'error' when DB is down.
 */
app.get('/health', async (_req, res) => {
  let dbStatus = 'connected';
  let redisStatus = 'disconnected';
  let redisStats: Awaited<ReturnType<typeof cacheService.getStats>> | null = null;
  let dbError: string | null = null;

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'disconnected';
    dbError = error instanceof Error ? error.message : 'Unknown error';
  }

  // Check Redis
  try {
    redisStats = await cacheService.getStats();
    redisStatus = redisStats.connected ? 'connected' : 'disconnected';
  } catch {
    redisStatus = 'disconnected';
  }

  const isDbDown = dbStatus === 'disconnected';
  const isRedisDown = redisStatus === 'disconnected';

  let overallStatus: 'ok' | 'degraded' | 'error';
  let httpStatus: number;

  if (isDbDown) {
    overallStatus = 'error';
    httpStatus = 503;
  } else if (isRedisDown) {
    overallStatus = 'degraded';
    httpStatus = 200;
  } else {
    overallStatus = 'ok';
    httpStatus = 200;
  }

  const body: Record<string, unknown> = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env['npm_package_version'] ?? '1.0.0',
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      redis: redisStatus,
      blockchain: blockchainListener ? 'listening' : 'inactive',
    },
    redis: redisStats,
  };

  if (dbError) {
    body['error'] = dbError;
  }

  res.status(httpStatus).json(body);
});

/**
 * GET /health/ready — readiness probe.
 * Returns 200 { ready: true } only when both DB and Redis are connected.
 * Returns 503 { ready: false, reason } otherwise.
 */
app.get('/health/ready', async (_req, res) => {
  let dbOk = false;
  let redisOk = false;
  const reasons: string[] = [];

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    reasons.push('database unavailable');
  }

  try {
    const stats = await cacheService.getStats();
    redisOk = stats.connected;
    if (!redisOk) {
      reasons.push('redis unavailable');
    }
  } catch {
    reasons.push('redis unavailable');
  }

  if (dbOk && redisOk) {
    return res.status(200).json({ ready: true });
  }

  return res.status(503).json({
    ready: false,
    reason: reasons.join(', '),
  });
});

/**
 * GET /health/live — simple liveness probe.
 * Always returns 200 — just confirms the process is running.
 */
app.get('/health/live', (_req, res) => {
  res.status(200).json({
    alive: true,
    uptime: process.uptime(),
  });
});

/**
 * GET /health/metrics — cache hit rates and request statistics.
 * Returns Redis stats from cacheService.getStats().
 * Returns 200 even if Redis is disconnected.
 */
app.get('/health/metrics', async (_req, res) => {
  let stats: Awaited<ReturnType<typeof cacheService.getStats>>;

  try {
    stats = await cacheService.getStats();
  } catch {
    stats = { connected: false, memory: null, keys: 0 };
  }

  res.status(200).json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    redis: stats,
  });
});

// ─── WebSocket setup ──────────────────────────────────────────────────────────

// Replace the old inline `new Server(httpServer, ...)` + unauthenticated
// io.on('connection', ...) block with the authenticated setupWebSocket handler.
// setupWebSocket returns the io Server instance.
const io = setupWebSocket(httpServer);

// Make io available on the app for route handlers that need it.
app.set('io', io);

// ─── Global error handler (must be last) ─────────────────────────────────────

app.use(globalErrorHandler);

// ─── Server startup ───────────────────────────────────────────────────────────

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis (non-blocking — allows fallback)
    connectRedis().catch((error: Error) => {
      console.warn('⚠️ Redis connection failed, continuing with fallback:', error.message);
    });

    httpServer.listen(config.server.port, () => {
      console.log(`🚀 Ghost API running on port ${config.server.port}`);
      console.log(`   Environment: ${config.NODE_ENV}`);
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

// Export io so blockchain-listener.ts can import it.
export { io };
