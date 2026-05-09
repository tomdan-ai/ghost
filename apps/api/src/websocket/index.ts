import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../config/database';
import { config } from '../config/env';

const authService = new AuthService();

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      walletAddress: string;
      username: string | null;
      createdAt: Date;
    };
  };
}

/**
 * Authenticates a WebSocket connection using the JWT token provided in the
 * socket handshake auth object: { token: "..." }
 *
 * Requirements: 6.1, 6.2, 12.10
 */
async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token: string | undefined = socket.handshake.auth?.token;

    if (!token) {
      return next(
        Object.assign(new Error('Authentication required'), {
          data: { code: 'AUTHENTICATION_REQUIRED' },
        })
      );
    }

    // Verify JWT token
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      return next(
        Object.assign(new Error('Invalid token'), {
          data: { code: 'INVALID_TOKEN' },
        })
      );
    }

    // Check token expiration
    if (authService.isTokenExpired(token)) {
      return next(
        Object.assign(new Error('Token expired'), {
          data: { code: 'TOKEN_EXPIRED' },
        })
      );
    }

    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { walletAddress: decoded.walletAddress },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(
        Object.assign(new Error('User not found'), {
          data: { code: 'USER_NOT_FOUND' },
        })
      );
    }

    // Attach decoded user to socket data for downstream use
    (socket as AuthenticatedSocket).data.user = user;

    next();
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    next(
      Object.assign(new Error('Authentication failed'), {
        data: { code: 'AUTHENTICATION_FAILED' },
      })
    );
  }
}

export function setupWebSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.server.corsOrigin,
    },
  });

  // Apply JWT authentication middleware to all incoming connections
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const user = (socket as AuthenticatedSocket).data.user;
    console.log(`Client connected: ${socket.id} (wallet: ${user.walletAddress.slice(0, 8)}...)`);

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
  data: unknown
) {
  io.to(`payment:${paymentId}`).emit('payment:update', data);
}

export function emitWalletUpdate(
  io: Server,
  walletAddress: string,
  data: unknown
) {
  io.to(`wallet:${walletAddress}`).emit('wallet:update', data);
}
