import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  timestamp: string;
  [key: string]: unknown;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

export class Logger {
  /**
   * Generate a UUID v4 request identifier.
   */
  generateRequestId(): string {
    return randomUUID();
  }

  /**
   * Core structured logging method.
   * Outputs a single-line JSON entry to stdout (info/debug) or stderr (warn/error).
   */
  log(level: LogLevel, message: string, metadata: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    const line = JSON.stringify(entry);

    if (level === 'error' || level === 'warn') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  /**
   * Express middleware that:
   *  1. Attaches a unique requestId to the request object.
   *  2. Logs the incoming request (method, path, ip).
   *  3. Logs the outgoing response (status, duration) when the response finishes.
   */
  requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = this.generateRequestId();
    (req as any).requestId = requestId;

    const startTime = Date.now();
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    this.info('Incoming request', {
      requestId,
      method: req.method,
      path: req.path,
      ip,
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level: LogLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      this.log(level, 'Outgoing response', {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: duration,
      });
    });

    next();
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const logger = new Logger();
