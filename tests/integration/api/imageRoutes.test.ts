import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { ImageFetcher } from '../../../src/services/imageFetcher';
import { ImageProcessor } from '../../../src/services/imageProcessor';
import sharp from 'sharp';

// Mock the services
vi.mock('../../../src/services/imageFetcher');
vi.mock('../../../src/services/imageProcessor');

describe('GET /process', () => {
  let mockImageBuffer: Buffer;

  beforeEach(async () => {
    // Create a simple test image
    mockImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful processing', () => {
    it('should process image with all parameters', async () => {
      const mockFetch = vi.spyOn(ImageFetcher.prototype, 'fetch').mockResolvedValue({
        buffer: mockImageBuffer,
        contentType: 'image/png',
        contentLength: mockImageBuffer.length,
      });
      const mockProcess = vi.spyOn(ImageProcessor.prototype, 'process').mockResolvedValue({
        buffer: mockImageBuffer,
        contentType: 'image/jpeg',
        width: 200,
        height: 150,
      });

      const response = await request(app).get('/process').query({
        url: 'https://example.com/image.png',
        width: 200,
        height: 150,
        format: 'jpeg',
        quality: 80,
        crop: 'cover',
      });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('image/jpeg');
      expect(response.header['cache-control']).toBe('public, no-cache');
      expect(response.header['x-image-width']).toBe('200');
      expect(response.header['x-image-height']).toBe('150');
      expect(Buffer.isBuffer(response.body)).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/image.png');
      expect(mockProcess).toHaveBeenCalledWith(mockImageBuffer, {
        width: 200,
        height: 150,
        format: 'jpeg',
        quality: 80,
        crop: 'cover',
      });
    });

    it('should process image with only URL parameter', async () => {
      vi.spyOn(ImageFetcher.prototype, 'fetch').mockResolvedValue({
        buffer: mockImageBuffer,
        contentType: 'image/png',
        contentLength: mockImageBuffer.length,
      });
      vi.spyOn(ImageProcessor.prototype, 'process').mockResolvedValue({
        buffer: mockImageBuffer,
        contentType: 'image/png',
        width: 100,
        height: 100,
      });

      const response = await request(app)
        .get('/process')
        .query({ url: 'https://example.com/image.png' });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('image/png');
      expect(response.header['x-image-width']).toBe('100');
      expect(response.header['x-image-height']).toBe('100');
    });

    it('should handle jpg format alias', async () => {
      vi.spyOn(ImageFetcher.prototype, 'fetch').mockResolvedValue({
        buffer: mockImageBuffer,
        contentType: 'image/png',
        contentLength: mockImageBuffer.length,
      });
      vi.spyOn(ImageProcessor.prototype, 'process').mockResolvedValue({
        buffer: mockImageBuffer,
        contentType: 'image/jpeg',
        width: 100,
        height: 100,
      });

      const response = await request(app).get('/process').query({
        url: 'https://example.com/image.png',
        format: 'jpg',
      });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('image/jpeg');
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for missing URL', async () => {
      const response = await request(app).get('/process');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('url');
    });

    it('should return 400 for invalid URL format', async () => {
      const response = await request(app).get('/process').query({ url: 'not-a-url' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('url');
    });

    it('should return 400 for invalid width', async () => {
      const response = await request(app).get('/process').query({
        url: 'https://example.com/image.png',
        width: 'abc',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('width');
    });

    it('should return 400 for width out of range', async () => {
      const response = await request(app).get('/process').query({
        url: 'https://example.com/image.png',
        width: '20000',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('width');
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app).get('/process').query({
        url: 'https://example.com/image.png',
        format: 'gif',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('format');
    });

    it('should return 400 for quality out of range', async () => {
      const response = await request(app).get('/process').query({
        url: 'https://example.com/image.png',
        quality: '101',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('quality');
    });

    it('should return 400 for invalid crop mode', async () => {
      const response = await request(app).get('/process').query({
        url: 'https://example.com/image.png',
        crop: 'invalid',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('crop');
    });

    it('should return 400 for unknown parameters', async () => {
      const response = await request(app).get('/process').query({
        url: 'https://example.com/image.png',
        unknown: 'value',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Unrecognized key');
    });
  });

  describe('Fetcher errors', () => {
    it('should return 422 for fetch timeout', async () => {
      const { UnprocessableEntityError } = await import('../../../src/utils/errors.js');
      vi.spyOn(ImageFetcher.prototype, 'fetch').mockRejectedValue(
        new UnprocessableEntityError('Request timeout after 30000ms')
      );

      const response = await request(app)
        .get('/process')
        .query({ url: 'https://example.com/slow-image.png' });

      expect(response.status).toBe(422);
      expect(response.body.message).toContain('timeout');
    });

    it('should return 422 for invalid image', async () => {
      const { UnprocessableEntityError } = await import('../../../src/utils/errors.js');
      vi.spyOn(ImageFetcher.prototype, 'fetch').mockRejectedValue(
        new UnprocessableEntityError('Invalid image format')
      );

      const response = await request(app)
        .get('/process')
        .query({ url: 'https://example.com/not-an-image.txt' });

      expect(response.status).toBe(422);
      expect(response.body.message).toContain('Invalid image format');
    });
  });

  describe('Processor errors', () => {
    it('should return 422 for processing errors', async () => {
      const { UnprocessableEntityError } = await import('../../../src/utils/errors.js');
      vi.spyOn(ImageFetcher.prototype, 'fetch').mockResolvedValue({
        buffer: mockImageBuffer,
        contentType: 'image/png',
        contentLength: mockImageBuffer.length,
      });
      vi.spyOn(ImageProcessor.prototype, 'process').mockRejectedValue(
        new UnprocessableEntityError('Failed to process image')
      );

      const response = await request(app)
        .get('/process')
        .query({ url: 'https://example.com/image.png' });

      expect(response.status).toBe(422);
      expect(response.body.message).toContain('Failed to process image');
    });
  });
});
