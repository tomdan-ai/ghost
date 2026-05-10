import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../config/database';
import { config } from '../config/env';

// Re-export event helpers so callers can import from a single location
export { emitPaymentStatusUpdate, emitWalletUpdate, emitPaymentCreated } from './events';

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
    const token = socket.handshake.auth?.['token'] as string | undefined;

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

    /**
     * subscribe:user — join the user's personal notification room.
     * Users may only subscribe to their own user room (Requirement 6.2).
     */
    socket.on('subscribe:user', (userId: string) => {
      if (userId !== user.id) {
        socket.emit('error', { message: 'Unauthorized: cannot subscribe to another user\'s room' });
        return;
      }
      socket.join(`user:${userId}`);
    });

    /**
     * subscribe:payment — validate ownership then join the payment room.
     * Only the sender or receiver of the payment may subscribe (Requirement 6.2).
     */
    socket.on('subscribe:payment', async (paymentId: string) => {
      try {
        const payment = await prisma.paymentRequest.findUnique({
          where: { id: paymentId },
          select: { senderWallet: true, receiverWallet: true },
        });

        if (!payment) {
          socket.emit('error', { message: 'Payment not found' });
          return;
        }

        const isAuthorized =
          payment.senderWallet === user.walletAddress ||
          payment.receiverWallet === user.walletAddress;

        if (!isAuthorized) {
          socket.emit('error', { message: 'Unauthorized: you are not a participant in this payment' });
          return;
        }

        socket.join(`payment:${paymentId}`);
      } catch (error) {
        console.error('subscribe:payment error:', error);
        socket.emit('error', { message: 'Failed to subscribe to payment' });
      }
    });

    /**
     * subscribe:wallet — validate ownership then join the wallet room.
     * Users may only subscribe to their own wallet address (Requirement 6.2).
     */
    socket.on('subscribe:wallet', (walletAddress: string) => {
      if (walletAddress !== user.walletAddress) {
        socket.emit('error', { message: 'Unauthorized: cannot subscribe to another wallet' });
        return;
      }
      socket.join(`wallet:${walletAddress}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

/**
 * @deprecated Use emitPaymentStatusUpdate from ./events instead.
 * Kept for backwards compatibility with existing callers.
 */
export function emitPaymentUpdate(
  io: Server,
  paymentId: string,
  data: unknown
) {
  io.to(`payment:${paymentId}`).emit('payment:update', data);
}
