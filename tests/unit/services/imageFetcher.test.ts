import { describe, it, expect } from 'vitest';
import { ImageFetcher } from '../../../src/services/imageFetcher';
import { BadRequestError } from '../../../src/utils/errors';

describe('ImageFetcher', () => {
  const fetcher = new ImageFetcher();

  describe('URL validation', () => {
    it('should reject invalid URL format', async () => {
      await expect(fetcher.fetch('not-a-url')).rejects.toThrow(BadRequestError);
      await expect(fetcher.fetch('not-a-url')).rejects.toThrow('Invalid URL format');
    });

    it('should reject empty string', async () => {
      await expect(fetcher.fetch('')).rejects.toThrow(BadRequestError);
    });

    it('should reject unsupported protocol (ftp)', async () => {
      await expect(fetcher.fetch('ftp://example.com/image.jpg')).rejects.toThrow(BadRequestError);
      await expect(fetcher.fetch('ftp://example.com/image.jpg')).rejects.toThrow(
        'Unsupported protocol'
      );
    });

    it('should reject file protocol', async () => {
      await expect(fetcher.fetch('file:///path/to/image.jpg')).rejects.toThrow(BadRequestError);
      await expect(fetcher.fetch('file:///path/to/image.jpg')).rejects.toThrow(
        'Unsupported protocol'
      );
    });

    it('should reject ws protocol', async () => {
      await expect(fetcher.fetch('ws://example.com/socket')).rejects.toThrow(BadRequestError);
    });

    it('should reject data URLs', async () => {
      await expect(fetcher.fetch('data:image/png;base64,iVBORw0KG')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('Instance', () => {
    it('should create instance', () => {
      expect(fetcher).toBeInstanceOf(ImageFetcher);
    });

    it('should have fetch method', () => {
      expect(typeof fetcher.fetch).toBe('function');
    });
  });
});
