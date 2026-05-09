import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format Zod validation errors into a flat array of { field, message } objects.
 */
function formatZodErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.errors.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
}

// ─── Middleware factory ───────────────────────────────────────────────────────

/**
 * Returns Express middleware that validates req.body against the given Zod schema.
 * On failure: 400 with { error, code, details: { errors } }.
 * Requirements 8.1–8.9.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          errors: formatZodErrors(result.error),
        },
      });
      return;
    }

    // Replace req.body with the parsed (and potentially transformed) value
    req.body = result.data;
    next();
  };
}

/**
 * Returns Express middleware that validates req.query against the given Zod schema.
 * On failure: 400 with { error, code, details: { errors } }.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          errors: formatZodErrors(result.error),
        },
      });
      return;
    }

    // Replace req.query with the parsed (and potentially transformed) value
    (req as any).query = result.data;
    next();
  };
}

/**
 * Returns Express middleware that validates req.params against the given Zod schema.
 * On failure: 400 with { error, code, details: { errors } }.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          errors: formatZodErrors(result.error),
        },
      });
      return;
    }

    // Replace req.params with the parsed value
    (req as any).params = result.data;
    next();
  };
}
