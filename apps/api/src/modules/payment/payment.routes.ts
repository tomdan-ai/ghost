import { Router } from 'express';
import { PaymentService } from './payment.service';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const paymentService = new PaymentService();

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { receiverWallet, receiverUsername, amount, sourceChain, destinationChain } = req.body;
    const { walletAddress } = req.user;

    const payment = await paymentService.createPaymentRequest({
      senderWallet: walletAddress,
      receiverWallet,
      receiverUsername,
      amount,
      sourceChain,
      destinationChain,
    });

    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create payment' });
  }
});

router.get('/route', async (req, res) => {
  try {
    const route = await paymentService.getRoute(req.query as any);
    res.json(route);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.user;
    const history = await paymentService.getPaymentHistory(walletAddress);
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.query;
    
    const payment = await paymentService.getPaymentWithBlockchainData(
      id,
      username as string
    );

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment' });
  }
});

// Cancel payment
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.user;

    const payment = await paymentService.cancelPayment(id, walletAddress);
    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get payments by username
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const payments = await paymentService.getPaymentsByUsername(username);
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

// Sync payment from blockchain
router.post('/:id/sync', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    const payment = await paymentService.syncPaymentFromBlockchain(username, id);
    res.json(payment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
