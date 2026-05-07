import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDatabase } from './config/database';
import { setupWebSocket } from './websocket';
import authRoutes from './modules/auth/auth.routes';
import usernameRoutes from './modules/username/username.routes';
import paymentRoutes from './modules/payment/payment.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = setupWebSocket(httpServer);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/username', usernameRoutes);
app.use('/payment', paymentRoutes);

const PORT = process.env.PORT || 3001;

async function start() {
  await connectDatabase();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Ghost API running on port ${PORT}`);
  });
}

start().catch(console.error);

export { io };
