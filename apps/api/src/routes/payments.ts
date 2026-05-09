import { Router } from 'express';
import paymentModuleRouter from '../modules/payment/payment.routes';

const router = Router();

/**
 * Mount the payment module routes.
 * This exposes (all under /api/payments):
 *   POST /api/payments/create          — create payment (auth required)
 *   GET  /api/payments/route           — get LI.FI route (no auth)
 *   GET  /api/payments/history         — paginated history (auth required)
 *   GET  /api/payments/username/:username — payments by username
 *   GET  /api/payments/:id             — get payment by ID (auth required)
 *   POST /api/payments/:id/cancel      — cancel payment (auth required)
 *   GET  /api/payments/:id/audit       — get audit trail (auth required)
 *   POST /api/payments/:id/sync        — sync from blockchain (auth required)
 *
 * Requirements: 12.6, 12.7, 12.8, 12.9, 12.11, 12.12
 */
router.use('/', paymentModuleRouter);

export default router;
