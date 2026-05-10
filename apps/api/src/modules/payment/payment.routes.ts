import { Router } from 'express';
import { PaymentService } from './payment.service';
import { PaymentHistoryService } from './payment-history.service';
import { AuditService } from './audit.service';
import { authenticate } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validation';
import { createPaymentSchema, paginationSchema } from '../../middleware/schemas';
import { ZodSchema } from 'zod';

const router: Router = Router();
const paymentService = new PaymentService();
const paymentHistoryService = new PaymentHistoryService();
const auditService = new AuditService();

// Cast paginationSchema to ZodSchema<any> to avoid the input/output type mismatch
// caused by Zod transforms (string → number). The middleware still validates correctly.
const paginationSchemaAny = paginationSchema as unknown as ZodSchema<any>;

/**
 * POST /payment/create
 * Create a new payment request. Requires authentication.
 * senderWallet is always sourced from the JWT token (Requirement 3.9).
 * Requirements: 12.6, 12.11, 12.12
 */
router.post('/create', authenticate, validateBody(createPaymentSchema), async (req, res) => {
  try {
    const { receiverWallet, receiverUsername, amount, sourceChain, destinationChain } = req.body;
    const { walletAddress } = (req as any).user;

    const payment = await paymentService.createPaymentRequest({
      senderWallet: walletAddress,
      receiverWallet,
      receiverUsername,
      amount,
      sourceChain,
      destinationChain,
    });

    return res.status(201).json(payment);
  } catch (error: any) {
    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { errors: error.validationErrors },
      });
    }
    return res.status(500).json({ error: 'Failed to create payment', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /payment/route
 * Get cross-chain route from LI.FI. No authentication required.
 * Requirements: 12.7
 */
router.get('/route', async (req, res) => {
  try {
    const route = await paymentService.getRoute(req.query as any);
    res.json(route);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /payment/history
 * Get paginated payment history for the authenticated user.
 * Requirements: 12.8, 12.11, 12.12
 */
router.get('/history', authenticate, validateQuery(paginationSchemaAny), async (req, res) => {
  try {
    const { walletAddress } = (req as any).user;
    const query = req.query as any;

    const options: {
      page?: number;
      limit?: number;
      status?: any;
      startDate?: Date;
      endDate?: Date;
    } = {};

    if (query.page !== undefined) options.page = query.page;
    if (query.limit !== undefined) options.limit = query.limit;
    if (query.status !== undefined) options.status = query.status;
    if (query.startDate !== undefined) options.startDate = new Date(query.startDate);
    if (query.endDate !== undefined) options.endDate = new Date(query.endDate);

    const history = await paymentHistoryService.getHistory(walletAddress, options);
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Failed to get payment history', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /payment/username/:username
 * Get payments associated with a username (checks blockchain + DB).
 */
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const payments = await paymentService.getPaymentsByUsername(username);
    res.json(payments);
  } catch {
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

/**
 * GET /payment/:id
 * Get a payment request by ID. Requires authentication.
 * Only the sender or receiver of the payment may access it (Requirement 5.5).
 * Requirements: 12.9, 12.11, 12.12
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required', code: 'VALIDATION_ERROR' });
    }
    const { walletAddress } = (req as any).user;

    const result = await paymentService.getPaymentByIdAuthorized(id, walletAddress);

    if (!result) {
      return res.status(404).json({ error: 'Payment not found', code: 'NOT_FOUND' });
    }

    if (!result.authorized) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to view this payment',
      });
    }

    return res.json(result.payment);
  } catch {
    return res.status(500).json({ error: 'Failed to get payment', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /payment/:id/cancel
 * Cancel a pending payment. Requires authentication.
 */
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required', code: 'VALIDATION_ERROR' });
    }
    const { walletAddress } = (req as any).user;

    const payment = await paymentService.cancelPayment(id, walletAddress);
    return res.json(payment);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * GET /payment/:id/audit
 * Get the audit trail for a payment. Requires authentication.
 * Requirements: 12.9
 */
router.get('/:id/audit', authenticate, async (req, res) => {
  try {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required', code: 'VALIDATION_ERROR' });
    }
    const { walletAddress } = (req as any).user;

    // Authorization: only sender or receiver may view the audit trail
    const result = await paymentService.getPaymentByIdAuthorized(id, walletAddress);

    if (!result) {
      return res.status(404).json({ error: 'Payment not found', code: 'NOT_FOUND' });
    }

    if (!result.authorized) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to view this payment audit trail',
      });
    }

    const auditTrail = await auditService.getAuditTrail(id);
    return res.json(auditTrail);
  } catch {
    return res.status(500).json({ error: 'Failed to get audit trail', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /payment/:id/sync
 * Sync a payment's status from the blockchain. Requires authentication.
 */
router.post('/:id/sync', authenticate, async (req, res) => {
  try {
    const id = req.params['id'];
    if (!id) {
      return res.status(400).json({ error: 'Payment ID is required', code: 'VALIDATION_ERROR' });
    }
    const { username } = req.body;

    const payment = await paymentService.syncPaymentFromBlockchain(username, id);
    return res.json(payment);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
