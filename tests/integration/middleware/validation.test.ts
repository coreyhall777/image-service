import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { validate } from '../../../src/middleware/validation.js';
import { imageProcessingSchema } from '../../../src/schemas/imageProcessing.schema.js';
import { errorHandler } from '../../../src/middleware/errorHandler.js';

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.get('/process', validate(imageProcessingSchema, 'query'), (_req: Request, res: Response) => {
    res.status(200).json({ success: true });
  });

  app.use(errorHandler);

  return app;
};

describe('Validation Middleware', () => {
  it('should pass valid query parameters', async () => {
    const app = createTestApp();

    const response = await request(app).get('/process').query({
      url: 'https://example.com/image.jpg',
      width: '500',
      height: '300',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it('should reject missing required parameter', async () => {
    const app = createTestApp();

    const response = await request(app).get('/process');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('BadRequestError');
    expect(response.body.message).toContain('url parameter is required');
  });

  it('should reject invalid URL', async () => {
    const app = createTestApp();

    const response = await request(app).get('/process').query({
      url: 'not-a-url',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('BadRequestError');
    expect(response.body.message).toContain('url must be a valid URL');
  });

  it('should reject invalid width', async () => {
    const app = createTestApp();

    const response = await request(app).get('/process').query({
      url: 'https://example.com/image.jpg',
      width: '-100',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('BadRequestError');
    expect(response.body.message).toContain('width must be a positive integer');
  });

  it('should reject invalid format', async () => {
    const app = createTestApp();

    const response = await request(app).get('/process').query({
      url: 'https://example.com/image.jpg',
      format: 'bmp',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('BadRequestError');
    expect(response.body.message).toContain('format must be one of');
  });

  it('should reject unknown parameters', async () => {
    const app = createTestApp();

    const response = await request(app).get('/process').query({
      url: 'https://example.com/image.jpg',
      unknown: 'parameter',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('BadRequestError');
  });

  it('should handle multiple validation errors', async () => {
    const app = createTestApp();

    const response = await request(app).get('/process').query({
      url: 'not-a-url',
      width: '-100',
      quality: '200',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('BadRequestError');
    // Should contain multiple error messages
    expect(response.body.message).toContain('url');
    expect(response.body.message).toContain('width');
    expect(response.body.message).toContain('quality');
  });

  it('should transform string numbers to integers', async () => {
    const app = express();
    app.use(express.json());

    let capturedQuery: unknown;

    app.get('/process', validate(imageProcessingSchema, 'query'), (req: Request, res: Response) => {
      capturedQuery = req.query;
      res.status(200).json({ success: true });
    });

    app.use(errorHandler);

    await request(app).get('/process').query({
      url: 'https://example.com/image.jpg',
      width: '500',
      quality: '80',
    });

    expect(capturedQuery).toEqual({
      url: 'https://example.com/image.jpg',
      width: 500,
      quality: 80,
    });
  });
});
