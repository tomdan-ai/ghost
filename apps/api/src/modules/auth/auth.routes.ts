import { Router } from 'express';
import { AuthService } from './auth.service';
import { prisma } from '../../config/database';

const router: Router = Router();
const authService = new AuthService();

router.post('/nonce', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const nonce = authService.generateNonce(walletAddress);
    
    return res.json({ nonce });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature, message, nonce } = req.body;

    const signedMessage = message ?? nonce ?? '';

    const isValid = await authService.verifySignature(
      walletAddress,
      signature,
      signedMessage,
      nonce
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

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
