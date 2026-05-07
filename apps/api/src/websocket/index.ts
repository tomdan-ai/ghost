import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export function setupWebSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe:payment', (paymentId: string) => {
      socket.join(`payment:${paymentId}`);
    });

    socket.on('subscribe:wallet', (walletAddress: string) => {
      socket.join(`wallet:${walletAddress}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function emitPaymentUpdate(
  io: Server,
  paymentId: string,
  data: any
) {
  io.to(`payment:${paymentId}`).emit('payment:update', data);
}

export function emitWalletUpdate(
  io: Server,
  walletAddress: string,
  data: any
) {
  io.to(`wallet:${walletAddress}`).emit('wallet:update', data);
}
