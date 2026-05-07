import { prisma } from '../../config/database';
import { PaymentStatus } from '@ghost/shared-types';
import axios from 'axios';

const LIFI_API = 'https://li.quest/v1';

export class PaymentService {
  async createPaymentRequest(data: {
    senderWallet: string;
    receiverWallet: string;
    amount: string;
    sourceChain: string;
    destinationChain: string;
  }) {
    return prisma.paymentRequest.create({
      data: {
        ...data,
        status: PaymentStatus.PENDING,
      },
    });
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
    return prisma.paymentRequest.update({
      where: { id: paymentId },
      data: { status, txHash },
    });
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
}
