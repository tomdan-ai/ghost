import { Router, Request, Response } from 'express';
import { UsernameService } from './username.service';
import { authenticate as authMiddleware } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { registerUsernameSchema } from '../../middleware/schemas';

const router: Router = Router();
const usernameService = new UsernameService();

/**
 * GET /username/check/:username
 * Check username availability. No authentication required.
 * Response: { available: boolean, username: string }
 * Requirements: 12.3, 12.11, 12.12
 */
router.get('/check/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: 'Username is required', code: 'VALIDATION_ERROR' });
    }
    const result = await usernameService.checkAvailability(username);

    if (result.validation && !result.validation.valid) {
      return res.status(400).json({
        error: 'Invalid username format',
        code: 'VALIDATION_ERROR',
        details: result.validation.errors,
      });
    }

    return res.json({
      available: result.available,
      username: username.toLowerCase(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check username', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /username/register
 * Register a username for the authenticated wallet.
 * Response: { success: boolean, username: string, walletAddress: string }
 * Requirements: 12.4, 12.11, 12.12
 */
router.post('/register', authMiddleware, validateBody(registerUsernameSchema), async (req: Request, res: Response) => {
  try {
    const { username } = req.body as { username: string };

    const user = (req as any).user as { id: string; walletAddress: string };
    const { walletAddress, id: userId } = user;

    const result = await usernameService.register(username, walletAddress, userId, {
      skipDb: Boolean((req as any).authDbUnavailable),
    });

    if (!result.success) {
      const isConflict = result.errors?.includes('Username already taken') ||
        result.errors?.includes('User already has a registered username');
      const statusCode = isConflict ? 409 : 400;
      return res.status(statusCode).json({
        error: result.errors?.[0] ?? 'Registration failed',
        code: isConflict ? 'USERNAME_CONFLICT' : 'VALIDATION_ERROR',
        details: result.errors,
      });
    }

    // Return spec-compliant response format
    return res.status(201).json({
      success: true,
      username: result.registry?.username ?? username.toLowerCase(),
      walletAddress,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return res.status(400).json({ error: message, code: 'REGISTRATION_ERROR' });
  }
});

/**
 * GET /username/resolve/:username
 * Resolve a username to its wallet address. No authentication required.
 * Response: { username: string, walletAddress: string, createdAt: string }
 * Requirements: 12.5, 12.11, 12.12
 */
router.get('/resolve/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: 'Username is required', code: 'VALIDATION_ERROR' });
    }

    const result = await usernameService.resolve(username);

    if (!result.found || !result.data) {
      return res.status(404).json({ error: 'Username not found', code: 'NOT_FOUND' });
    }

    const data = result.data;

    // Return spec-compliant response format
    return res.json({
      username: data.username ?? username.toLowerCase(),
      walletAddress: data.walletAddress ?? data.user?.walletAddress,
      createdAt: data.createdAt instanceof Date
        ? data.createdAt.toISOString()
        : String(data.createdAt),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resolve username', code: 'INTERNAL_ERROR' });
  }
});

export default router;
