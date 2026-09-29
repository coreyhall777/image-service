import { describe, it, expect } from 'vitest';
import { ImageProcessor } from '../../../src/services/imageProcessor';
import { UnprocessableEntityError } from '../../../src/utils/errors';
import sharp from 'sharp';

describe('ImageProcessor', () => {
  const processor = new ImageProcessor();

  // Create a simple test image buffer (1x1 red pixel PNG)
  const createTestImage = async (
    width = 100,
    height = 100,
    format: 'png' | 'jpeg' | 'webp' = 'png'
  ): Promise<Buffer> => {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .toFormat(format)
      .toBuffer();
  };

  describe('Basic processing', () => {
    it('should process image without modifications', async () => {
      const input = await createTestImage(100, 100);
      const result = await processor.process(input, {});

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.contentType).toBe('image/png');
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should create ImageProcessor instance', () => {
      expect(processor).toBeInstanceOf(ImageProcessor);
    });
  });

  describe('Resizing', () => {
    it('should resize to specific width', async () => {
      const input = await createTestImage(200, 100);
      const result = await processor.process(input, { width: 50 });

      expect(result.width).toBe(50);
      expect(result.height).toBe(25); // Maintains aspect ratio
    });

    it('should resize to specific height', async () => {
      const input = await createTestImage(200, 100);
      const result = await processor.process(input, { height: 50 });

      expect(result.width).toBe(100); // Maintains aspect ratio
      expect(result.height).toBe(50);
    });

    it('should resize to both width and height with cover crop', async () => {
      const input = await createTestImage(200, 100);
      const result = await processor.process(input, {
        width: 100,
        height: 100,
        crop: 'cover',
      });

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should resize with contain crop', async () => {
      const input = await createTestImage(200, 100);
      const result = await processor.process(input, {
        width: 100,
        height: 100,
        crop: 'contain',
      });

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should resize with fill crop', async () => {
      const input = await createTestImage(200, 100);
      const result = await processor.process(input, {
        width: 100,
        height: 100,
        crop: 'fill',
      });

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should not enlarge image by default', async () => {
      const input = await createTestImage(50, 50);
      const result = await processor.process(input, { width: 200 });

      expect(result.width).toBe(50); // Not enlarged
      expect(result.height).toBe(50);
    });
  });

  describe('Format conversion', () => {
    it('should convert PNG to JPEG', async () => {
      const input = await createTestImage(100, 100, 'png');
      const result = await processor.process(input, { format: 'jpeg' });

      expect(result.contentType).toBe('image/jpeg');
    });

    it('should convert PNG to WebP', async () => {
      const input = await createTestImage(100, 100, 'png');
      const result = await processor.process(input, { format: 'webp' });

      expect(result.contentType).toBe('image/webp');
    });

    it('should convert JPEG to PNG', async () => {
      const input = await createTestImage(100, 100, 'jpeg');
      const result = await processor.process(input, { format: 'png' });

      expect(result.contentType).toBe('image/png');
    });
  });

  describe('Quality adjustment', () => {
    it('should apply quality to JPEG', async () => {
      const input = await createTestImage(100, 100, 'jpeg');
      const highQuality = await processor.process(input, {
        format: 'jpeg',
        quality: 95,
      });
      const lowQuality = await processor.process(input, {
        format: 'jpeg',
        quality: 10,
      });

      expect(lowQuality.buffer.length).toBeLessThan(highQuality.buffer.length);
    });

    it('should apply quality to WebP', async () => {
      const input = await createTestImage(100, 100, 'webp');
      const highQuality = await processor.process(input, {
        format: 'webp',
        quality: 95,
      });
      const lowQuality = await processor.process(input, {
        format: 'webp',
        quality: 10,
      });

      expect(lowQuality.buffer.length).toBeLessThan(highQuality.buffer.length);
    });

    it('should apply quality without format change', async () => {
      const input = await createTestImage(100, 100, 'jpeg');
      const result = await processor.process(input, { quality: 50 });

      expect(result.contentType).toBe('image/jpeg');
    });
  });

  describe('Combined operations', () => {
    it('should resize and convert format', async () => {
      const input = await createTestImage(200, 100, 'png');
      const result = await processor.process(input, {
        width: 100,
        format: 'jpeg',
      });

      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
      expect(result.contentType).toBe('image/jpeg');
    });

    it('should resize, convert format, and adjust quality', async () => {
      const input = await createTestImage(200, 100, 'png');
      const result = await processor.process(input, {
        width: 50,
        format: 'webp',
        quality: 80,
      });

      expect(result.width).toBe(50);
      expect(result.height).toBe(25);
      expect(result.contentType).toBe('image/webp');
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('not an image');

      await expect(processor.process(invalidBuffer, {})).rejects.toThrow(UnprocessableEntityError);
    });

    it('should throw error for corrupted image', async () => {
      const corruptedBuffer = Buffer.from([0xff, 0xd8, 0xff]); // Truncated JPEG

      await expect(processor.process(corruptedBuffer, {})).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it('should throw error for quality = 0', async () => {
      const input = await createTestImage(100, 100);

      await expect(processor.process(input, { quality: 0 })).rejects.toThrow(
        UnprocessableEntityError
      );
      await expect(processor.process(input, { quality: 0 })).rejects.toThrow(
        /Quality must be an integer between 1 and 100/
      );
    });

    it('should throw error for quality > 100', async () => {
      const input = await createTestImage(100, 100);

      await expect(processor.process(input, { quality: 101 })).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it('should throw error for quality < 1', async () => {
      const input = await createTestImage(100, 100);

      await expect(processor.process(input, { quality: -1 })).rejects.toThrow(
        UnprocessableEntityError
      );
    });

    it('should throw error for non-integer quality', async () => {
      const input = await createTestImage(100, 100);

      await expect(processor.process(input, { quality: 50.5 })).rejects.toThrow(
        UnprocessableEntityError
      );
    });
  });

  describe('Content-Type handling', () => {
    it('should return correct MIME type for JPEG', async () => {
      const input = await createTestImage(100, 100, 'jpeg');
      const result = await processor.process(input, { format: 'jpeg' });

      expect(result.contentType).toBe('image/jpeg');
    });

    it('should return correct MIME type for PNG', async () => {
      const input = await createTestImage(100, 100, 'png');
      const result = await processor.process(input, { format: 'png' });

      expect(result.contentType).toBe('image/png');
    });

    it('should return correct MIME type for WebP', async () => {
      const input = await createTestImage(100, 100, 'webp');
      const result = await processor.process(input, { format: 'webp' });

      expect(result.contentType).toBe('image/webp');
    });

    it('should preserve input format when no format specified', async () => {
      const jpegInput = await createTestImage(100, 100, 'jpeg');
      const jpegResult = await processor.process(jpegInput, {});
      expect(jpegResult.contentType).toBe('image/jpeg');

      const pngInput = await createTestImage(100, 100, 'png');
      const pngResult = await processor.process(pngInput, {});
      expect(pngResult.contentType).toBe('image/png');
    });

    it('should normalize jpg alias to jpeg format', async () => {
      const input = await createTestImage(100, 100, 'png');
      // TypeScript doesn't allow 'jpg' but runtime might receive it from API
      const result = await processor.process(input, { format: 'jpg' as 'jpeg' });

      expect(result.contentType).toBe('image/jpeg');
      // Verify it's actually JPEG by checking the buffer (starts with FFD8FF)
      expect(result.buffer[0]).toBe(0xff);
      expect(result.buffer[1]).toBe(0xd8);
      expect(result.buffer[2]).toBe(0xff);
    });
  });

  describe('Quality with ?? operator', () => {
    it('should use default quality 80 when not specified for JPEG', async () => {
      const input = await createTestImage(100, 100);
      const withDefault = await processor.process(input, { format: 'jpeg' });
      const withExplicit80 = await processor.process(input, {
        format: 'jpeg',
        quality: 80,
      });

      // Both should produce similar size buffers (defaults work correctly)
      const sizeDiff = Math.abs(withDefault.buffer.length - withExplicit80.buffer.length);
      expect(sizeDiff).toBeLessThan(100); // Allow small variance
    });

    it('should use quality 1 when explicitly set to 1', async () => {
      const input = await createTestImage(100, 100);
      const quality1 = await processor.process(input, { format: 'jpeg', quality: 1 });
      const quality80 = await processor.process(input, { format: 'jpeg', quality: 80 });

      expect(quality1.buffer.length).toBeLessThan(quality80.buffer.length);
    });
  });
});
