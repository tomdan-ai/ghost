import { Router } from 'express';
import usernameRouter from '../modules/username/username.routes';

const router = Router();

/**
 * Mount the username module routes under /api/users/username.
 * This exposes:
 *   GET  /api/users/username/check/:username   — availability check (no auth)
 *   POST /api/users/username/register          — register username (auth required)
 *   GET  /api/users/username/resolve/:username — resolve to wallet (no auth)
 *
 * Requirements: 12.3, 12.4, 12.5, 12.11, 12.12
 */
router.use('/username', usernameRouter);

export default router;
