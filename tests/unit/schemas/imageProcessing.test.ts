import { describe, it, expect } from 'vitest';
import { imageProcessingSchema } from '../../../src/schemas/imageProcessing.schema.js';

describe('Image Processing Schema', () => {
  describe('url validation', () => {
    it('should accept valid HTTP image URL', () => {
      const result = imageProcessingSchema.parse({
        url: 'http://example.com/image.jpg',
      });

      expect(result.url).toBe('http://example.com/image.jpg');
    });

    it('should accept valid HTTPS image URL', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.png',
      });

      expect(result.url).toBe('https://example.com/image.png');
    });

    it('should reject missing url', () => {
      expect(() => imageProcessingSchema.parse({})).toThrow('url parameter is required');
    });

    it('should reject invalid URL format', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'not-a-url',
        })
      ).toThrow('url must be a valid URL');
    });

    it('should reject non-http(s) protocols', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'ftp://example.com/image.jpg',
        })
      ).toThrow('url must point to an image');
    });
  });

  describe('width validation', () => {
    it('should accept valid width', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        width: '500',
      });

      expect(result.width).toBe(500);
      expect(typeof result.width).toBe('number');
    });

    it('should accept width as optional', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
      });

      expect(result.width).toBeUndefined();
    });

    it('should reject width = 0', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          width: '0',
        })
      ).toThrow('width must be a positive integer');
    });

    it('should reject negative width', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          width: '-100',
        })
      ).toThrow('width must be a positive integer');
    });

    it('should reject width > 10000', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          width: '10001',
        })
      ).toThrow('width must be a positive integer');
    });

    it('should reject non-numeric width', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          width: 'abc',
        })
      ).toThrow('width must be a positive integer');
    });

    it('should reject width with trailing characters', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          width: '500abc',
        })
      ).toThrow('width must be a positive integer');
    });

    it('should reject width with decimal', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          width: '80.9',
        })
      ).toThrow('width must be a positive integer');
    });

    it('should reject width in scientific notation', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          width: '1e4',
        })
      ).toThrow('width must be a positive integer');
    });
  });

  describe('height validation', () => {
    it('should accept valid height', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        height: '300',
      });

      expect(result.height).toBe(300);
      expect(typeof result.height).toBe('number');
    });

    it('should accept height as optional', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
      });

      expect(result.height).toBeUndefined();
    });

    it('should reject height = 0', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          height: '0',
        })
      ).toThrow('height must be a positive integer');
    });

    it('should reject height > 10000', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          height: '10001',
        })
      ).toThrow('height must be a positive integer');
    });

    it('should reject height with trailing characters', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          height: '300abc',
        })
      ).toThrow('height must be a positive integer');
    });

    it('should reject height with decimal', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          height: '200.5',
        })
      ).toThrow('height must be a positive integer');
    });
  });

  describe('format validation', () => {
    it('should accept jpeg format', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        format: 'jpeg',
      });

      expect(result.format).toBe('jpeg');
    });

    it('should accept jpg format', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        format: 'jpg',
      });

      expect(result.format).toBe('jpg');
    });

    it('should accept png format', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        format: 'png',
      });

      expect(result.format).toBe('png');
    });

    it('should accept webp format', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        format: 'webp',
      });

      expect(result.format).toBe('webp');
    });

    it('should reject invalid format', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          format: 'bmp',
        })
      ).toThrow('format must be one of: jpeg, jpg, png, webp');
    });

    it('should accept format as optional', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
      });

      expect(result.format).toBeUndefined();
    });
  });

  describe('quality validation', () => {
    it('should accept valid quality', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        quality: '80',
      });

      expect(result.quality).toBe(80);
      expect(typeof result.quality).toBe('number');
    });

    it('should accept quality = 1', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        quality: '1',
      });

      expect(result.quality).toBe(1);
    });

    it('should accept quality = 100', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        quality: '100',
      });

      expect(result.quality).toBe(100);
    });

    it('should reject quality = 0', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          quality: '0',
        })
      ).toThrow('quality must be an integer between 1 and 100');
    });

    it('should reject quality = 101', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          quality: '101',
        })
      ).toThrow('quality must be an integer between 1 and 100');
    });

    it('should accept quality as optional', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
      });

      expect(result.quality).toBeUndefined();
    });

    it('should reject quality with decimal', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          quality: '80.9',
        })
      ).toThrow('quality must be an integer between 1 and 100');
    });

    it('should reject quality with trailing characters', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          quality: '80abc',
        })
      ).toThrow('quality must be an integer between 1 and 100');
    });

    it('should reject quality in scientific notation', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          quality: '1e2',
        })
      ).toThrow('quality must be an integer between 1 and 100');
    });
  });

  describe('crop validation', () => {
    it('should accept fill crop mode', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        crop: 'fill',
      });

      expect(result.crop).toBe('fill');
    });

    it('should accept fit crop mode', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        crop: 'fit',
      });

      expect(result.crop).toBe('fit');
    });

    it('should accept contain crop mode', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        crop: 'contain',
      });

      expect(result.crop).toBe('contain');
    });

    it('should reject invalid crop mode', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          crop: 'scale',
        })
      ).toThrow('crop must be one of: fill, fit, contain');
    });

    it('should accept crop as optional', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
      });

      expect(result.crop).toBeUndefined();
    });
  });

  describe('combined parameters', () => {
    it('should accept all valid parameters', () => {
      const result = imageProcessingSchema.parse({
        url: 'https://example.com/image.jpg',
        width: '800',
        height: '600',
        format: 'webp',
        quality: '85',
        crop: 'fill',
      });

      expect(result).toEqual({
        url: 'https://example.com/image.jpg',
        width: 800,
        height: 600,
        format: 'webp',
        quality: 85,
        crop: 'fill',
      });
    });

    it('should reject unknown parameters', () => {
      expect(() =>
        imageProcessingSchema.parse({
          url: 'https://example.com/image.jpg',
          unknown: 'parameter',
        })
      ).toThrow();
    });
  });
});
