import { PaymentStatus } from '@ghost/shared-types';
import { prisma } from '../../config/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentHistoryOptions {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedPaymentHistory {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PaymentHistoryService {
  /**
   * Retrieve paginated payment history for a wallet address.
   * Includes payments where the wallet is either sender or receiver.
   * Sorted by createdAt DESC (newest first). Requirements 7.1–7.6, 7.9.
   */
  async getHistory(
    walletAddress: string,
    options: PaymentHistoryOptions = {}
  ): Promise<PaginatedPaymentHistory> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    // Build the where clause
    const walletFilter = {
      OR: [
        { senderWallet: walletAddress },
        { receiverWallet: walletAddress },
      ],
    };

    const statusFilter = options.status ? { status: options.status } : {};

    const dateFilter: Record<string, any> = {};
    if (options.startDate || options.endDate) {
      dateFilter['createdAt'] = {};
      if (options.startDate) {
        dateFilter['createdAt']['gte'] = options.startDate;
      }
      if (options.endDate) {
        dateFilter['createdAt']['lte'] = options.endDate;
      }
    }

    const where = {
      ...walletFilter,
      ...statusFilter,
      ...dateFilter,
    };

    try {
      const [data, total] = await Promise.all([
        prisma.paymentRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.paymentRequest.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Payment history DB lookup failed:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  /**
   * Filter payments for a wallet by a specific status.
   * Requirement 7.3.
   */
  async getPaymentsByStatus(
    walletAddress: string,
    status: PaymentStatus
  ): Promise<any[]> {
    try {
      return await prisma.paymentRequest.findMany({
        where: {
          OR: [
            { senderWallet: walletAddress },
            { receiverWallet: walletAddress },
          ],
          status,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Payment status lookup failed:', error);
      return [];
    }
  }

  /**
   * Retrieve the most recent N payments for a wallet address.
   * Defaults to 10 if limit is not provided. Requirement 7.2.
   */
  async getRecentPayments(walletAddress: string, limit: number = 10): Promise<any[]> {
    try {
      return await prisma.paymentRequest.findMany({
        where: {
          OR: [
            { senderWallet: walletAddress },
            { receiverWallet: walletAddress },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Recent payments lookup failed:', error);
      return [];
    }
  }
}
