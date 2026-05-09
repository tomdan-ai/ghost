import { connection, ghostRegistryProgram } from '../../config/solana';
import { PaymentService } from './payment.service';
import { io } from '../../index';

const paymentService = new PaymentService();

/**
 * Listen to blockchain events for payment references
 */
export class BlockchainListener {
  private isListening = false;

  /**
   * Start listening to blockchain events
   */
  async start() {
    if (this.isListening) {
      console.log('⚠️  Blockchain listener already running');
      return;
    }

    this.isListening = true;
    console.log('👂 Starting blockchain event listener...');

    try {
      // Listen to PaymentReferenceCreated events
      ghostRegistryProgram.addEventListener('PaymentReferenceCreated', (event, slot) => {
        console.log('📢 PaymentReferenceCreated event:', event);
        this.handlePaymentCreated(event);
      });

      // Listen to PaymentReferenceClaimed events
      ghostRegistryProgram.addEventListener('PaymentReferenceClaimed', (event, slot) => {
        console.log('📢 PaymentReferenceClaimed event:', event);
        this.handlePaymentClaimed(event);
      });

      // Listen to PaymentReferenceCancelled events
      ghostRegistryProgram.addEventListener('PaymentReferenceCancelled', (event, slot) => {
        console.log('📢 PaymentReferenceCancelled event:', event);
        this.handlePaymentCancelled(event);
      });

      console.log('✅ Blockchain listener started successfully');
    } catch (error) {
      console.error('❌ Failed to start blockchain listener:', error);
      this.isListening = false;
    }
  }

  /**
   * Stop listening to blockchain events
   */
  stop() {
    if (!this.isListening) {
      return;
    }

    // Remove all event listeners
    ghostRegistryProgram.removeEventListener('PaymentReferenceCreated', () => {});
    ghostRegistryProgram.removeEventListener('PaymentReferenceClaimed', () => {});
    ghostRegistryProgram.removeEventListener('PaymentReferenceCancelled', () => {});

    this.isListening = false;
    console.log('🛑 Blockchain listener stopped');
  }

  /**
   * Handle payment created event
   */
  private async handlePaymentCreated(event: any) {
    try {
      const { id, sender, receiver, username, amount } = event;

      console.log(`💰 Payment created: ${id} from ${sender} to ${receiver} (${username})`);

      // Emit real-time notification
      io.to(`user:${receiver}`).emit('payment:incoming', {
        id,
        sender,
        amount: amount.toString(),
        username,
      });
    } catch (error) {
      console.error('Failed to handle payment created event:', error);
    }
  }

  /**
   * Handle payment claimed event
   */
  private async handlePaymentClaimed(event: any) {
    try {
      const { id, receiver } = event;

      console.log(`✅ Payment claimed: ${id} by ${receiver}`);

      // Update database
      await paymentService.updatePaymentStatus(id, 'COMPLETED' as any);

      // Emit real-time notification
      io.to(`payment:${id}`).emit('payment:claimed', {
        id,
        receiver,
      });
    } catch (error) {
      console.error('Failed to handle payment claimed event:', error);
    }
  }

  /**
   * Handle payment cancelled event
   */
  private async handlePaymentCancelled(event: any) {
    try {
      const { id, sender } = event;

      console.log(`❌ Payment cancelled: ${id} by ${sender}`);

      // Update database
      await paymentService.updatePaymentStatus(id, 'CANCELLED' as any);

      // Emit real-time notification
      io.to(`payment:${id}`).emit('payment:cancelled', {
        id,
        sender,
      });
    } catch (error) {
      console.error('Failed to handle payment cancelled event:', error);
    }
  }
}

// Export singleton instance
export const blockchainListener = new BlockchainListener();
