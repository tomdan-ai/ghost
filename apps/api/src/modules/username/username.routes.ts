import { Router, Request, Response } from 'express';
import { UsernameService } from './username.service';
import { authenticate as authMiddleware } from '../../middleware/auth';

const router = Router();
const usernameService = new UsernameService();

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
      cached: result.cached,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check username', code: 'INTERNAL_ERROR' });
  }
});

router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { username } = req.body as { username?: string };
    if (!username) {
      return res.status(400).json({ error: 'Username is required', code: 'VALIDATION_ERROR' });
    }

    const user = (req as any).user as { id: string; walletAddress: string };
    const { walletAddress, id: userId } = user;

    const result = await usernameService.register(username, walletAddress, userId);

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

    return res.status(201).json(result.registry);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return res.status(400).json({ error: message, code: 'REGISTRATION_ERROR' });
  }
});

router.get('/resolve/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: 'Username is required', code: 'VALIDATION_ERROR' });
    }

    const result = await usernameService.resolve(username);

    if (!result.found) {
      return res.status(404).json({ error: 'Username not found', code: 'NOT_FOUND' });
    }

    return res.json(result.data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to resolve username', code: 'INTERNAL_ERROR' });
  }
});

export default router;
