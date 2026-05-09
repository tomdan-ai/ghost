/**
 * Unit tests for PaymentService - payment request validation
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 */

// Mock dependencies before importing the service
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('../../../config/database', () => ({
  prisma: {
    paymentRequest: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import { PaymentService, SUPPORTED_CHAINS } from '../payment.service';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const VALID_SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112';
const VALID_SOLANA_ADDRESS_2 = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const VALID_ETH_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const VALID_ETH_ADDRESS_2 = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    service = new PaymentService();
    jest.clearAllMocks();
  });

  // ─── validateSolanaAddress ────────────────────────────────────────────────

  describe('validateSolanaAddress', () => {
    it('accepts a valid Solana address (32 chars)', () => {
      // 32 base58 chars is a valid Solana address
      expect(service.validateSolanaAddress('11111111111111111111111111111111')).toBe(true);
    });

    it('accepts a valid Solana address (44 chars)', () => {
      expect(service.validateSolanaAddress(VALID_SOLANA_ADDRESS)).toBe(true);
    });

    it('accepts a valid Solana address (43 chars)', () => {
      expect(service.validateSolanaAddress(VALID_SOLANA_ADDRESS_2)).toBe(true);
    });

    it('rejects an address shorter than 32 chars', () => {
      expect(service.validateSolanaAddress('short')).toBe(false);
    });

    it('rejects an address longer than 44 chars', () => {
      expect(service.validateSolanaAddress('1'.repeat(45))).toBe(false);
    });

    it('rejects an address with invalid base58 characters (0, O, I, l)', () => {
      expect(service.validateSolanaAddress('0'.repeat(32))).toBe(false);
      expect(service.validateSolanaAddress('O'.repeat(32))).toBe(false);
      expect(service.validateSolanaAddress('I'.repeat(32))).toBe(false);
      expect(service.validateSolanaAddress('l'.repeat(32))).toBe(false);
    });

    it('rejects an Ethereum address', () => {
      expect(service.validateSolanaAddress(VALID_ETH_ADDRESS)).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(service.validateSolanaAddress('')).toBe(false);
    });
  });

  // ─── validateEthereumAddress ──────────────────────────────────────────────

  describe('validateEthereumAddress', () => {
    it('accepts a valid Ethereum address (lowercase hex)', () => {
      expect(service.validateEthereumAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(true);
    });

    it('accepts a valid Ethereum address (mixed case / checksum)', () => {
      expect(service.validateEthereumAddress(VALID_ETH_ADDRESS)).toBe(true);
    });

    it('accepts a valid Ethereum address (uppercase hex)', () => {
      expect(service.validateEthereumAddress('0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045')).toBe(true);
    });

    it('rejects an address without 0x prefix', () => {
      expect(service.validateEthereumAddress('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(false);
    });

    it('rejects an address that is too short', () => {
      expect(service.validateEthereumAddress('0x1234')).toBe(false);
    });

    it('rejects an address that is too long', () => {
      expect(service.validateEthereumAddress('0x' + 'a'.repeat(41))).toBe(false);
    });

    it('rejects an address with non-hex characters', () => {
      expect(service.validateEthereumAddress('0x' + 'g'.repeat(40))).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(service.validateEthereumAddress('')).toBe(false);
    });

    it('rejects a Solana address', () => {
      expect(service.validateEthereumAddress(VALID_SOLANA_ADDRESS)).toBe(false);
    });
  });

  // ─── validateWalletAddress ────────────────────────────────────────────────

  describe('validateWalletAddress (Requirement 3.2)', () => {
    it('accepts a valid Solana address', () => {
      expect(service.validateWalletAddress(VALID_SOLANA_ADDRESS)).toBe(true);
    });

    it('accepts a valid Ethereum address', () => {
      expect(service.validateWalletAddress(VALID_ETH_ADDRESS)).toBe(true);
    });

    it('rejects an invalid address', () => {
      expect(service.validateWalletAddress('not-a-wallet')).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(service.validateWalletAddress('')).toBe(false);
    });

    it('rejects a random string', () => {
      expect(service.validateWalletAddress('hello world')).toBe(false);
    });
  });

  // ─── validateAmount ───────────────────────────────────────────────────────

  describe('validateAmount (Requirement 3.3)', () => {
    it('accepts a positive integer amount', () => {
      const result = service.validateAmount('100');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts a positive decimal amount', () => {
      const result = service.validateAmount('0.5');
      expect(result.valid).toBe(true);
    });

    it('accepts an amount with exactly 8 decimal places', () => {
      const result = service.validateAmount('1.12345678');
      expect(result.valid).toBe(true);
    });

    it('accepts a small positive amount', () => {
      const result = service.validateAmount('0.00000001');
      expect(result.valid).toBe(true);
    });

    it('accepts a large amount', () => {
      const result = service.validateAmount('999999999.99999999');
      expect(result.valid).toBe(true);
    });

    it('rejects zero amount (Requirement 3.3)', () => {
      const result = service.validateAmount('0');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('greater than zero'))).toBe(true);
    });

    it('rejects a negative amount (Requirement 3.3)', () => {
      const result = service.validateAmount('-1');
      expect(result.valid).toBe(false);
    });

    it('rejects an amount with more than 8 decimal places', () => {
      const result = service.validateAmount('1.123456789');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('8 decimal places'))).toBe(true);
    });

    it('rejects a non-numeric string', () => {
      const result = service.validateAmount('abc');
      expect(result.valid).toBe(false);
    });

    it('rejects an empty string', () => {
      const result = service.validateAmount('');
      expect(result.valid).toBe(false);
    });

    it('rejects an amount with letters mixed in', () => {
      const result = service.validateAmount('1.5abc');
      expect(result.valid).toBe(false);
    });

    it('rejects "0.0" as zero', () => {
      const result = service.validateAmount('0.0');
      expect(result.valid).toBe(false);
    });
  });

  // ─── validateChain ────────────────────────────────────────────────────────

  describe('validateChain (Requirement 3.4)', () => {
    it('accepts all supported chains', () => {
      for (const chain of SUPPORTED_CHAINS) {
        expect(service.validateChain(chain)).toBe(true);
      }
    });

    it('accepts chain identifiers case-insensitively', () => {
      expect(service.validateChain('Solana')).toBe(true);
      expect(service.validateChain('ETHEREUM')).toBe(true);
      expect(service.validateChain('Polygon')).toBe(true);
    });

    it('rejects an unsupported chain', () => {
      expect(service.validateChain('bitcoin')).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(service.validateChain('')).toBe(false);
    });

    it('rejects a random string', () => {
      expect(service.validateChain('notachain')).toBe(false);
    });
  });

  // ─── validatePaymentRequest ───────────────────────────────────────────────

  describe('validatePaymentRequest (Requirements 3.1 - 3.9)', () => {
    const validInput = {
      senderWallet: VALID_SOLANA_ADDRESS,
      receiverWallet: VALID_SOLANA_ADDRESS_2,
      amount: '10.5',
      sourceChain: 'ethereum',
      destinationChain: 'solana',
    };

    it('accepts a fully valid payment request', () => {
      const result = service.validatePaymentRequest(validInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts valid Ethereum addresses for sender and receiver', () => {
      const result = service.validatePaymentRequest({
        ...validInput,
        senderWallet: VALID_ETH_ADDRESS,
        receiverWallet: VALID_ETH_ADDRESS_2,
      });
      expect(result.valid).toBe(true);
    });

    it('accepts mixed Solana sender and Ethereum receiver', () => {
      const result = service.validatePaymentRequest({
        ...validInput,
        senderWallet: VALID_SOLANA_ADDRESS,
        receiverWallet: VALID_ETH_ADDRESS,
      });
      expect(result.valid).toBe(true);
    });

    // Missing required fields
    it('rejects when senderWallet is missing', () => {
      const result = service.validatePaymentRequest({ ...validInput, senderWallet: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('senderWallet'))).toBe(true);
    });

    it('rejects when receiverWallet is missing', () => {
      const result = service.validatePaymentRequest({ ...validInput, receiverWallet: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('receiverWallet'))).toBe(true);
    });

    it('rejects when amount is missing', () => {
      const result = service.validatePaymentRequest({ ...validInput, amount: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('amount'))).toBe(true);
    });

    it('rejects when sourceChain is missing', () => {
      const result = service.validatePaymentRequest({ ...validInput, sourceChain: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sourceChain'))).toBe(true);
    });

    it('rejects when destinationChain is missing', () => {
      const result = service.validatePaymentRequest({ ...validInput, destinationChain: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('destinationChain'))).toBe(true);
    });

    // Invalid wallet addresses (Requirement 3.2)
    it('rejects an invalid receiver wallet address (Requirement 3.2)', () => {
      const result = service.validatePaymentRequest({
        ...validInput,
        receiverWallet: 'invalid-wallet',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('receiverWallet'))).toBe(true);
    });

    it('rejects an invalid sender wallet address', () => {
      const result = service.validatePaymentRequest({
        ...validInput,
        senderWallet: 'invalid-wallet',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('senderWallet'))).toBe(true);
    });

    // Same sender and receiver (Requirement 3.8)
    it('rejects when sender and receiver are the same address (Requirement 3.8)', () => {
      const result = service.validatePaymentRequest({
        ...validInput,
        senderWallet: VALID_SOLANA_ADDRESS,
        receiverWallet: VALID_SOLANA_ADDRESS,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be the same'))).toBe(true);
    });

    it('rejects same Ethereum address for sender and receiver (Requirement 3.8)', () => {
      const result = service.validatePaymentRequest({
        ...validInput,
        senderWallet: VALID_ETH_ADDRESS,
        receiverWallet: VALID_ETH_ADDRESS,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be the same'))).toBe(true);
    });

    it('rejects same address regardless of case (Requirement 3.8)', () => {
      const result = service.validatePaymentRequest({
        ...validInput,
        senderWallet: VALID_ETH_ADDRESS.toLowerCase(),
        receiverWallet: VALID_ETH_ADDRESS.toUpperCase().replace('0X', '0x'),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be the same'))).toBe(true);
    });

    // Invalid amount (Requirement 3.3)
    it('rejects zero amount (Requirement 3.3)', () => {
      const result = service.validatePaymentRequest({ ...validInput, amount: '0' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('greater than zero'))).toBe(true);
    });

    it('rejects negative amount (Requirement 3.3)', () => {
      const result = service.validatePaymentRequest({ ...validInput, amount: '-5' });
      expect(result.valid).toBe(false);
    });

    it('rejects amount with more than 8 decimal places', () => {
      const result = service.validatePaymentRequest({ ...validInput, amount: '1.123456789' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('8 decimal places'))).toBe(true);
    });

    // Invalid chain (Requirement 3.4)
    it('rejects an unsupported source chain (Requirement 3.4)', () => {
      const result = service.validatePaymentRequest({ ...validInput, sourceChain: 'bitcoin' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sourceChain') && e.includes('not supported'))).toBe(true);
    });

    it('includes list of supported chains in error message (Requirement 3.4)', () => {
      const result = service.validatePaymentRequest({ ...validInput, sourceChain: 'bitcoin' });
      expect(result.valid).toBe(false);
      const chainError = result.errors.find(e => e.includes('Supported chains'));
      expect(chainError).toBeDefined();
      // Should list at least some supported chains
      expect(chainError).toContain('solana');
      expect(chainError).toContain('ethereum');
    });

    it('rejects an unsupported destination chain', () => {
      const result = service.validatePaymentRequest({ ...validInput, destinationChain: 'bitcoin' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('destinationChain') && e.includes('not supported'))).toBe(true);
    });

    // Multiple errors accumulated
    it('accumulates multiple validation errors', () => {
      const result = service.validatePaymentRequest({
        senderWallet: VALID_SOLANA_ADDRESS,
        receiverWallet: 'bad-wallet',
        amount: '0',
        sourceChain: 'bitcoin',
        destinationChain: 'solana',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  // ─── createPaymentRequest ─────────────────────────────────────────────────

  describe('createPaymentRequest (Requirements 3.5, 3.6, 3.9)', () => {
    const validInput = {
      senderWallet: VALID_SOLANA_ADDRESS,
      receiverWallet: VALID_SOLANA_ADDRESS_2,
      amount: '10.5',
      sourceChain: 'ethereum',
      destinationChain: 'solana',
    };

    it('creates a payment request with PENDING status for valid input (Requirement 3.5)', async () => {
      const mockPayment = {
        id: 'payment-uuid-1',
        senderWallet: validInput.senderWallet,
        receiverWallet: validInput.receiverWallet,
        amount: validInput.amount,
        sourceChain: validInput.sourceChain,
        destinationChain: validInput.destinationChain,
        status: 'PENDING',
        txHash: null,
        createdAt: new Date(),
      };
      mockCreate.mockResolvedValue(mockPayment);

      const result = await service.createPaymentRequest(validInput);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            senderWallet: validInput.senderWallet,
            receiverWallet: validInput.receiverWallet,
            amount: validInput.amount,
            status: 'PENDING',
          }),
        })
      );
      expect(result).toEqual(mockPayment);
    });

    it('returns the created payment with all required fields (Requirement 3.6)', async () => {
      const mockPayment = {
        id: 'payment-uuid-1',
        senderWallet: validInput.senderWallet,
        receiverWallet: validInput.receiverWallet,
        amount: validInput.amount,
        sourceChain: 'ethereum',
        destinationChain: 'solana',
        status: 'PENDING',
        txHash: null,
        createdAt: new Date(),
      };
      mockCreate.mockResolvedValue(mockPayment);

      const result = await service.createPaymentRequest(validInput);

      expect(result.id).toBeDefined();
      expect(result.senderWallet).toBe(validInput.senderWallet);
      expect(result.receiverWallet).toBe(validInput.receiverWallet);
      expect(result.amount).toBe(validInput.amount);
      expect(result.status).toBe('PENDING');
    });

    it('normalizes chain identifiers to lowercase', async () => {
      const mockPayment = {
        id: 'payment-uuid-1',
        senderWallet: validInput.senderWallet,
        receiverWallet: validInput.receiverWallet,
        amount: validInput.amount,
        sourceChain: 'ethereum',
        destinationChain: 'solana',
        status: 'PENDING',
        txHash: null,
        createdAt: new Date(),
      };
      mockCreate.mockResolvedValue(mockPayment);

      await service.createPaymentRequest({
        ...validInput,
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

    it('throws a VALIDATION_ERROR for invalid input (Requirement 3.2)', async () => {
      await expect(
        service.createPaymentRequest({
          ...validInput,
          receiverWallet: 'invalid-wallet',
        })
      ).rejects.toMatchObject({
        message: 'Payment request validation failed',
        code: 'VALIDATION_ERROR',
      });

      // Should not call the database
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('throws a VALIDATION_ERROR for zero amount (Requirement 3.3)', async () => {
      await expect(
        service.createPaymentRequest({ ...validInput, amount: '0' })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('throws a VALIDATION_ERROR for unsupported chain (Requirement 3.4)', async () => {
      const error = await service
        .createPaymentRequest({ ...validInput, sourceChain: 'bitcoin' })
        .catch(e => e);

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.validationErrors.some((e: string) => e.includes('not supported'))).toBe(true);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('throws a VALIDATION_ERROR when sender equals receiver (Requirement 3.8)', async () => {
      await expect(
        service.createPaymentRequest({
          ...validInput,
          senderWallet: VALID_SOLANA_ADDRESS,
          receiverWallet: VALID_SOLANA_ADDRESS,
        })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('uses senderWallet as provided (from JWT token, Requirement 3.9)', async () => {
      const mockPayment = {
        id: 'payment-uuid-1',
        senderWallet: VALID_SOLANA_ADDRESS,
        receiverWallet: VALID_SOLANA_ADDRESS_2,
        amount: '10',
        sourceChain: 'ethereum',
        destinationChain: 'solana',
        status: 'PENDING',
        txHash: null,
        createdAt: new Date(),
      };
      mockCreate.mockResolvedValue(mockPayment);

      await service.createPaymentRequest(validInput);

      // The senderWallet passed in (from JWT) is used directly
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            senderWallet: VALID_SOLANA_ADDRESS,
          }),
        })
      );
    });
  });

  // ─── SUPPORTED_CHAINS export ──────────────────────────────────────────────

  describe('SUPPORTED_CHAINS', () => {
    it('includes solana', () => {
      expect(SUPPORTED_CHAINS).toContain('solana');
    });

    it('includes ethereum', () => {
      expect(SUPPORTED_CHAINS).toContain('ethereum');
    });

    it('includes polygon', () => {
      expect(SUPPORTED_CHAINS).toContain('polygon');
    });

    it('has at least 5 supported chains', () => {
      expect(SUPPORTED_CHAINS.length).toBeGreaterThanOrEqual(5);
    });
  });
});
