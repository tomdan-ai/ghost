import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { prisma, connectDatabase } from './config/database';
import { connectRedis, cacheService } from './config/redis';
import { config } from './config/env';
import { rateLimitMiddleware, authRateLimitMiddleware } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import paymentRoutes from './routes/payments';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.server.corsOrigin,
  },
});

app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Add cache service to request object
app.use((req, res, next) => {
  (req as any).cacheService = cacheService;
  next();
});

// Global rate limiting (100 requests/minute)
app.use(rateLimitMiddleware);

// Routes with specific rate limiting
app.use('/api/auth', authRateLimitMiddleware, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', async (req, res) => {
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
      },
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Cache stats endpoint (admin only)
app.get('/health/cache', async (req, res) => {
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
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available globally
app.set('io', io);

// Connect to database and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Connect to Redis (non-blocking - allows fallback)
    connectRedis().catch(error => {
      console.warn('⚠️ Redis connection failed, continuing with fallback:', error.message);
    });
    
    httpServer.listen(config.server.port, () => {
      console.log(`🚀 Ghost API running on port ${config.server.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   CORS Origin: ${config.server.corsOrigin}`);
      console.log(`   Rate Limit: ${config.rateLimit.maxRequests} requests/minute`);
      console.log(`   Cache TTL: ${config.cache.routesTtlMs / 60000} minutes for routes`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };
