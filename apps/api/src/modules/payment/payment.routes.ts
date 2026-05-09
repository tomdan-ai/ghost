import { Router } from 'express';
import { PaymentService } from './payment.service';
import { authenticate } from '../../middleware/auth';

const router = Router();
const paymentService = new PaymentService();

/**
 * POST /payment/create
 * Create a new payment request. Requires authentication.
 * senderWallet is always sourced from the JWT token (Requirement 3.9).
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { receiverWallet, amount, sourceChain, destinationChain } = req.body;
    const { walletAddress } = (req as any).user;

    // senderWallet is always taken from the authenticated JWT (Req 3.9)
    const payment = await paymentService.createPaymentRequest({
      senderWallet: walletAddress,
      receiverWallet,
      amount,
      sourceChain,
      destinationChain,
    });

    res.status(201).json(payment);
  } catch (error: any) {
    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { errors: error.validationErrors },
      });
    }
    res.status(500).json({ error: 'Failed to create payment', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /payment/route
 * Get cross-chain route from LI.FI. No authentication required.
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
 * Get payment history for the authenticated user.
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { walletAddress } = (req as any).user;
    const history = await paymentService.getPaymentHistory(walletAddress);

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

/**
 * GET /payment/:id
 * Get a payment request by ID. Requires authentication.
 * Only the sender or receiver of the payment may access it (Requirement 5.5).
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress } = (req as any).user;

    const result = await paymentService.getPaymentByIdAuthorized(id, walletAddress);

    if (!result) {
      return res.status(404).json({
        error: 'Payment not found',
        code: 'NOT_FOUND',
      });
    }

    if (!result.authorized) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to view this payment',
      });
    }

    res.json(result.payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment', code: 'INTERNAL_ERROR' });
  }
});

export default router;
