import { PaginatedPaymentHistory } from './payment-history.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerializedPayment {
  id: string;
  senderWallet: string;
  receiverWallet: string;
  /** Amount preserved as a string to maintain decimal precision. */
  amount: string;
  sourceChain: string;
  destinationChain: string;
  status: string;
  txHash: string | null;
  destinationTxHash: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface SerializedPaginatedResponse {
  data: SerializedPayment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── PaymentSerializer ────────────────────────────────────────────────────────

export class PaymentSerializer {
  /**
   * Convert a DB payment record to a consistent API response object.
   * - Null fields are included as null (not omitted)
   * - Decimal precision for amount is preserved (kept as string)
   * - Dates are formatted as ISO 8601 strings
   * Requirements: 16.3, 16.7, 16.8
   */
  serialize(payment: any): SerializedPayment {
    return {
      id: String(payment.id),
      senderWallet: String(payment.senderWallet),
      receiverWallet: String(payment.receiverWallet),
      // Preserve decimal precision — keep as string
      amount: String(payment.amount),
      sourceChain: String(payment.sourceChain),
      destinationChain: String(payment.destinationChain),
      status: String(payment.status),
      // Null fields are explicitly included as null
      txHash: payment.txHash != null ? String(payment.txHash) : null,
      destinationTxHash: payment.destinationTxHash != null ? String(payment.destinationTxHash) : null,
      // ISO 8601 date strings
      createdAt: this.toISOString(payment.createdAt),
      completedAt: payment.completedAt != null ? this.toISOString(payment.completedAt) : null,
    };
  }

  /**
   * Serialize an array of payment records.
   * Requirements: 16.3, 16.7, 16.8
   */
  serializeList(payments: any[]): SerializedPayment[] {
    return payments.map((p) => this.serialize(p));
  }

  /**
   * Wrap a paginated result from PaymentHistoryService into a serialized response.
   * Requirements: 16.3, 16.7, 16.8
   */
  serializePaginated(result: PaginatedPaymentHistory): SerializedPaginatedResponse {
    return {
      data: this.serializeList(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Convert a Date, string, or number to an ISO 8601 string.
   */
  private toISOString(value: Date | string | number | null | undefined): string {
    if (value == null) {
      return new Date(0).toISOString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Attempt to parse strings and numbers
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    // Fallback: return the raw string value
    return String(value);
  }
}
