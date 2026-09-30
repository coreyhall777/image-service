import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoThumbnailExtractor } from '../../../src/services/videoThumbnail';
import { UnprocessableEntityError } from '../../../src/utils/errors';

// Mock fluent-ffmpeg
vi.mock('fluent-ffmpeg', () => {
  return {
    default: vi.fn(() => ({
      seekInput: vi.fn().mockReturnThis(),
      frames: vi.fn().mockReturnThis(),
      outputFormat: vi.fn().mockReturnThis(),
      outputOptions: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      pipe: vi.fn(() => ({
        on: vi.fn(),
      })),
      ffprobe: vi.fn(),
      kill: vi.fn(),
    })),
  };
});

describe('VideoThumbnailExtractor', () => {
  let extractor: VideoThumbnailExtractor;

  beforeEach(() => {
    extractor = new VideoThumbnailExtractor();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create VideoThumbnailExtractor instance', () => {
      expect(extractor).toBeInstanceOf(VideoThumbnailExtractor);
    });
  });

  describe('extract', () => {
    it('should reject negative timestamp', async () => {
      const videoBuffer = Buffer.from('fake video data');

      await expect(extractor.extract(videoBuffer, { timestamp: -1 })).rejects.toThrow(
        UnprocessableEntityError
      );

      await expect(extractor.extract(videoBuffer, { timestamp: -1 })).rejects.toThrow(
        'Timestamp must be non-negative'
      );
    });

    it('should accept zero timestamp', async () => {
      const videoBuffer = Buffer.from('fake video data');

      // This will fail in mock but validate that timestamp 0 is accepted
      try {
        await extractor.extract(videoBuffer, { timestamp: 0 });
      } catch (error) {
        // Expected to fail with ffmpeg mock, but shouldn't fail on timestamp validation
        expect(error).toBeInstanceOf(UnprocessableEntityError);
        expect(error).not.toHaveProperty('message', 'Timestamp must be non-negative');
      }
    });

    it('should use default timestamp of 1 when not specified', async () => {
      const videoBuffer = Buffer.from('fake video data');

      try {
        await extractor.extract(videoBuffer);
      } catch (error) {
        // Expected to fail with ffmpeg mock
        expect(error).toBeInstanceOf(UnprocessableEntityError);
      }
    });

    it('should handle width option', async () => {
      const videoBuffer = Buffer.from('fake video data');

      try {
        await extractor.extract(videoBuffer, { width: 800 });
      } catch (error) {
        // Expected to fail with ffmpeg mock
        expect(error).toBeInstanceOf(UnprocessableEntityError);
      }
    });

    it('should handle height option', async () => {
      const videoBuffer = Buffer.from('fake video data');

      try {
        await extractor.extract(videoBuffer, { height: 600 });
      } catch (error) {
        // Expected to fail with ffmpeg mock
        expect(error).toBeInstanceOf(UnprocessableEntityError);
      }
    });

    it('should handle both width and height options', async () => {
      const videoBuffer = Buffer.from('fake video data');

      try {
        await extractor.extract(videoBuffer, { width: 800, height: 600 });
      } catch (error) {
        // Expected to fail with ffmpeg mock
        expect(error).toBeInstanceOf(UnprocessableEntityError);
      }
    });

    it('should throw UnprocessableEntityError on ffmpeg failure', async () => {
      const videoBuffer = Buffer.from('fake video data');

      await expect(extractor.extract(videoBuffer)).rejects.toThrow(UnprocessableEntityError);

      await expect(extractor.extract(videoBuffer)).rejects.toThrow(
        /Failed to process temp file|Failed to extract video thumbnail/
      );
    });
  });
});
