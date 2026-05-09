/**
 * TransactionService — manages transaction records for payment requests.
 *
 * Stores source and destination transaction hashes (Requirements 5.7, 5.8, 17.7).
 */

import { prisma } from '../../config/database';
import { PaymentStatus } from '@ghost/shared-types';

export interface CreateTransactionInput {
  paymentRequestId: string;
  sourceTx?: string;
  destinationTx?: string;
  status?: string;
}

export interface UpdateTransactionHashesInput {
  sourceTx?: string;
  destinationTx?: string;
}

export class TransactionService {
  /**
   * Create a new transaction record for a payment request.
   * Initialises with PENDING status unless overridden (Requirement 5.7).
   */
  async createTransaction(input: CreateTransactionInput) {
    const { paymentRequestId, sourceTx, destinationTx, status } = input;

    return prisma.transaction.create({
      data: {
        paymentRequestId,
        sourceTx: sourceTx ?? null,
        destinationTx: destinationTx ?? null,
        status: status ?? PaymentStatus.PENDING,
      },
    });
  }

  /**
   * Update the source and/or destination transaction hashes for an existing
   * transaction record (Requirement 5.7, 17.7).
   *
   * Only the fields that are explicitly provided are updated; omitted fields
   * are left unchanged.
   */
  async updateTransactionHashes(
    transactionId: string,
    updates: UpdateTransactionHashesInput
  ) {
    const data: Record<string, string | null> = {};

    if (updates.sourceTx !== undefined) {
      data['sourceTx'] = updates.sourceTx;
    }
    if (updates.destinationTx !== undefined) {
      data['destinationTx'] = updates.destinationTx;
    }

    if (Object.keys(data).length === 0) {
      // Nothing to update — return the current record unchanged
      return prisma.transaction.findUniqueOrThrow({
        where: { id: transactionId },
      });
    }

    return prisma.transaction.update({
      where: { id: transactionId },
      data,
    });
  }

  /**
   * Update the status of an existing transaction record (Requirement 5.7, 17.1).
   *
   * Used by the payment state machine to reflect the current processing stage
   * of a transaction (e.g. PENDING → PROCESSING → COMPLETED / FAILED).
   */
  async updateTransactionStatus(transactionId: string, status: string) {
    return prisma.transaction.update({
      where: { id: transactionId },
      data: { status },
    });
  }

  /**
   * Retrieve all transaction records associated with a payment request
   * (Requirement 5.5, 5.7).
   *
   * Results are ordered by creation date ascending so callers see the
   * chronological sequence of transactions.
   */
  async getTransactionsByPayment(paymentRequestId: string) {
    return prisma.transaction.findMany({
      where: { paymentRequestId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Retrieve a single transaction record by its ID.
   * Returns null when the record does not exist.
   */
  async getTransactionById(transactionId: string) {
    return prisma.transaction.findUnique({
      where: { id: transactionId },
    });
  }
}
