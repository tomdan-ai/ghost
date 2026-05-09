import { PaymentStatus } from '@ghost/shared-types';
import { prisma } from '../../config/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  paymentRequestId: string;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  metadata: any;
  createdAt: Date;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AuditService {
  /**
   * Create an audit log entry for a payment state transition.
   * Requirements 7.7, 7.8, 17.5.
   */
  async logStateTransition(
    paymentId: string,
    fromStatus: PaymentStatus,
    toStatus: PaymentStatus,
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<AuditLogEntry> {
    return prisma.auditLog.create({
      data: {
        paymentRequestId: paymentId,
        fromStatus,
        toStatus,
        reason: reason ?? null,
        metadata: metadata ?? null,
      },
    });
  }

  /**
   * Retrieve the full audit trail for a payment, sorted oldest-first.
   * Requirements 7.7, 7.8.
   */
  async getAuditTrail(paymentId: string): Promise<AuditLogEntry[]> {
    return prisma.auditLog.findMany({
      where: { paymentRequestId: paymentId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
