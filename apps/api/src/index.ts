import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { supabase } from './config/supabase';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import paymentRoutes from './routes/payments';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

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

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Ghost API running on port ${PORT}`);
});

export { io };
