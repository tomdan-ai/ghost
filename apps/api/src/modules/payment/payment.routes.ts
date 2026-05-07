import { Router } from 'express';
import { PaymentService } from './payment.service';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const paymentService = new PaymentService();

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { receiverWallet, amount, sourceChain, destinationChain } = req.body;
    const { walletAddress } = req.user;

    const payment = await paymentService.createPaymentRequest({
      senderWallet: walletAddress,
      receiverWallet,
      amount,
      sourceChain,
      destinationChain,
    });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment' });
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
    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payment' });
  }
});

export default router;
