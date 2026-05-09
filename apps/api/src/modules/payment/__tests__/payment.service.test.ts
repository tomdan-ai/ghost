/**
 * Unit tests for PaymentService — payment request creation and storage
 * Requirements: 3.5, 3.6, 3.9, 5.1, 5.5
 */

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../../../config/database', () => ({
  prisma: {
    paymentRequest: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

import { PaymentService } from '../payment.service';
import { PaymentStatus } from '@ghost/shared-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_SOLANA_SENDER = 'So11111111111111111111111111111111111111112';
const VALID_SOLANA_RECEIVER = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const VALID_ETH_SENDER = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const VALID_ETH_RECEIVER = '0x742d35Cc6634C0532925a3b8D4C9C0F5b6e7F8a9';

function makePaymentRecord(overrides: Partial<any> = {}) {
  return {
    id: 'payment-uuid-1234',
    senderWallet: VALID_SOLANA_SENDER,
    receiverWallet: VALID_SOLANA_RECEIVER,
    amount: '10.5',
    sourceChain: 'ethereum',
    destinationChain: 'solana',
    status: PaymentStatus.PENDING,
    txHash: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    transactions: [],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    service = new PaymentService();
    jest.clearAllMocks();
  });

  // ─── createPaymentRequest ──────────────────────────────────────────────────

  describe('createPaymentRequest', () => {
    describe('successful creation (Requirements 3.5, 3.6, 5.1)', () => {
      it('creates a payment request with PENDING status', async () => {
        const record = makePaymentRecord();
        mockCreate.mockResolvedValue(record);

        const result = await service.createPaymentRequest({
          senderWallet: VALID_SOLANA_SENDER,
          receiverWallet: VALID_SOLANA_RECEIVER,
          amount: '10.5',
          sourceChain: 'ethereum',
          destinationChain: 'solana',
        });

        expect(result.status).toBe(PaymentStatus.PENDING);
      });

      it('passes PENDING status to the database, never another status', async () => {
        const record = makePaymentRecord();
        mockCreate.mockResolvedValue(record);

        await service.createPaymentRequest({
          senderWallet: VALID_SOLANA_SENDER,
          receiverWallet: VALID_SOLANA_RECEIVER,
          amount: '10.5',
          sourceChain: 'ethereum',
          destinationChain: 'solana',
        });

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: PaymentStatus.PENDING,
            }),
          })
        );
      });

      it('stores the senderWallet exactly as provided (from JWT token, Requirement 3.9)', async () => {
        const record = makePaymentRecord({ senderWallet: VALID_SOLANA_SENDER });
        mockCreate.mockResolvedValue(record);

        await service.createPaymentRequest({
          senderWallet: VALID_SOLANA_SENDER,
          receiverWallet: VALID_SOLANA_RECEIVER,
          amount: '10.5',
          sourceChain: 'ethereum',
          destinationChain: 'solana',
        });

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              senderWallet: VALID_SOLANA_SENDER,
            }),
          })
        );
      });

      it('stores all required fields in the database record (Requirement 3.6)', async () => {
        const record = makePaymentRecord();
        mockCreate.mockResolvedValue(record);

        await service.createPaymentRequest({
          senderWallet: VALID_SOLANA_SENDER,
          receiverWallet: VALID_SOLANA_RECEIVER,
          amount: '10.5',
          sourceChain: 'ethereum',
          destinationChain: 'solana',
        });

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              senderWallet: VALID_SOLANA_SENDER,
              receiverWallet: VALID_SOLANA_RECEIVER,
              amount: '10.5',
              sourceChain: 'ethereum',
              destinationChain: 'solana',
              status: PaymentStatus.PENDING,
            }),
          })
        );
      });

      it('returns the created payment record including id and createdAt', async () => {
        const record = makePaymentRecord();
        mockCreate.mockResolvedValue(record);

        const result = await service.createPaymentRequest({
          senderWallet: VALID_SOLANA_SENDER,
          receiverWallet: VALID_SOLANA_RECEIVER,
          amount: '10.5',
          sourceChain: 'ethereum',
          destinationChain: 'solana',
        });

        expect(result.id).toBe('payment-uuid-1234');
        expect(result.createdAt).toBeInstanceOf(Date);
      });

      it('normalizes chain identifiers to lowercase', async () => {
        const record = makePaymentRecord({ sourceChain: 'ethereum', destinationChain: 'solana' });
        mockCreate.mockResolvedValue(record);

        await service.createPaymentRequest({
          senderWallet: VALID_SOLANA_SENDER,
          receiverWallet: VALID_SOLANA_RECEIVER,
          amount: '10.5',
          sourceChain: 'ETHEREUM',
          destinationChain: 'SOLANA',
        });

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              sourceChain: 'ethereum',
              destinationChain: 'solana',
            }),
          })
        );
      });

      it('accepts Ethereum sender and receiver addresses', async () => {
        const record = makePaymentRecord({
          senderWallet: VALID_ETH_SENDER,
          receiverWallet: VALID_ETH_RECEIVER,
        });
        mockCreate.mockResolvedValue(record);

        const result = await service.createPaymentRequest({
          senderWallet: VALID_ETH_SENDER,
          receiverWallet: VALID_ETH_RECEIVER,
          amount: '5.0',
          sourceChain: 'ethereum',
          destinationChain: 'solana',
        });

        expect(result.senderWallet).toBe(VALID_ETH_SENDER);
      });
    });

    describe('validation failures', () => {
      it('throws a VALIDATION_ERROR when receiverWallet is invalid', async () => {
        await expect(
          service.createPaymentRequest({
            senderWallet: VALID_SOLANA_SENDER,
            receiverWallet: 'not-a-valid-wallet',
            amount: '10.5',
            sourceChain: 'ethereum',
            destinationChain: 'solana',
          })
        ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

        expect(mockCreate).not.toHaveBeenCalled();
      });

      it('throws a VALIDATION_ERROR when amount is zero', async () => {
        await expect(
          service.createPaymentRequest({
            senderWallet: VALID_SOLANA_SENDER,
            receiverWallet: VALID_SOLANA_RECEIVER,
            amount: '0',
            sourceChain: 'ethereum',
            destinationChain: 'solana',
          })
        ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

        expect(mockCreate).not.toHaveBeenCalled();
      });

      it('throws a VALIDATION_ERROR when amount is negative', async () => {
        await expect(
          service.createPaymentRequest({
            senderWallet: VALID_SOLANA_SENDER,
            receiverWallet: VALID_SOLANA_RECEIVER,
            amount: '-5',
            sourceChain: 'ethereum',
            destinationChain: 'solana',
          })
        ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
      });

      it('throws a VALIDATION_ERROR when sourceChain is unsupported', async () => {
        await expect(
          service.createPaymentRequest({
            senderWallet: VALID_SOLANA_SENDER,
            receiverWallet: VALID_SOLANA_RECEIVER,
            amount: '10.5',
            sourceChain: 'unsupportedchain',
            destinationChain: 'solana',
          })
        ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
      });

      it('throws a VALIDATION_ERROR when sender and receiver are the same address', async () => {
        await expect(
          service.createPaymentRequest({
            senderWallet: VALID_SOLANA_SENDER,
            receiverWallet: VALID_SOLANA_SENDER,
            amount: '10.5',
            sourceChain: 'ethereum',
            destinationChain: 'solana',
          })
        ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
      });

      it('includes validation error details in the thrown error', async () => {
        let thrownError: any;
        try {
          await service.createPaymentRequest({
            senderWallet: VALID_SOLANA_SENDER,
            receiverWallet: 'bad-wallet',
            amount: '10.5',
            sourceChain: 'ethereum',
            destinationChain: 'solana',
          });
        } catch (err) {
          thrownError = err;
        }

        expect(thrownError).toBeDefined();
        expect(thrownError.validationErrors).toBeInstanceOf(Array);
        expect(thrownError.validationErrors.length).toBeGreaterThan(0);
      });
    });
  });

  // ─── getPaymentById ────────────────────────────────────────────────────────

  describe('getPaymentById', () => {
    it('returns the payment record when found', async () => {
      const record = makePaymentRecord();
      mockFindUnique.mockResolvedValue(record);

      const result = await service.getPaymentById('payment-uuid-1234');

      expect(result).toEqual(record);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'payment-uuid-1234' },
        include: { transactions: true },
      });
    });

    it('returns null when payment does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await service.getPaymentById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('includes transactions in the result', async () => {
      const record = makePaymentRecord({
        transactions: [
          { id: 'tx-1', paymentRequestId: 'payment-uuid-1234', status: 'PENDING' },
        ],
      });
      mockFindUnique.mockResolvedValue(record);

      const result = await service.getPaymentById('payment-uuid-1234');

      expect(result?.transactions).toHaveLength(1);
    });
  });

  // ─── getPaymentByIdAuthorized ──────────────────────────────────────────────

  describe('getPaymentByIdAuthorized (Requirement 5.5)', () => {
    it('returns null when payment does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await service.getPaymentByIdAuthorized('nonexistent-id', VALID_SOLANA_SENDER);

      expect(result).toBeNull();
    });

    it('returns authorized=true when requester is the sender', async () => {
      const record = makePaymentRecord({ senderWallet: VALID_SOLANA_SENDER });
      mockFindUnique.mockResolvedValue(record);

      const result = await service.getPaymentByIdAuthorized('payment-uuid-1234', VALID_SOLANA_SENDER);

      expect(result).not.toBeNull();
      expect(result!.authorized).toBe(true);
      expect(result!.payment).toEqual(record);
    });

    it('returns authorized=true when requester is the receiver', async () => {
      const record = makePaymentRecord({ receiverWallet: VALID_SOLANA_RECEIVER });
      mockFindUnique.mockResolvedValue(record);

      const result = await service.getPaymentByIdAuthorized('payment-uuid-1234', VALID_SOLANA_RECEIVER);

      expect(result).not.toBeNull();
      expect(result!.authorized).toBe(true);
    });

    it('returns authorized=false when requester is neither sender nor receiver', async () => {
      const record = makePaymentRecord({
        senderWallet: VALID_SOLANA_SENDER,
        receiverWallet: VALID_SOLANA_RECEIVER,
      });
      mockFindUnique.mockResolvedValue(record);

      const thirdPartyWallet = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DB';
      const result = await service.getPaymentByIdAuthorized('payment-uuid-1234', thirdPartyWallet);

      expect(result).not.toBeNull();
      expect(result!.authorized).toBe(false);
    });

    it('includes transactions in the returned payment', async () => {
      const record = makePaymentRecord({
        senderWallet: VALID_SOLANA_SENDER,
        transactions: [{ id: 'tx-1', status: 'PENDING' }],
      });
      mockFindUnique.mockResolvedValue(record);

      const result = await service.getPaymentByIdAuthorized('payment-uuid-1234', VALID_SOLANA_SENDER);

      expect(result!.payment.transactions).toHaveLength(1);
    });

    it('queries the database with the correct id and includes transactions', async () => {
      mockFindUnique.mockResolvedValue(null);

      await service.getPaymentByIdAuthorized('some-id', VALID_SOLANA_SENDER);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'some-id' },
        include: { transactions: true },
      });
    });
  });

  // ─── getPaymentHistory ─────────────────────────────────────────────────────

  describe('getPaymentHistory', () => {
    it('returns payments where the wallet is sender or receiver', async () => {
      const records = [makePaymentRecord(), makePaymentRecord({ id: 'payment-2' })];
      mockFindMany.mockResolvedValue(records);

      const result = await service.getPaymentHistory(VALID_SOLANA_SENDER);

      expect(result).toHaveLength(2);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { senderWallet: VALID_SOLANA_SENDER },
              { receiverWallet: VALID_SOLANA_SENDER },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('returns an empty array when no payments exist for the wallet', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await service.getPaymentHistory(VALID_SOLANA_SENDER);

      expect(result).toEqual([]);
    });
  });
});
