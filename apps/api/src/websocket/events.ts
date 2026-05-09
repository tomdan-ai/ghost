/**
 * WebSocket event emission helpers.
 *
 * These functions are used by the payment service (and other services) to push
 * real-time updates to connected clients without needing a direct reference to
 * the Socket.io server instance in every module.
 *
 * Requirements: 6.3, 6.4, 6.5
 */

import { Server } from 'socket.io';

/**
 * Emit a payment status update to all clients subscribed to the given payment.
 *
 * Clients subscribe via the `subscribe:payment` event and are placed in the
 * `payment:{paymentId}` room.  This function broadcasts to that room.
 *
 * @param io        - The Socket.io server instance
 * @param paymentId - The payment request ID
 * @param status    - The new payment status string (e.g. "PROCESSING", "COMPLETED")
 * @param data      - Additional payload to include in the event
 */
export function emitPaymentStatusUpdate(
  io: Server,
  paymentId: string,
  status: string,
  data?: Record<string, unknown>
): void {
  io.to(`payment:${paymentId}`).emit('payment:status', {
    paymentId,
    status,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit a wallet update event to all clients subscribed to the given wallet.
 *
 * Clients subscribe via the `subscribe:wallet` event and are placed in the
 * `wallet:{address}` room.
 *
 * @param io            - The Socket.io server instance
 * @param walletAddress - The wallet address
 * @param data          - Payload to include in the event
 */
export function emitWalletUpdate(
  io: Server,
  walletAddress: string,
  data: Record<string, unknown>
): void {
  io.to(`wallet:${walletAddress}`).emit('wallet:update', {
    walletAddress,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit a payment-created event to the receiver's wallet room.
 *
 * When a new payment request is created, the receiver is notified via their
 * wallet subscription room so they can react in real time.
 *
 * @param io             - The Socket.io server instance
 * @param receiverWallet - The receiver's wallet address
 * @param data           - Payload describing the new payment
 */
export function emitPaymentCreated(
  io: Server,
  receiverWallet: string,
  data: Record<string, unknown>
): void {
  io.to(`wallet:${receiverWallet}`).emit('payment:created', {
    receiverWallet,
    ...data,
    timestamp: new Date().toISOString(),
  });
}
