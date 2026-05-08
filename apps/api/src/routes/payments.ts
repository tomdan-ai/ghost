import { Router } from 'express';
import { supabase } from '../config/supabase';
import axios from 'axios';

const router = Router();

// Create payment request
router.post('/', async (req, res) => {
  try {
    const {
      senderWallet,
      receiverWallet,
      amount,
      sourceChain,
      destinationChain,
    } = req.body;

    const { data: payment, error } = await supabase
      .from('payment_requests')
      .insert({
        sender_wallet: senderWallet,
        receiver_wallet: receiverWallet,
        amount,
        source_chain: sourceChain,
        destination_chain: destinationChain,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ payment });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: payment, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Get LI.FI route quote
router.post('/quote', async (req, res) => {
  try {
    const { fromChain, toChain, fromToken, toToken, amount, fromAddress } =
      req.body;

    const response = await axios.get('https://li.quest/v1/quote', {
      params: {
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount: amount,
        fromAddress,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('LI.FI quote error:', error);
    res.status(500).json({ error: 'Failed to get quote' });
  }
});

// Get payment history for wallet
router.get('/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const { data: payments, error } = await supabase
      .from('payment_requests')
      .select('*')
      .or(`sender_wallet.eq.${walletAddress},receiver_wallet.eq.${walletAddress}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

export default router;
