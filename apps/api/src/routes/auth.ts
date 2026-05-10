import { Router } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { validateBody } from '../middleware/validation';
import { nonceRequestSchema, verifySignatureSchema } from '../middleware/schemas';

const router: Router = Router();
const authService = new AuthService();

// Generate nonce for wallet signature
// validateBody ensures walletAddress is present and valid (Requirements 12.1, 12.11, 12.12)
router.post('/nonce', validateBody(nonceRequestSchema), async (req, res) => {
  try {
    const { walletAddress } = req.body as { walletAddress: string };

    // Generate nonce
    const nonce = await authService.generateNonce(walletAddress);
    const message = `Sign this message to authenticate with Ghost Wallet.\n\nNonce: ${nonce}`;

    logger.info('Auth nonce generated', {
      requestId: (req as any).requestId,
      walletAddress,
    });

    // Response format: { nonce, message, expiresIn, walletAddress } (Requirement 12.1)
    return res.json({
      nonce,
      message,
      expiresIn: '10 minutes',
      walletAddress,
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    
    logger.error('Auth nonce generation failed', {
      requestId: (req as any).requestId,
      walletAddress: req.body?.walletAddress,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      error: 'Failed to generate nonce',
      code: 'NONCE_GENERATION_FAILED',
      message: 'Unable to generate authentication nonce',
    });
  }
});

// Verify wallet signature and authenticate
// validateBody ensures walletAddress, signature, and nonce are present and valid (Requirements 12.2, 12.11, 12.12)
router.post('/verify', validateBody(verifySignatureSchema), async (req, res) => {
  try {
    const { walletAddress, signature, nonce, message } = req.body as {
      walletAddress: string;
      signature: string;
      nonce?: string;
      message?: string;
    };

    const signedMessage = message ?? nonce ?? '';

    // Verify signature — the nonce is passed as the "message" parameter
    const isValid = await authService.verifySignature(
      walletAddress,
      signature,
      signedMessage,
      nonce
    );
    
    if (!isValid) {
      logger.warn('Auth verification failed — invalid signature', {
        requestId: (req as any).requestId,
        walletAddress,
      });
      return res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid signature or expired nonce',
      });
    }

    let user;
    try {
      // Check if user exists, create if not
      user = await prisma.user.findUnique({
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
    } catch (dbError) {
      logger.warn('Auth verification DB unavailable, issuing token without DB user', {
        requestId: (req as any).requestId,
        walletAddress,
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });

      const fallbackUsername = `user_${walletAddress.slice(0, 8).toLowerCase()}`;
      const token = authService.generateToken(walletAddress, fallbackUsername);

      return res.json({
        token,
        user: {
          id: walletAddress,
          walletAddress,
          username: fallbackUsername,
          createdAt: new Date(),
        },
        expiresIn: '24 hours',
      });
    }

    // Generate JWT token
    const token = authService.generateToken(walletAddress, user.username);

    logger.info('Auth verification successful', {
      requestId: (req as any).requestId,
      walletAddress,
      userId: user.id,
      isNewUser: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime() < 5000),
    });

    // Response format: { token, user, expiresIn } (Requirement 12.2)
    return res.json({
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
    
    logger.error('Auth verification error', {
      requestId: (req as any).requestId,
      walletAddress: req.body?.walletAddress,
      error: error instanceof Error ? error.message : String(error),
    });
    
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

    return res.status(500).json({
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

    return res.json({
      valid: true,
      user,
      expiresAt: decoded.exp,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({
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

    return res.json({
      token: newToken,
      expiresIn: '24 hours',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      error: 'Token refresh failed',
      code: 'TOKEN_REFRESH_FAILED',
      message: 'Unable to refresh token',
    });
  }
});

export default router;
