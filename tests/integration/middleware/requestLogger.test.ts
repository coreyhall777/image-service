import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { requestLogger } from '../../../src/middleware/requestLogger.js';

describe('Request Logger Middleware', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  it('should log request with request ID', async () => {
    const app = express();
    app.use(requestLogger);
    app.get('/test', (_req: Request, res: Response) => {
      res.status(200).json({ ok: true });
    });

    await request(app).get('/test');

    // Should log request
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] GET \/test/));
  });

  it('should log response with status code and duration', async () => {
    const app = express();
    app.use(requestLogger);
    app.get('/test', (_req: Request, res: Response) => {
      res.status(200).json({ ok: true });
    });

    await request(app).get('/test');

    // Should log response with status and duration
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] 200 \d+ms/));
  });

  it('should attach request ID to request headers', async () => {
    const app = express();
    app.use(requestLogger);

    let capturedRequestId: string | undefined;

    app.get('/test', (req: Request, res: Response) => {
      capturedRequestId = req.headers['x-request-id'] as string;
      res.status(200).json({ ok: true });
    });

    await request(app).get('/test');

    expect(capturedRequestId).toBeDefined();
    expect(capturedRequestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('should log different status codes correctly', async () => {
    const app = express();
    app.use(requestLogger);

    app.get('/success', (_req: Request, res: Response) => {
      res.status(200).json({ ok: true });
    });

    app.get('/error', (_req: Request, res: Response) => {
      res.status(500).json({ error: 'Error' });
    });

    await request(app).get('/success');
    await request(app).get('/error');

    // Should log 200 status
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringMatching(/200 \d+ms/));

    // Should log 500 status
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringMatching(/500 \d+ms/));
  });
});
