import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/middleware/errorHandler.js';
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
  InternalServerError,
} from '../../../src/utils/errors.js';

// Create a test app with error handler
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  return app;
};

describe('Error Handler Middleware', () => {
  it('should handle BadRequestError (400)', async () => {
    const app = createTestApp();

    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(new BadRequestError('Invalid input'));
    });

    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'BadRequestError',
      message: 'Invalid input',
    });
  });

  it('should handle NotFoundError (404)', async () => {
    const app = createTestApp();

    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(new NotFoundError('Resource not found'));
    });

    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'NotFoundError',
      message: 'Resource not found',
    });
  });

  it('should handle UnprocessableEntityError (422)', async () => {
    const app = createTestApp();

    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(new UnprocessableEntityError('Cannot process request'));
    });

    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: 'UnprocessableEntityError',
      message: 'Cannot process request',
    });
  });

  it('should handle InternalServerError (500)', async () => {
    const app = createTestApp();

    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next(new InternalServerError('Something went wrong'));
    });

    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'InternalServerError',
      message: 'Something went wrong',
    });
  });

  it('should handle unknown errors as 500', async () => {
    const app = createTestApp();

    app.get('/test', () => {
      throw new Error('Unexpected error');
    });

    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
    });
  });

  it('should handle non-Error objects', async () => {
    const app = createTestApp();

    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      next('String error' as unknown as Error);
    });

    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('InternalServerError');
  });

  it('should preserve body-parser 4xx errors', async () => {
    const app = createTestApp();

    // Simulate body-parser error with status property
    app.get('/test', (_req: Request, _res: Response, next: NextFunction) => {
      const err = new Error('Invalid JSON') as Error & { status: number };
      err.status = 400;
      next(err);
    });

    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'BadRequest',
      message: 'Invalid JSON',
    });
  });

  it('should delegate to Express when headers already sent', () => {
    const mockReq = {} as Request;
    const mockRes = {
      headersSent: true,
    } as Response;
    const mockNext = vi.fn();
    const mockError = new Error('Test error');

    errorHandler(mockError, mockReq, mockRes, mockNext);

    // Should call next() to delegate to Express default handler
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });
});
