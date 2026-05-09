/**
 * Unit tests for PaymentStateService — payment status state machine
 * Requirements: 5.1, 5.2, 5.3, 5.4, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9
 */

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockFindUnique = jest.fn();
const mockUpdateMany = jest.fn();

jest.mock('../../../config/database', () => ({
  prisma: {
    paymentRequest: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}));

import { PaymentStateService, VALID_TRANSITIONS } from '../payment-state.service';
import { PaymentStatus } from '@ghost/shared-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePaymentRecord(status: PaymentStatus, overrides: Partial<any> = {}) {
  return {
    id: 'payment-uuid-1234',
    senderWallet: 'So11111111111111111111111111111111111111112',
    receiverWallet: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    amount: '10.5',
    sourceChain: 'ethereum',
    destinationChain: 'solana',
    status,
    txHash: null,
    destinationTxHash: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PaymentStateService', () => {
  let service: PaymentStateService;

  beforeEach(() => {
    service = new PaymentStateService();
    jest.clearAllMocks();
    // Use fake timers to avoid real delays in retry logic
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─── isValidTransition ─────────────────────────────────────────────────────

  describe('isValidTransition', () => {
    it('allows PENDING → PROCESSING (Requirement 17.1)', () => {
      expect(service.isValidTransition(PaymentStatus.PENDING, PaymentStatus.PROCESSING)).toBe(true);
    });

    it('allows PENDING → FAILED (cancel before processing)', () => {
      expect(service.isValidTransition(PaymentStatus.PENDING, PaymentStatus.FAILED)).toBe(true);
    });

    it('allows PROCESSING → COMPLETED (Requirement 17.1)', () => {
      expect(service.isValidTransition(PaymentStatus.PROCESSING, PaymentStatus.COMPLETED)).toBe(true);
    });

    it('allows PROCESSING → FAILED (Requirement 17.1)', () => {
      expect(service.isValidTransition(PaymentStatus.PROCESSING, PaymentStatus.FAILED)).toBe(true);
    });

    it('rejects PENDING → COMPLETED (skipping PROCESSING)', () => {
      expect(service.isValidTransition(PaymentStatus.PENDING, PaymentStatus.COMPLETED)).toBe(false);
    });

    it('rejects COMPLETED → any status (terminal state, Requirement 17.2)', () => {
      expect(service.isValidTransition(PaymentStatus.COMPLETED, PaymentStatus.PENDING)).toBe(false);
      expect(service.isValidTransition(PaymentStatus.COMPLETED, PaymentStatus.PROCESSING)).toBe(false);
      expect(service.isValidTransition(PaymentStatus.COMPLETED, PaymentStatus.FAILED)).toBe(false);
    });

    it('rejects FAILED → any status (terminal state, Requirement 17.3)', () => {
      expect(service.isValidTransition(PaymentStatus.FAILED, PaymentStatus.PENDING)).toBe(false);
      expect(service.isValidTransition(PaymentStatus.FAILED, PaymentStatus.PROCESSING)).toBe(false);
      expect(service.isValidTransition(PaymentStatus.FAILED, PaymentStatus.COMPLETED)).toBe(false);
    });

    it('rejects PROCESSING → PENDING (backwards transition)', () => {
      expect(service.isValidTransition(PaymentStatus.PROCESSING, PaymentStatus.PENDING)).toBe(false);
    });
  });

  // ─── getAllowedTransitions ─────────────────────────────────────────────────

  describe('getAllowedTransitions', () => {
    it('returns [PROCESSING, FAILED] for PENDING', () => {
      const allowed = service.getAllowedTransitions(PaymentStatus.PENDING);
      expect(allowed).toHaveLength(2);
      expect(allowed).toContain(PaymentStatus.PROCESSING);
      expect(allowed).toContain(PaymentStatus.FAILED);
    });

    it('returns [COMPLETED, FAILED] for PROCESSING', () => {
      const allowed = service.getAllowedTransitions(PaymentStatus.PROCESSING);
      expect(allowed).toHaveLength(2);
      expect(allowed).toContain(PaymentStatus.COMPLETED);
      expect(allowed).toContain(PaymentStatus.FAILED);
    });

    it('returns empty array for COMPLETED (terminal state)', () => {
      expect(service.getAllowedTransitions(PaymentStatus.COMPLETED)).toHaveLength(0);
    });

    it('returns empty array for FAILED (terminal state)', () => {
      expect(service.getAllowedTransitions(PaymentStatus.FAILED)).toHaveLength(0);
    });
  });

  // ─── isTerminalState ───────────────────────────────────────────────────────

  describe('isTerminalState', () => {
    it('returns false for PENDING', () => {
      expect(service.isTerminalState(PaymentStatus.PENDING)).toBe(false);
    });

    it('returns false for PROCESSING', () => {
      expect(service.isTerminalState(PaymentStatus.PROCESSING)).toBe(false);
    });

    it('returns true for COMPLETED (Requirement 17.2)', () => {
      expect(service.isTerminalState(PaymentStatus.COMPLETED)).toBe(true);
    });

    it('returns true for FAILED (Requirement 17.3)', () => {
      expect(service.isTerminalState(PaymentStatus.FAILED)).toBe(true);
    });
  });

  // ─── VALID_TRANSITIONS constant ────────────────────────────────────────────

  describe('VALID_TRANSITIONS constant', () => {
    it('defines all four statuses', () => {
      expect(VALID_TRANSITIONS).toHaveProperty(PaymentStatus.PENDING);
      expect(VALID_TRANSITIONS).toHaveProperty(PaymentStatus.PROCESSING);
      expect(VALID_TRANSITIONS).toHaveProperty(PaymentStatus.COMPLETED);
      expect(VALID_TRANSITIONS).toHaveProperty(PaymentStatus.FAILED);
    });

    it('COMPLETED has no allowed transitions (terminal)', () => {
      expect(VALID_TRANSITIONS[PaymentStatus.COMPLETED].size).toBe(0);
    });

    it('FAILED has no allowed transitions (terminal)', () => {
      expect(VALID_TRANSITIONS[PaymentStatus.FAILED].size).toBe(0);
    });
  });

  // ─── transition — success cases ────────────────────────────────────────────

  describe('transition — success cases', () => {
    it('transitions PENDING → PROCESSING and returns result (Requirement 5.2)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.transition('payment-uuid-1234', PaymentStatus.PROCESSING);

      expect(result.previousStatus).toBe(PaymentStatus.PENDING);
      expect(result.newStatus).toBe(PaymentStatus.PROCESSING);
      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(result.id).toBe('payment-uuid-1234');
    });

    it('transitions PROCESSING → COMPLETED and returns result (Requirement 5.3)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PROCESSING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.transition('payment-uuid-1234', PaymentStatus.COMPLETED);

      expect(result.previousStatus).toBe(PaymentStatus.PROCESSING);
      expect(result.newStatus).toBe(PaymentStatus.COMPLETED);
    });

    it('transitions PROCESSING → FAILED and returns result (Requirement 5.4)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PROCESSING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.transition('payment-uuid-1234', PaymentStatus.FAILED);

      expect(result.previousStatus).toBe(PaymentStatus.PROCESSING);
      expect(result.newStatus).toBe(PaymentStatus.FAILED);
    });

    it('transitions PENDING → FAILED (cancel) and returns result', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.transition('payment-uuid-1234', PaymentStatus.FAILED);

      expect(result.previousStatus).toBe(PaymentStatus.PENDING);
      expect(result.newStatus).toBe(PaymentStatus.FAILED);
    });

    it('stores txHash when provided (Requirement 5.7)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.transition('payment-uuid-1234', PaymentStatus.PROCESSING, {
        txHash: 'source-tx-hash-abc123',
      });

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ txHash: 'source-tx-hash-abc123' }),
        })
      );
      expect(result.txHash).toBe('source-tx-hash-abc123');
    });

    it('stores destinationTxHash and completedAt when transitioning to COMPLETED (Requirement 17.7)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PROCESSING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await service.transition('payment-uuid-1234', PaymentStatus.COMPLETED, {
        destinationTxHash: 'dest-tx-hash-xyz789',
      });

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            destinationTxHash: 'dest-tx-hash-xyz789',
            completedAt: expect.any(Date),
          }),
        })
      );
    });

    it('returns destinationTxHash in result when transitioning to COMPLETED', async () => {
      const payment = makePaymentRecord(PaymentStatus.PROCESSING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const result = await service.transition('payment-uuid-1234', PaymentStatus.COMPLETED, {
        destinationTxHash: 'dest-tx-hash-xyz789',
      });

      expect(result.destinationTxHash).toBe('dest-tx-hash-xyz789');
    });

    it('stores errorDetails and errorCode when transitioning to FAILED (Requirement 17.6)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PROCESSING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await service.transition('payment-uuid-1234', PaymentStatus.FAILED, {
        errorDetails: 'Bridge transaction reverted',
        errorCode: 'BRIDGE_REVERT',
      });

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            errorDetails: 'Bridge transaction reverted',
            errorCode: 'BRIDGE_REVERT',
          }),
        })
      );
    });

    it('does NOT store errorDetails/errorCode when transitioning to non-FAILED status', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await service.transition('payment-uuid-1234', PaymentStatus.PROCESSING, {
        errorDetails: 'should not be stored',
        errorCode: 'SHOULD_NOT_STORE',
      });

      const callData = mockUpdateMany.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('errorDetails');
      expect(callData).not.toHaveProperty('errorCode');
    });

    it('does NOT store destinationTxHash when transitioning to non-COMPLETED status', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await service.transition('payment-uuid-1234', PaymentStatus.PROCESSING, {
        destinationTxHash: 'should-not-be-stored',
      });

      const callData = mockUpdateMany.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('destinationTxHash');
    });

    it('uses optimistic concurrency guard in the WHERE clause (Requirement 17.8)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await service.transition('payment-uuid-1234', PaymentStatus.PROCESSING);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'payment-uuid-1234',
            status: PaymentStatus.PENDING, // must include current status as guard
          },
        })
      );
    });

    it('logs the state transition (Requirement 17.5)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 1 });

      await service.transition('payment-uuid-1234', PaymentStatus.PROCESSING, {
        reason: 'Transaction submitted',
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('payment_state_transition')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('payment-uuid-1234')
      );
    });
  });

  // ─── transition — error cases ──────────────────────────────────────────────

  describe('transition — error cases', () => {
    it('throws PAYMENT_NOT_FOUND when payment does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        service.transition('nonexistent-id', PaymentStatus.PROCESSING)
      ).rejects.toMatchObject({ code: 'PAYMENT_NOT_FOUND' });

      expect(mockUpdateMany).not.toHaveBeenCalled();
    });

    it('throws INVALID_STATE_TRANSITION for PENDING → COMPLETED (Requirement 17.4)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);

      await expect(
        service.transition('payment-uuid-1234', PaymentStatus.COMPLETED)
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });

      expect(mockUpdateMany).not.toHaveBeenCalled();
    });

    it('throws INVALID_STATE_TRANSITION for COMPLETED → PENDING (terminal state, Requirement 17.2)', async () => {
      const payment = makePaymentRecord(PaymentStatus.COMPLETED);
      mockFindUnique.mockResolvedValue(payment);

      await expect(
        service.transition('payment-uuid-1234', PaymentStatus.PENDING)
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    });

    it('throws INVALID_STATE_TRANSITION for COMPLETED → FAILED (terminal state, Requirement 17.2)', async () => {
      const payment = makePaymentRecord(PaymentStatus.COMPLETED);
      mockFindUnique.mockResolvedValue(payment);

      await expect(
        service.transition('payment-uuid-1234', PaymentStatus.FAILED)
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    });

    it('throws INVALID_STATE_TRANSITION for FAILED → PROCESSING (terminal state, Requirement 17.3)', async () => {
      const payment = makePaymentRecord(PaymentStatus.FAILED);
      mockFindUnique.mockResolvedValue(payment);

      await expect(
        service.transition('payment-uuid-1234', PaymentStatus.PROCESSING)
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    });

    it('throws INVALID_STATE_TRANSITION for PROCESSING → PENDING (backwards)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PROCESSING);
      mockFindUnique.mockResolvedValue(payment);

      await expect(
        service.transition('payment-uuid-1234', PaymentStatus.PENDING)
      ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
    });

    it('includes currentStatus, requestedStatus, and allowedTransitions in the error', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);

      let thrownError: any;
      try {
        await service.transition('payment-uuid-1234', PaymentStatus.COMPLETED);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError.currentStatus).toBe(PaymentStatus.PENDING);
      expect(thrownError.requestedStatus).toBe(PaymentStatus.COMPLETED);
      expect(thrownError.allowedTransitions).toBeInstanceOf(Array);
    });

    it('includes "none (terminal state)" in error message for terminal state transitions', async () => {
      const payment = makePaymentRecord(PaymentStatus.COMPLETED);
      mockFindUnique.mockResolvedValue(payment);

      let thrownError: any;
      try {
        await service.transition('payment-uuid-1234', PaymentStatus.PENDING);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError.message).toContain('none (terminal state)');
    });
  });

  // ─── transition — concurrent transition handling (Requirement 17.8, 17.9) ──

  describe('transition — concurrent transition handling', () => {
    it('retries when updateMany returns count=0 (Requirement 17.9)', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      // First call: concurrent transition detected (count=0)
      // Second call: success (count=1)
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 1 });

      // Run the transition and advance fake timers to resolve the sleep
      const transitionPromise = service.transition('payment-uuid-1234', PaymentStatus.PROCESSING);
      // Advance all timers to resolve the sleep(100ms) in retry
      jest.runAllTimers();

      const result = await transitionPromise;

      expect(mockUpdateMany).toHaveBeenCalledTimes(2);
      expect(result.newStatus).toBe(PaymentStatus.PROCESSING);
    });

    it('throws CONCURRENT_TRANSITION after exhausting all retries', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      // All attempts return count=0
      mockUpdateMany.mockResolvedValue({ count: 0 });

      const transitionPromise = service.transition('payment-uuid-1234', PaymentStatus.PROCESSING);
      // Advance all timers to resolve all sleep() calls in retries
      jest.runAllTimers();

      await expect(transitionPromise).rejects.toMatchObject({ code: 'CONCURRENT_TRANSITION' });
    });

    it('includes paymentId in CONCURRENT_TRANSITION error', async () => {
      const payment = makePaymentRecord(PaymentStatus.PENDING);
      mockFindUnique.mockResolvedValue(payment);
      mockUpdateMany.mockResolvedValue({ count: 0 });

      const transitionPromise = service.transition('payment-uuid-1234', PaymentStatus.PROCESSING);
      jest.runAllTimers();

      let thrownError: any;
      try {
        await transitionPromise;
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError.paymentId).toBe('payment-uuid-1234');
    });
  });
});
