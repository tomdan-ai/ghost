import { Router } from 'express';
import { AuthService } from './auth.service';
import { prisma } from '../../config/database';

const router = Router();
const authService = new AuthService();

router.post('/nonce', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const nonce = authService.generateNonce(walletAddress);
    
    res.json({ nonce });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    const isValid = authService.verifySignature(
      walletAddress,
      signature,
      message
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          username: `user_${walletAddress.slice(0, 8)}`,
        },
      });
    }

    const token = authService.generateToken(walletAddress, user.username);

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
