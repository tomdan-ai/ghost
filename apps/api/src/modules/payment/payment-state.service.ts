/**
 * PaymentStateService — enforces the payment status state machine.
 *
 * Valid transitions (Requirements 5.1–5.4, 17.1–17.9):
 *
 *   PENDING  → PROCESSING  (transaction submitted to source chain)
 *   PENDING  → FAILED      (payment cancelled before processing)
 *   PROCESSING → COMPLETED (bridge/swap settled on destination chain)
 *   PROCESSING → FAILED    (transaction failed at any stage)
 *
 * Terminal states: COMPLETED, FAILED — no further transitions allowed.
 */

import { PaymentStatus } from '@ghost/shared-types';
import { prisma } from '../../config/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StateTransitionOptions {
  /** Source transaction hash (stored when moving to PROCESSING). */
  txHash?: string;
  /** Destination transaction hash (stored when moving to COMPLETED). Requirement 17.7. */
  destinationTxHash?: string;
  /** Human-readable reason for the transition (stored in audit log). */
  reason?: string;
  /** Error details stored when transitioning to FAILED. Requirement 17.6. */
  errorDetails?: string;
  /** Error code stored when transitioning to FAILED. Requirement 17.6. */
  errorCode?: string;
}

export interface StateTransitionResult {
  id: string;
  status: string;
  txHash: string | null;
  destinationTxHash: string | null;
  previousStatus: PaymentStatus;
  newStatus: PaymentStatus;
}

// ─── Valid transition map ─────────────────────────────────────────────────────

/**
 * Maps each status to the set of statuses it may legally transition to.
 * Terminal states (COMPLETED, FAILED) map to an empty set.
 */
export const VALID_TRANSITIONS: Readonly<Record<PaymentStatus, ReadonlySet<PaymentStatus>>> = {
  [PaymentStatus.PENDING]: new Set([PaymentStatus.PROCESSING, PaymentStatus.FAILED]),
  [PaymentStatus.PROCESSING]: new Set([PaymentStatus.COMPLETED, PaymentStatus.FAILED]),
  [PaymentStatus.COMPLETED]: new Set(),
  [PaymentStatus.FAILED]: new Set(),
};

// ─── Retry configuration ──────────────────────────────────────────────────────

export const RETRY_BASE_DELAY_MS = 100;
export const RETRY_MAX_ATTEMPTS = 3;

// ─── Service ──────────────────────────────────────────────────────────────────

export class PaymentStateService {
  /**
   * Delay function — injectable for testing to avoid real timer delays.
   * Defaults to a real setTimeout-based sleep.
   */
  private readonly _sleep: (ms: number) => Promise<void>;

  constructor(sleepFn?: (ms: number) => Promise<void>) {
    this._sleep = sleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /**
   * Check whether a transition from `from` to `to` is valid.
   */
  isValidTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    return VALID_TRANSITIONS[from].has(to);
  }

  /**
   * Return all statuses that `currentStatus` may legally transition to.
   */
  getAllowedTransitions(currentStatus: PaymentStatus): PaymentStatus[] {
    return Array.from(VALID_TRANSITIONS[currentStatus]);
  }

  /**
   * Determine whether `status` is a terminal state (COMPLETED or FAILED).
   */
  isTerminalState(status: PaymentStatus): boolean {
    return VALID_TRANSITIONS[status].size === 0;
  }

  /**
   * Transition a payment to a new status, enforcing the state machine rules.
   *
   * Throws a structured error (code: 'INVALID_STATE_TRANSITION') when the
   * transition is not permitted (Requirements 17.1–17.4).
   *
   * Uses a database-level update with a WHERE clause that includes the
   * expected current status to guard against concurrent transitions
   * (Requirement 17.8).
   *
   * Retries with exponential backoff when a concurrent transition is detected
   * (Requirement 17.9).
   */
  async transition(
    paymentId: string,
    newStatus: PaymentStatus,
    options: StateTransitionOptions = {}
  ): Promise<StateTransitionResult> {
    return this._transitionWithRetry(paymentId, newStatus, options, 0);
  }

