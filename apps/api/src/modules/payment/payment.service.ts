import { PublicKey } from '@solana/web3.js';
import { prisma } from '../../config/database';
import { PaymentStatus } from '@ghost/shared-types';
import axios from 'axios';
import { SolanaPaymentService } from './solana.service';
import { PaymentStateService, StateTransitionOptions } from './payment-state.service';

const solanaPaymentService = new SolanaPaymentService();
const paymentStateService = new PaymentStateService();

const LIFI_API = 'https://li.quest/v1';

// Supported chain identifiers
export const SUPPORTED_CHAINS = [
  'solana',
  'ethereum',
  'polygon',
  'arbitrum',
  'optimism',
  'base',
  'avalanche',
  'bsc',
  'fantom',
  'gnosis',
] as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Payment request input type (senderWallet comes from JWT, not user input)
export interface CreatePaymentRequestInput {
  senderWallet: string;
  receiverWallet: string;
  receiverUsername?: string; // optional — resolved from username registry
  amount: string;
  sourceChain: string;
  destinationChain: string;
}

export class PaymentService {
  /**
   * Validate a Solana wallet address (base58, 32-44 chars).
   * Solana public keys are 32 bytes, base58-encoded to 32-44 characters.
   */
  validateSolanaAddress(address: string): boolean {
    // Base58 alphabet (no 0, O, I, l)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  /**
   * Validate an Ethereum wallet address (0x + 40 hex chars).
   */
  validateEthereumAddress(address: string): boolean {
    const ethRegex = /^0x[0-9a-fA-F]{40}$/;
    return ethRegex.test(address);
  }

  /**
   * Validate a wallet address — accepts either Solana or Ethereum format.
   */
  validateWalletAddress(address: string): boolean {
    return this.validateSolanaAddress(address) || this.validateEthereumAddress(address);
  }

  /**
   * Validate a payment amount string.
   * Must be a positive number with at most 8 decimal places.
   */
  validateAmount(amount: string): ValidationResult {
    const errors: string[] = [];

    if (!amount || amount.trim() === '') {
      errors.push('Amount is required');
      return { valid: false, errors };
    }

    // Must be a valid decimal number
    const amountRegex = /^\d+(\.\d+)?$/;
    if (!amountRegex.test(amount.trim())) {
      errors.push('Amount must be a valid positive number');
      return { valid: false, errors };
    }

    const numericValue = parseFloat(amount);

    if (isNaN(numericValue)) {
      errors.push('Amount must be a valid number');
      return { valid: false, errors };
    }

    if (numericValue <= 0) {
      errors.push('Amount must be greater than zero');
      return { valid: false, errors };
    }

    // Check decimal places (max 8)
    const decimalPart = amount.includes('.') ? amount.split('.')[1] : '';
    if (decimalPart && decimalPart.length > 8) {
      errors.push('Amount cannot have more than 8 decimal places');
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Validate a chain identifier against the supported chains list.
   */
  validateChain(chain: string): boolean {
    return SUPPORTED_CHAINS.includes(chain.toLowerCase() as SupportedChain);
  }

  /**
   * Validate all payment request parameters.
   * Returns a ValidationResult with all accumulated errors.
   */
  validatePaymentRequest(input: CreatePaymentRequestInput): ValidationResult {
    const errors: string[] = [];

    // Validate required fields presence
    if (!input.senderWallet) {
      errors.push('senderWallet is required');
    }
    if (!input.receiverWallet) {
      errors.push('receiverWallet is required');
    }
    if (!input.amount) {
      errors.push('amount is required');
    }
    if (!input.sourceChain) {
      errors.push('sourceChain is required');
    }
    if (!input.destinationChain) {
      errors.push('destinationChain is required');
    }

    // If any required fields are missing, return early
    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Validate sender wallet address format
    if (!this.validateWalletAddress(input.senderWallet)) {
      errors.push('senderWallet has an invalid format (must be a valid Solana or Ethereum address)');
    }

    // Validate receiver wallet address format
    if (!this.validateWalletAddress(input.receiverWallet)) {
      errors.push('receiverWallet has an invalid format (must be a valid Solana or Ethereum address)');
    }

    // Validate sender and receiver are not the same (Req 3.8)
    if (
      input.senderWallet &&
      input.receiverWallet &&
      input.senderWallet.toLowerCase() === input.receiverWallet.toLowerCase()
    ) {
      errors.push('senderWallet and receiverWallet cannot be the same address');
    }

    // Validate amount (Req 3.3)
    const amountValidation = this.validateAmount(input.amount);
    if (!amountValidation.valid) {
      errors.push(...amountValidation.errors);
    }

    // Validate source chain (Req 3.4)
    if (input.sourceChain && !this.validateChain(input.sourceChain)) {
      errors.push(
        `sourceChain "${input.sourceChain}" is not supported. Supported chains: ${SUPPORTED_CHAINS.join(', ')}`
      );
    }

    // Validate destination chain
    if (input.destinationChain && !this.validateChain(input.destinationChain)) {
      errors.push(
        `destinationChain "${input.destinationChain}" is not supported. Supported chains: ${SUPPORTED_CHAINS.join(', ')}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a payment request after validating all parameters.
   * senderWallet must come from the authenticated JWT token (Req 3.9).
   * The record is always initialized with PENDING status (Req 3.5, 5.1).
   */
  async createPaymentRequest(data: CreatePaymentRequestInput) {
    // Validate all parameters before creating the record
    const validation = this.validatePaymentRequest(data);
    if (!validation.valid) {
      const error = new Error('Payment request validation failed');
      (error as any).validationErrors = validation.errors;
      (error as any).code = 'VALIDATION_ERROR';
      throw error;
    }

    return prisma.paymentRequest.create({
      data: {
        senderWallet: data.senderWallet,
        receiverWallet: data.receiverWallet,
        amount: data.amount,
        sourceChain: data.sourceChain.toLowerCase(),
        destinationChain: data.destinationChain.toLowerCase(),
        // Always initialize with PENDING status (Requirement 3.5, 5.1)
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
    try {
      return await prisma.paymentRequest.findMany({
        where: {
          OR: [
            { senderWallet: walletAddress },
            { receiverWallet: walletAddress },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Payment history DB lookup failed:', error);
      return [];
    }
  }

  /**
   * Retrieve a payment request by ID (no authorization check).
   * Use getPaymentByIdAuthorized for user-facing endpoints.
   */
  async getPaymentById(id: string) {
    return prisma.paymentRequest.findUnique({
      where: { id },
      include: { transactions: true },
    });
  }

  /**
   * Retrieve a payment request by ID with authorization check.
   * Only the sender or receiver of the payment may access it (Requirement 5.5).
   *
   * Returns:
   *   - null if the payment does not exist
   *   - { payment, authorized: false } if the requester is not the sender/receiver
   *   - { payment, authorized: true } if access is permitted
   */
  async getPaymentByIdAuthorized(
    id: string,
    requesterWallet: string
  ): Promise<{
    payment: NonNullable<Awaited<ReturnType<typeof prisma.paymentRequest.findUnique>>> & {
      transactions: any[];
    };
    authorized: boolean;
  } | null> {
    const payment = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { transactions: true },
    });

    if (!payment) {
      return null;
    }

    const authorized =
      payment.senderWallet === requesterWallet ||
      payment.receiverWallet === requesterWallet;

    return { payment, authorized };
  }

  /**
   * Get payment with enriched blockchain data.
   */
  async getPaymentWithBlockchainData(id: string, username?: string) {
    const payment = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { transactions: true },
    });

    if (!payment || !username) {
      return payment;
    }

    try {
      const chainData = await solanaPaymentService.getPaymentReference(username, id);
      return { ...payment, blockchain: chainData };
    } catch {
      return payment;
    }
  }

  /**
   * Cancel a pending payment (DB + blockchain).
   */
  async cancelPayment(id: string, walletAddress: string) {
    const payment = await prisma.paymentRequest.findUnique({ where: { id } });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.senderWallet !== walletAddress) {
      throw new Error('Only the sender can cancel a payment');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error(`Cannot cancel a payment with status ${payment.status}`);
    }

    return prisma.paymentRequest.update({
      where: { id },
      data: { status: PaymentStatus.FAILED },
    });
  }

  /**
   * Get payments associated with a username (DB + blockchain fallback).
   */
  async getPaymentsByUsername(username: string) {
    // Try database first
    const dbPayments = await prisma.paymentRequest.findMany({
      where: {
        OR: [
          { senderWallet: { contains: username } },
          { receiverWallet: { contains: username } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (dbPayments.length > 0) {
      return dbPayments;
    }

    // Fallback to blockchain
    try {
      return await solanaPaymentService.getPaymentsByUsername(username);
    } catch {
      return [];
    }
  }

  /**
   * Sync a payment's status from the blockchain into the database.
   */
  async syncPaymentFromBlockchain(username: string, paymentId: string) {
    const chainData = await solanaPaymentService.getPaymentReference(username, paymentId);

    if (!chainData) {
      throw new Error('Payment not found on blockchain');
    }

    const statusMap: Record<string, PaymentStatus> = {
      Pending: PaymentStatus.PENDING,
      Claimed: PaymentStatus.COMPLETED,
      Cancelled: PaymentStatus.FAILED,
    };

    const newStatus = statusMap[chainData.status] ?? PaymentStatus.PENDING;

    return prisma.paymentRequest.update({
      where: { id: paymentId },
      data: { status: newStatus },
    });
  }
}
