import { z } from 'zod';

// ─── Wallet address validation ────────────────────────────────────────────────

/**
 * Accepts Solana (base58, 32-44 chars) or Ethereum (0x + 40 hex) addresses.
 * Requirements 8.1, 8.2.
 */
const walletAddressSchema = z
  .string()
  .refine(
    (val) =>
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val) || // Solana base58
      /^0x[0-9a-fA-F]{40}$/.test(val),              // Ethereum
    { message: 'Invalid wallet address (must be a valid Solana or Ethereum address)' }
  );

// ─── Payment schemas ──────────────────────────────────────────────────────────

/**
 * Schema for POST /payment/create body.
 * Requirements 3.1–3.4, 8.3.
 */
export const createPaymentSchema = z.object({
  receiverWallet: walletAddressSchema,
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,8})?$/, 'Amount must be a positive number with at most 8 decimal places')
    .refine((val) => parseFloat(val) > 0, { message: 'Amount must be greater than zero' }),
  sourceChain: z.string().min(1, 'sourceChain is required'),
  destinationChain: z.string().min(1, 'destinationChain is required'),
});

// ─── Username schemas ─────────────────────────────────────────────────────────

/**
 * Schema for POST /username/register body.
 * Requirements 2.1–2.4, 8.4.
 */
export const registerUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9]+$/, 'Username must be lowercase alphanumeric only'),
});

// ─── Auth schemas ─────────────────────────────────────────────────────────────

/**
 * Schema for POST /auth/nonce body.
 * Requirement 1.1.
 */
export const nonceRequestSchema = z.object({
  walletAddress: walletAddressSchema,
});

/**
 * Schema for POST /auth/verify body.
 * Requirements 1.3, 10.1.
 */
export const verifySignatureSchema = z
  .object({
    walletAddress: walletAddressSchema,
    signature: z.string().min(1, 'signature is required'),
    nonce: z.string().min(1, 'nonce is required').optional(),
    message: z.string().min(1, 'message is required').optional(),
  })
  .refine((data) => Boolean(data.nonce || data.message), {
    message: 'nonce or message is required',
    path: ['nonce'],
  });

// ─── Pagination / history schemas ─────────────────────────────────────────────

/**
 * Schema for GET /payment/history query params.
 * Requirements 7.1–7.5.
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (Number.isInteger(val) && val > 0), {
      message: 'page must be a positive integer',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (Number.isInteger(val) && val > 0 && val <= 100), {
      message: 'limit must be a positive integer no greater than 100',
    }),
  status: z
    .enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
    .optional(),
  startDate: z
    .string()
    .optional()
    .refine((val) => val === undefined || !isNaN(Date.parse(val)), {
      message: 'startDate must be a valid ISO 8601 date string',
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => val === undefined || !isNaN(Date.parse(val)), {
      message: 'endDate must be a valid ISO 8601 date string',
    }),
});