  /**
   * Internal implementation with retry counter for exponential backoff.
   * Requirement 17.9: retry with exponential backoff on concurrent transition failure.
   */
  private async _transitionWithRetry(
    paymentId: string,
    newStatus: PaymentStatus,
    options: StateTransitionOptions,
    attempt: number
  ): Promise<StateTransitionResult> {
    // 1. Load the current payment record.
    const payment = await prisma.paymentRequest.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      const err = new Error(`Payment ${paymentId} not found`);
      (err as any).code = 'PAYMENT_NOT_FOUND';
      throw err;
    }

    const currentStatus = payment.status as PaymentStatus;

    // 2. Validate the transition.
    if (!this.isValidTransition(currentStatus, newStatus)) {
      const allowedList = this.getAllowedTransitions(currentStatus);
      const allowedStr = allowedList.length > 0 ? allowedList.join(', ') : 'none (terminal state)';

      const err = new Error(
        `Invalid state transition: ${currentStatus} → ${newStatus}. ` +
          `Allowed transitions from ${currentStatus}: ${allowedStr}`
      );
      (err as any).code = 'INVALID_STATE_TRANSITION';
      (err as any).currentStatus = currentStatus;
      (err as any).requestedStatus = newStatus;
      (err as any).allowedTransitions = allowedList;
      throw err;
    }

    // 3. Build the update payload.
    const updateData: Record<string, unknown> = { status: newStatus };

    if (options.txHash !== undefined) {
      updateData['txHash'] = options.txHash;
    }

    // Store destination tx hash and completion timestamp when transitioning to COMPLETED (Requirement 17.7).
    if (newStatus === PaymentStatus.COMPLETED) {
      if (options.destinationTxHash !== undefined) {
        updateData['destinationTxHash'] = options.destinationTxHash;
      }
      updateData['completedAt'] = new Date();
    }

    // Store error details when transitioning to FAILED (Requirement 17.6).
    if (newStatus === PaymentStatus.FAILED) {
      if (options.errorDetails !== undefined) {
        updateData['errorDetails'] = options.errorDetails;
      }
      if (options.errorCode !== undefined) {
        updateData['errorCode'] = options.errorCode;
      }
    }

    // 4. Perform the update with an optimistic-concurrency guard:
    //    the WHERE clause includes the expected current status so that a
    //    concurrent transition that already changed the status will cause
    //    this update to match 0 rows (Requirement 17.8).
    const updated = await prisma.paymentRequest.updateMany({
      where: {
        id: paymentId,
        status: currentStatus, // guard against concurrent transitions
      },
      data: updateData,
    });

    if (updated.count === 0) {
      // Another process already changed the status — retry with exponential backoff
      // (Requirement 17.9).
      if (attempt < RETRY_MAX_ATTEMPTS - 1) {
        const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await this._sleep(delayMs);
        return this._transitionWithRetry(paymentId, newStatus, options, attempt + 1);
      }

      // Max retries exhausted — re-read and report the conflict.
      const current = await prisma.paymentRequest.findUnique({ where: { id: paymentId } });
      const actualStatus = current?.status ?? 'unknown';

      const err = new Error(
        `Concurrent state transition detected for payment ${paymentId}. ` +
          `Expected status ${currentStatus} but found ${actualStatus} after ${RETRY_MAX_ATTEMPTS} attempts.`
      );
      (err as any).code = 'CONCURRENT_TRANSITION';
      (err as any).paymentId = paymentId;
      throw err;
    }

    // 5. Log the transition (Requirement 17.5).
    console.log(
      JSON.stringify({
        event: 'payment_state_transition',
        paymentId,
        previousStatus: currentStatus,
        newStatus,
        reason: options.reason ?? null,
        timestamp: new Date().toISOString(),
      })
    );

    return {
      id: paymentId,
      status: newStatus,
      txHash: (updateData['txHash'] as string | null | undefined) ?? payment.txHash,
      destinationTxHash:
        (updateData['destinationTxHash'] as string | null | undefined) ?? null,
      previousStatus: currentStatus,
      newStatus,
    };
  }
}
