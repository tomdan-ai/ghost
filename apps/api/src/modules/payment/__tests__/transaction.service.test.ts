/**
 * Unit tests for TransactionService — transaction hash storage
 * Requirements: 5.7, 5.8, 17.7
 */

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockFindUniqueOrThrow = jest.fn();

jest.mock('../../../config/database', () => ({
  prisma: {
    transaction: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findUniqueOrThrow: (...args: unknown[]) => mockFindUniqueOrThrow(...args),
    },
  },
}));

import { TransactionService } from '../transaction.service';
import { PaymentStatus } from '@ghost/shared-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_REQUEST_ID = 'payment-uuid-1234';
const TRANSACTION_ID = 'tx-uuid-5678';
const SOURCE_TX_HASH = '5KtPn1LGuxhFiwjxErkxTb7XxtLVHL4NkEkkFHqPy3cvABCDEFGHIJKLMNOPQRSTUVWXYZ12';
const DEST_TX_HASH = '0xabc123def456789012345678901234567890abcdef1234567890abcdef12345678';

function makeTransactionRecord(overrides: Partial<any> = {}) {
  return {
    id: TRANSACTION_ID,
    paymentRequestId: PAYMENT_REQUEST_ID,
    sourceTx: null,
    destinationTx: null,
    status: PaymentStatus.PENDING,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    service = new TransactionService();
    jest.clearAllMocks();
  });

  // ─── createTransaction ─────────────────────────────────────────────────────

  describe('createTransaction (Requirements 5.7, 17.7)', () => {
    it('creates a transaction record with PENDING status by default', async () => {
      const record = makeTransactionRecord();
      mockCreate.mockResolvedValue(record);

      const result = await service.createTransaction({ paymentRequestId: PAYMENT_REQUEST_ID });

      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentRequestId: PAYMENT_REQUEST_ID,
            status: PaymentStatus.PENDING,
          }),
        })
      );
    });

    it('stores sourceTx when provided', async () => {
      const record = makeTransactionRecord({ sourceTx: SOURCE_TX_HASH });
      mockCreate.mockResolvedValue(record);

      const result = await service.createTransaction({
        paymentRequestId: PAYMENT_REQUEST_ID,
        sourceTx: SOURCE_TX_HASH,
      });

      expect(result.sourceTx).toBe(SOURCE_TX_HASH);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sourceTx: SOURCE_TX_HASH }),
        })
      );
    });

    it('stores destinationTx when provided', async () => {
      const record = makeTransactionRecord({ destinationTx: DEST_TX_HASH });
      mockCreate.mockResolvedValue(record);

      const result = await service.createTransaction({
        paymentRequestId: PAYMENT_REQUEST_ID,
        destinationTx: DEST_TX_HASH,
      });

      expect(result.destinationTx).toBe(DEST_TX_HASH);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ destinationTx: DEST_TX_HASH }),
        })
      );
    });

    it('stores both sourceTx and destinationTx when both are provided', async () => {
      const record = makeTransactionRecord({ sourceTx: SOURCE_TX_HASH, destinationTx: DEST_TX_HASH });
      mockCreate.mockResolvedValue(record);

      const result = await service.createTransaction({
        paymentRequestId: PAYMENT_REQUEST_ID,
        sourceTx: SOURCE_TX_HASH,
        destinationTx: DEST_TX_HASH,
      });

      expect(result.sourceTx).toBe(SOURCE_TX_HASH);
      expect(result.destinationTx).toBe(DEST_TX_HASH);
    });

    it('sets sourceTx and destinationTx to null when not provided', async () => {
      const record = makeTransactionRecord();
      mockCreate.mockResolvedValue(record);

      await service.createTransaction({ paymentRequestId: PAYMENT_REQUEST_ID });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sourceTx: null,
            destinationTx: null,
          }),
        })
      );
    });

    it('accepts a custom status override', async () => {
      const record = makeTransactionRecord({ status: PaymentStatus.PROCESSING });
      mockCreate.mockResolvedValue(record);

      const result = await service.createTransaction({
        paymentRequestId: PAYMENT_REQUEST_ID,
        status: PaymentStatus.PROCESSING,
      });

      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PaymentStatus.PROCESSING }),
        })
      );
    });

    it('returns the created transaction record with all fields', async () => {
      const record = makeTransactionRecord({ sourceTx: SOURCE_TX_HASH });
      mockCreate.mockResolvedValue(record);

      const result = await service.createTransaction({
        paymentRequestId: PAYMENT_REQUEST_ID,
        sourceTx: SOURCE_TX_HASH,
      });

      expect(result.id).toBe(TRANSACTION_ID);
      expect(result.paymentRequestId).toBe(PAYMENT_REQUEST_ID);
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  // ─── updateTransactionHashes ───────────────────────────────────────────────

  describe('updateTransactionHashes (Requirements 5.7, 17.7)', () => {
    it('updates sourceTx when provided', async () => {
      const updated = makeTransactionRecord({ sourceTx: SOURCE_TX_HASH });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateTransactionHashes(TRANSACTION_ID, {
        sourceTx: SOURCE_TX_HASH,
      });

      expect(result.sourceTx).toBe(SOURCE_TX_HASH);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
        data: { sourceTx: SOURCE_TX_HASH },
      });
    });

    it('updates destinationTx when provided', async () => {
      const updated = makeTransactionRecord({ destinationTx: DEST_TX_HASH });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateTransactionHashes(TRANSACTION_ID, {
        destinationTx: DEST_TX_HASH,
      });

      expect(result.destinationTx).toBe(DEST_TX_HASH);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
        data: { destinationTx: DEST_TX_HASH },
      });
    });

    it('updates both hashes when both are provided', async () => {
      const updated = makeTransactionRecord({
        sourceTx: SOURCE_TX_HASH,
        destinationTx: DEST_TX_HASH,
      });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateTransactionHashes(TRANSACTION_ID, {
        sourceTx: SOURCE_TX_HASH,
        destinationTx: DEST_TX_HASH,
      });

      expect(result.sourceTx).toBe(SOURCE_TX_HASH);
      expect(result.destinationTx).toBe(DEST_TX_HASH);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
        data: { sourceTx: SOURCE_TX_HASH, destinationTx: DEST_TX_HASH },
      });
    });

    it('does not call update when no fields are provided — falls back to findUniqueOrThrow', async () => {
      const existing = makeTransactionRecord();
      mockFindUniqueOrThrow.mockResolvedValue(existing);

      const result = await service.updateTransactionHashes(TRANSACTION_ID, {});

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockFindUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
      });
      expect(result).toEqual(existing);
    });

    it('only includes provided fields in the update payload (partial update)', async () => {
      const updated = makeTransactionRecord({ sourceTx: SOURCE_TX_HASH });
      mockUpdate.mockResolvedValue(updated);

      await service.updateTransactionHashes(TRANSACTION_ID, {
        sourceTx: SOURCE_TX_HASH,
        // destinationTx intentionally omitted
      });

      const callArg = mockUpdate.mock.calls[0][0];
      expect(callArg.data).not.toHaveProperty('destinationTx');
    });

    it('returns the updated transaction record (Requirement 5.7)', async () => {
      const updated = makeTransactionRecord({
        sourceTx: SOURCE_TX_HASH,
        destinationTx: DEST_TX_HASH,
      });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateTransactionHashes(TRANSACTION_ID, {
        sourceTx: SOURCE_TX_HASH,
        destinationTx: DEST_TX_HASH,
      });

      expect(result.id).toBe(TRANSACTION_ID);
      expect(result.sourceTx).toBe(SOURCE_TX_HASH);
      expect(result.destinationTx).toBe(DEST_TX_HASH);
    });
  });

  // ─── updateTransactionStatus ──────────────────────────────────────────────

  describe('updateTransactionStatus (Requirements 5.7, 17.1)', () => {
    it('updates the status of a transaction record', async () => {
      const updated = makeTransactionRecord({ status: PaymentStatus.PROCESSING });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateTransactionStatus(TRANSACTION_ID, PaymentStatus.PROCESSING);

      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
        data: { status: PaymentStatus.PROCESSING },
      });
    });

    it('can transition status to COMPLETED', async () => {
      const updated = makeTransactionRecord({ status: PaymentStatus.COMPLETED });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateTransactionStatus(TRANSACTION_ID, PaymentStatus.COMPLETED);

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
        data: { status: PaymentStatus.COMPLETED },
      });
    });

    it('can transition status to FAILED', async () => {
      const updated = makeTransactionRecord({ status: PaymentStatus.FAILED });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateTransactionStatus(TRANSACTION_ID, PaymentStatus.FAILED);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
        data: { status: PaymentStatus.FAILED },
      });
    });

    it('returns the updated transaction record', async () => {
      const updated = makeTransactionRecord({ status: PaymentStatus.PROCESSING });
      mockUpdate.mockResolvedValue(updated);

      const result = await service.updateTransactionStatus(TRANSACTION_ID, PaymentStatus.PROCESSING);

      expect(result.id).toBe(TRANSACTION_ID);
      expect(result.paymentRequestId).toBe(PAYMENT_REQUEST_ID);
    });

    it('only updates the status field, not other fields', async () => {
      const updated = makeTransactionRecord({ status: PaymentStatus.PROCESSING });
      mockUpdate.mockResolvedValue(updated);

      await service.updateTransactionStatus(TRANSACTION_ID, PaymentStatus.PROCESSING);

      const callArg = mockUpdate.mock.calls[0][0];
      expect(Object.keys(callArg.data)).toEqual(['status']);
    });
  });

  // ─── getTransactionsByPayment ──────────────────────────────────────────────

  describe('getTransactionsByPayment (Requirements 5.5, 5.7)', () => {
    it('returns all transactions for a payment request', async () => {
      const records = [
        makeTransactionRecord({ id: 'tx-1', sourceTx: SOURCE_TX_HASH }),
        makeTransactionRecord({ id: 'tx-2', destinationTx: DEST_TX_HASH }),
      ];
      mockFindMany.mockResolvedValue(records);

      const result = await service.getTransactionsByPayment(PAYMENT_REQUEST_ID);

      expect(result).toHaveLength(2);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { paymentRequestId: PAYMENT_REQUEST_ID },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('returns an empty array when no transactions exist for the payment', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await service.getTransactionsByPayment(PAYMENT_REQUEST_ID);

      expect(result).toEqual([]);
    });

    it('orders results by createdAt ascending', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.getTransactionsByPayment(PAYMENT_REQUEST_ID);

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      );
    });

    it('queries by the correct paymentRequestId', async () => {
      mockFindMany.mockResolvedValue([]);

      await service.getTransactionsByPayment('some-other-payment-id');

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { paymentRequestId: 'some-other-payment-id' },
        })
      );
    });

    it('returns transaction records with sourceTx and destinationTx fields (Requirement 5.7)', async () => {
      const records = [
        makeTransactionRecord({ sourceTx: SOURCE_TX_HASH, destinationTx: DEST_TX_HASH }),
      ];
      mockFindMany.mockResolvedValue(records);

      const result = await service.getTransactionsByPayment(PAYMENT_REQUEST_ID);

      expect(result[0].sourceTx).toBe(SOURCE_TX_HASH);
      expect(result[0].destinationTx).toBe(DEST_TX_HASH);
    });
  });

  // ─── getTransactionById ────────────────────────────────────────────────────

  describe('getTransactionById', () => {
    it('returns the transaction record when found', async () => {
      const record = makeTransactionRecord({ sourceTx: SOURCE_TX_HASH });
      mockFindUnique.mockResolvedValue(record);

      const result = await service.getTransactionById(TRANSACTION_ID);

      expect(result).toEqual(record);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID },
      });
    });

    it('returns null when the transaction does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await service.getTransactionById('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});
