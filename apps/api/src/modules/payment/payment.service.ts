import { PublicKey } from '@solana/web3.js';
import { prisma } from '../../config/database';
import { PaymentStatus } from '@ghost/shared-types';
import axios from 'axios';
import { SolanaPaymentService } from './solana.service';
import { io } from '../../index';

const LIFI_API = 'https://li.quest/v1';
const solanaPaymentService = new SolanaPaymentService();

export class PaymentService {
  /**
   * Create payment request with blockchain reference
   */
  async createPaymentRequest(data: {
    senderWallet: string;
    receiverWallet: string;
    receiverUsername?: string;
    amount: string;
    sourceChain: string;
    destinationChain: string;
  }) {
    // Create in database first
    const payment = await prisma.paymentRequest.create({
      data: {
        ...data,
        status: PaymentStatus.PENDING,
      },
    });

    // If receiver has a username, create on-chain reference
    if (data.receiverUsername) {
      try {
        const senderPubkey = new PublicKey(data.senderWallet);
        const amountInLamports = Math.floor(parseFloat(data.amount) * 1e9); // Convert to lamports

        const { signature, referencePDA } = await solanaPaymentService.createPaymentReference(
          data.receiverUsername,
          payment.id,
          amountInLamports,
          data.sourceChain,
          senderPubkey
        );

        // Update payment with blockchain data
        await prisma.paymentRequest.update({
          where: { id: payment.id },
          data: {
            onChainAddress: referencePDA,
            creationTx: signature,
          },
        });

        console.log(`✅ Payment reference created on-chain: ${signature}`);
      } catch (error) {
        console.error('⚠️  Failed to create on-chain reference:', error);
        // Continue without blockchain reference
      }
    }

    return payment;
  }

  async getRoute(params: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
  }) {
    try {
      const response = await axios.get(`${LIFI_API}/quote`, {
        params: {
          fromChain: params.fromChain,
          toChain: params.toChain,
          fromToken: params.fromToken,
          toToken: params.toToken,
          fromAmount: params.fromAmount,
          fromAddress: params.fromAddress,
          toAddress: params.toAddress,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error('Failed to get route from LI.FI');
    }
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    txHash?: string
  ) {
    const payment = await prisma.paymentRequest.update({
      where: { id: paymentId },
      data: { status, txHash },
      include: { receiver: true },
    });

    // If payment is completed and has on-chain reference, claim it
    if (status === PaymentStatus.COMPLETED && payment.onChainAddress) {
      try {
        const receiverPubkey = new PublicKey(payment.receiverWallet);
        const username = payment.receiver?.username;

        if (username) {
          const { signature } = await solanaPaymentService.claimPaymentReference(
            username,
            paymentId,
            receiverPubkey
          );

          await prisma.paymentRequest.update({
            where: { id: paymentId },
            data: { claimTx: signature },
          });

          console.log(`✅ Payment claimed on-chain: ${signature}`);
        }
      } catch (error) {
        console.error('⚠️  Failed to claim on-chain:', error);
      }
    }

    // Emit real-time update
    io.to(`payment:${paymentId}`).emit('payment:status', {
      paymentId,
      status,
      txHash,
    });

    return payment;
  }

  /**
   * Cancel payment and update blockchain
   */
  async cancelPayment(paymentId: string, userWallet: string) {
    const payment = await prisma.paymentRequest.findUnique({
      where: { id: paymentId },
      include: { receiver: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Can only cancel pending payments');
    }

    // Cancel on blockchain if exists
    if (payment.onChainAddress) {
      try {
        const userPubkey = new PublicKey(userWallet);
        const username = payment.receiver?.username;

        if (username) {
          const { signature } = await solanaPaymentService.cancelPaymentReference(
            username,
            paymentId,
            userPubkey
          );

          await prisma.paymentRequest.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.CANCELLED,
              cancelTx: signature,
            },
          });

          console.log(`✅ Payment cancelled on-chain: ${signature}`);
        }
      } catch (error) {
        console.error('⚠️  Failed to cancel on-chain:', error);
      }
    }

    // Update in database
    const updated = await prisma.paymentRequest.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.CANCELLED },
    });

    // Emit real-time update
    io.to(`payment:${paymentId}`).emit('payment:cancelled', {
      paymentId,
    });

    return updated;
  }

  async getPaymentHistory(walletAddress: string) {
    return prisma.paymentRequest.findMany({
      where: {
        OR: [
          { senderWallet: walletAddress },
          { receiverWallet: walletAddress },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentById(id: string) {
    return prisma.paymentRequest.findUnique({
      where: { id },
      include: { transactions: true },
    });
  }

  /**
   * Get payment with blockchain data
   */
  async getPaymentWithBlockchainData(id: string, username?: string) {
    const payment = await this.getPaymentById(id);

    if (!payment) {
      return null;
    }

    // Fetch blockchain data if available
    if (username && payment.onChainAddress) {
      try {
        const chainData = await solanaPaymentService.getPaymentReference(
          username,
          id
        );

        return {
          ...payment,
          blockchain: chainData,
        };
      } catch (error) {
        console.error('Failed to fetch blockchain data:', error);
      }
    }

    return payment;
  }

  /**
   * Get payments by username (from blockchain)
   */
  async getPaymentsByUsername(username: string) {
    const chainPayments = await solanaPaymentService.getPaymentsByUsername(username);

    // Merge with database data
    const merged = await Promise.all(
      chainPayments.map(async (chainPayment) => {
        const dbPayment = await prisma.paymentRequest.findUnique({
          where: { id: chainPayment.id },
        });

        return {
          ...dbPayment,
          blockchain: chainPayment,
        };
      })
    );

    return merged;
  }

  /**
   * Sync blockchain payment to database
   */
  async syncPaymentFromBlockchain(username: string, paymentId: string) {
    const chainData = await solanaPaymentService.getPaymentReference(
      username,
      paymentId
    );

    if (!chainData) {
      throw new Error('Payment not found on blockchain');
    }

    // Check if exists in database
    const existing = await prisma.paymentRequest.findUnique({
      where: { id: paymentId },
    });

    if (existing) {
      // Update with blockchain data
      return await prisma.paymentRequest.update({
        where: { id: paymentId },
        data: {
          onChainAddress: chainData.pda,
          status: this.mapBlockchainStatus(chainData.status),
        },
      });
    }

    return chainData;
  }

  /**
   * Map blockchain status to database status
   */
  private mapBlockchainStatus(status: string): PaymentStatus {
    switch (status) {
      case 'Pending':
        return PaymentStatus.PENDING;
      case 'Claimed':
        return PaymentStatus.COMPLETED;
      case 'Cancelled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
