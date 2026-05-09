import { z } from 'zod';
import { AppError } from '../../middleware/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedPaymentRequest {
  receiverWallet: string;
  amount: string;
  sourceChain: string;
  destinationChain: string;
  receiverUsername?: string | undefined;
}

export interface ParsedRouteRequest {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  toAddress: string;
}

// ─── Internal Zod schemas ─────────────────────────────────────────────────────

/**
 * Accepts Solana (base58, 32-44 chars) or Ethereum (0x + 40 hex) addresses.
 */
const walletAddressSchema = z
  .string()
  .refine(
    (val) =>
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val) ||
      /^0x[0-9a-fA-F]{40}$/.test(val),
    { message: 'Invalid wallet address (must be a valid Solana or Ethereum address)' }
  );

/**
 * Schema for a payment request body.
 * Unknown fields are stripped (strict mode via .strip()).
 * Requirements: 16.1, 16.2, 16.5, 16.6, 16.9
 */
const paymentRequestSchema = z
  .object({
    receiverWallet: walletAddressSchema,
    amount: z
      .string()
      .regex(
        /^\d+(\.\d{1,8})?$/,
        'Amount must be a positive number with at most 8 decimal places'
      )
      .refine((val) => parseFloat(val) > 0, { message: 'Amount must be greater than zero' }),
    sourceChain: z.string().min(1, 'sourceChain is required'),
    destinationChain: z.string().min(1, 'destinationChain is required'),
    receiverUsername: z.string().optional(),
  })
  .strip(); // strip unknown fields

/**
 * Schema for a route query request.
 * Requirements: 16.1, 16.2
 */
const routeRequestSchema = z
  .object({
    fromChain: z.string().min(1, 'fromChain is required'),
    toChain: z.string().min(1, 'toChain is required'),
    fromToken: z.string().min(1, 'fromToken is required'),
    toToken: z.string().min(1, 'toToken is required'),
    fromAmount: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'fromAmount must be a positive number')
      .refine((val) => parseFloat(val) > 0, { message: 'fromAmount must be greater than zero' }),
    fromAddress: walletAddressSchema,
    toAddress: walletAddressSchema,
  })
  .strip();

// ─── PaymentParser ────────────────────────────────────────────────────────────

export class PaymentParser {
  /**
   * Validate and parse raw JSON input into a typed ParsedPaymentRequest.
   * - Required fields: receiverWallet, amount, sourceChain, destinationChain
   * - Optional: receiverUsername
   * - Unknown fields are stripped
   * - Throws AppError with code VALIDATION_ERROR on invalid input
   * Requirements: 16.1, 16.2, 16.5, 16.6, 16.9
   */
  parse(data: unknown): ParsedPaymentRequest {
    const result = paymentRequestSchema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
      }));

      throw new AppError('Payment request validation failed', 'VALIDATION_ERROR', 400, {
        errors,
      });
    }

    return result.data;
  }

  /**
   * Validate and parse route query parameters into a typed ParsedRouteRequest.
   * - Required: fromChain, toChain, fromToken, toToken, fromAmount, fromAddress, toAddress
   * - Throws AppError with code VALIDATION_ERROR on invalid input
   * Requirements: 16.1, 16.2
   */
  parseRoute(data: unknown): ParsedRouteRequest {
    const result = routeRequestSchema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'root',
        message: issue.message,
      }));

      throw new AppError('Route request validation failed', 'VALIDATION_ERROR', 400, {
        errors,
      });
    }

    return result.data;
  }
}
