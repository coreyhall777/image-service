import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Request logger middleware
 * Logs incoming requests with request ID and timing
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // Attach request ID to request object for tracing
  req.headers['x-request-id'] = requestId;

  // Log request
  console.info(`[${requestId}] ${req.method} ${req.path}`);

  let logged = false;

  // Helper to log response once
  const logResponse = (status: number, reason: string) => {
    if (logged) return;
    logged = true;
    const duration = Date.now() - startTime;
    console.info(`[${requestId}] ${status} ${duration}ms${reason ? ` (${reason})` : ''}`);
  };

  // Log response when finished
  res.on('finish', () => {
    logResponse(res.statusCode, '');
  });

  // Log if client disconnects before response completes
  res.on('close', () => {
    if (!res.writableEnded) {
      // Always use 499 for client disconnect to avoid misleading logs
      // (res.statusCode may still be 200 default even on abort)
      logResponse(499, 'client disconnect');
    }
  });

  next();
};
