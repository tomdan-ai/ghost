import { Router } from 'express';
import { supabase } from '../config/supabase';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const router = Router();

// Generate nonce for wallet signature
router.post('/nonce', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const nonce = Math.random().toString(36).substring(2, 15);
    const message = `Sign this message to authenticate with Ghost Wallet.\n\nNonce: ${nonce}`;

    // Store nonce temporarily (in production, use Redis with expiry)
    res.json({ nonce, message });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

// Verify wallet signature and authenticate
router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify signature
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);

    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );

    if (!verified) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if user exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    // Create user if doesn't exist
    if (error && error.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          username: `user_${walletAddress.slice(0, 8)}`,
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    res.json({ user });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
