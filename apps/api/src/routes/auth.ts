import { Router } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../config/database';

const router = Router();
const authService = new AuthService();

// Generate nonce for wallet signature
router.post('/nonce', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address required',
        code: 'VALIDATION_ERROR',
        details: { field: 'walletAddress' },
      });
    }

    // Generate nonce
    const nonce = await authService.generateNonce(walletAddress);
    const message = `Sign this message to authenticate with Ghost Wallet.\n\nNonce: ${nonce}`;

    res.json({
      nonce,
      message,
      expiresIn: '10 minutes',
      walletAddress,
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    
    if (error instanceof Error && error.message.includes('Invalid wallet address')) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET_ADDRESS',
        message: 'Please provide a valid Solana or Ethereum wallet address',
      });
    }

    res.status(500).json({
      error: 'Failed to generate nonce',
      code: 'NONCE_GENERATION_FAILED',
      message: 'Unable to generate authentication nonce',
    });
  }
});

// Verify wallet signature and authenticate
router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    // Validate required fields
    if (!walletAddress || !signature || !message) {
      const missingFields = [];
      if (!walletAddress) missingFields.push('walletAddress');
      if (!signature) missingFields.push('signature');
      if (!message) missingFields.push('message');

      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        details: { missingFields },
      });
    }

    // Verify signature
    const isValid = await authService.verifySignature(walletAddress, signature, message);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid signature or expired nonce',
      });
    }

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      // Generate default username
      const defaultUsername = `user_${walletAddress.slice(0, 8).toLowerCase()}`;
      
      user = await prisma.user.create({
        data: {
          walletAddress,
          username: defaultUsername,
        },
      });

      // Create username registry entry
      await prisma.usernameRegistry.create({
        data: {
          username: defaultUsername,
          walletAddress,
          userId: user.id,
        },
      });
    }

    // Generate JWT token
    const token = authService.generateToken(walletAddress, user.username);

    res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        createdAt: user.createdAt,
      },
      expiresIn: '24 hours',
    });
  } catch (error) {
    console.error('Verification error:', error);
    
    if (error instanceof Error) {
      // Handle specific Prisma errors
      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({
          error: 'User already exists',
          code: 'USER_ALREADY_EXISTS',
          message: 'A user with this wallet address already exists',
        });
      }
    }

    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTHENTICATION_FAILED',
      message: 'Unable to complete authentication',
    });
  }
});

// Validate token (for client-side token validation)
router.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        code: 'VALIDATION_ERROR',
        details: { field: 'token' },
      });
    }

    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'The provided token is invalid or expired',
      });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { walletAddress: decoded.walletAddress },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'User associated with this token no longer exists',
      });
    }

    res.json({
      valid: true,
      user,
      expiresAt: decoded.exp,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      error: 'Token validation failed',
      code: 'TOKEN_VALIDATION_FAILED',
      message: 'Unable to validate token',
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        code: 'VALIDATION_ERROR',
        details: { field: 'token' },
      });
    }

    const newToken = authService.refreshToken(token);
    
    if (!newToken) {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'Cannot refresh invalid or expired token',
      });
    }

    res.json({
      token: newToken,
      expiresIn: '24 hours',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'TOKEN_REFRESH_FAILED',
      message: 'Unable to refresh token',
    });
  }
});

export default router;
