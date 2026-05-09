import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import { supabase } from '../config/supabase';
import { config } from '../config/env';

// Create a minimal test app
const createTestApp = () => {
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

  // Health endpoint
  app.get('/health', async (req, res) => {
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      res.json({ 
        status: 'ok',
        database: error ? 'error' : 'connected'
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
  });

  return { app, httpServer, io };
};

describe('Health Check', () => {
  let testApp: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    testApp = createTestApp();
  });

  afterAll(() => {
    testApp.httpServer.close();
  });

  it('should return health status', async () => {
    const response = await request(testApp.app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('database');
  });

  it('should have environment validation working', () => {
    // Test that config was loaded successfully
    expect(config).toBeDefined();
    expect(config.server).toBeDefined();
    expect(config.server.port).toBe(3002); // From .env.test
    expect(config.nodeEnv).toBe('test');
  });
});