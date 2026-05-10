import { Request, Response, NextFunction } from 'express';

// ─── AppError ─────────────────────────────────────────────────────────────────

/**
 * Structured application error that carries an error code and optional details.
 * Use this throughout the codebase instead of plain Error objects so the global
 * handler can map them to the correct HTTP status automatically.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }

    // Maintain proper prototype chain in transpiled ES5
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ─── Error code → HTTP status map ────────────────────────────────────────────

const ERROR_STATUS_MAP: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  ACCESS_DENIED: 403,
  NOT_FOUND: 404,
  PAYMENT_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  INVALID_STATE_TRANSITION: 409,
  CONCURRENT_TRANSITION: 409,
  RATE_LIMIT_EXCEEDED: 429,
};

function resolveStatusCode(code: string, fallback: number): number {
  return ERROR_STATUS_MAP[code] ?? fallback;
}

// ─── Global error handler ─────────────────────────────────────────────────────

/**
 * Express global error-handling middleware.
 * Must be registered as the LAST middleware in index.ts.
 *
 * - Returns { error, code, details? } JSON for all errors.
 * - Never exposes stack traces in production.
 * - Logs errors with request ID for tracing. Requirements 8.7–8.9.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId =
    (req.headers['x-request-id'] as string | undefined) ??
    `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const isProduction = process.env['NODE_ENV'] === 'production';

  if (err instanceof AppError) {
    const statusCode = resolveStatusCode(err.code, err.statusCode);

    console.error(
      JSON.stringify({
        level: 'error',
        requestId,
        code: err.code,
        message: err.message,
        statusCode,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        ...(isProduction ? {} : { stack: err.stack }),
      })
    );

    const body: Record<string, unknown> = {
      error: err.message,
      code: err.code,
    };

    if (err.details) {
      body['details'] = err.details;
    }

    res.status(statusCode).json(body);
    return;
  }

  // Unknown / unhandled error
  const code = (err as any).code ?? 'INTERNAL_SERVER_ERROR';
  const statusCode = resolveStatusCode(code, 500);

  console.error(
    JSON.stringify({
      level: 'error',
      requestId,
      code,
      message: err.message,
      statusCode,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      ...(isProduction ? {} : { stack: err.stack }),
    })
  );

  const body: Record<string, unknown> = {
    error: isProduction ? 'An unexpected error occurred' : err.message,
    code,
  };

  // Include validation details if present (e.g. from PaymentService)
  if ((err as any).validationErrors) {
    body['details'] = { errors: (err as any).validationErrors };
  }

  res.status(statusCode).json(body);
}
