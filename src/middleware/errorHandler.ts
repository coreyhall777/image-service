import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error & { status?: number; statusCode?: number },
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // If headers already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
  }

  // Handle body-parser errors (malformed JSON, etc.) - preserve 4xx status
  const statusCode = err.status || err.statusCode;
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      error: 'BadRequest',
      message: err.message || 'Invalid request',
    });
  }

  // Handle unknown errors
  console.error('Unexpected error:', err);

  return res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
  });
};
