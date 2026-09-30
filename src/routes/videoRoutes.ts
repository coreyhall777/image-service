import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation.js';
import { videoThumbnailSchema } from '../schemas/videoThumbnail.schema.js';
import { ImageFetcher } from '../services/imageFetcher.js';
import { VideoThumbnailExtractor } from '../services/videoThumbnail.js';
import { ImageProcessor } from '../services/imageProcessor.js';
import { imageCache } from '../services/cache.js';
import { BadRequestError } from '../utils/errors.js';

const router = Router();

/**
 * GET /video/thumbnail
 * Extract thumbnail from a video URL
 *
 * Query parameters:
 * - url: Video URL (required)
 * - time: Time in seconds to extract frame (default: 1)
 * - width: Target width in pixels (1-10000)
 * - height: Target height in pixels (1-10000)
 * - format: Output format (jpeg, jpg, png, webp)
 * - quality: Quality 1-100
 */
router.get(
  '/thumbnail',
  validate(videoThumbnailSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url, time, width, height, format, quality } = req.query;

      if (!url || typeof url !== 'string') {
        throw new BadRequestError('URL parameter is required');
      }

      // Generate cache key
      const cacheKey = imageCache.generateKey({
        url,
        width: width as number | undefined,
        height: height as number | undefined,
        format: format as string | undefined,
        quality: quality as number | undefined,
        crop: `video_${time ?? 1}`, // Include time in cache key (use ?? to handle time=0)
      });

      // Check cache
      const cached = imageCache.get(cacheKey);
      if (cached) {
        res.set('Content-Type', cached.contentType);
        res.set('Cache-Control', 'public, no-cache');
        res.set('X-Image-Width', cached.metadata.width.toString());
        res.set('X-Image-Height', cached.metadata.height.toString());
        res.set('X-Cache', 'HIT');
        res.set('X-Source-Type', 'video');
        res.send(cached.buffer);
        return;
      }

      // Fetch video
      const imageFetcher = new ImageFetcher();
      const fetchResult = await imageFetcher.fetch(url, {
        allowedContentTypes: [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/x-matroska',
          'video/webm',
        ],
      });

      // Extract thumbnail from video
      const videoExtractor = new VideoThumbnailExtractor();
      const thumbnailResult = await videoExtractor.extract(fetchResult.buffer, {
        timestamp: time as number | undefined,
        width: width as number | undefined,
        height: height as number | undefined,
      });

      // Post-process thumbnail if format or quality specified
      let finalBuffer = thumbnailResult.buffer;
      let finalContentType = thumbnailResult.contentType;
      let finalWidth = thumbnailResult.width;
      let finalHeight = thumbnailResult.height;

      if (format || quality) {
        const imageProcessor = new ImageProcessor();
        const processed = await imageProcessor.process(thumbnailResult.buffer, {
          format: format as 'jpeg' | 'jpg' | 'png' | 'webp' | undefined,
          quality: quality as number | undefined,
        });

        finalBuffer = processed.buffer;
        finalContentType = processed.contentType;
        finalWidth = processed.width;
        finalHeight = processed.height;
      }

      // Store in cache
      imageCache.set(cacheKey, {
        buffer: finalBuffer,
        contentType: finalContentType,
        metadata: {
          width: finalWidth,
          height: finalHeight,
        },
      });

      // Send response
      res.set('Content-Type', finalContentType);
      res.set('Cache-Control', 'public, no-cache');
      res.set('X-Image-Width', finalWidth.toString());
      res.set('X-Image-Height', finalHeight.toString());
      res.set('X-Cache', 'MISS');
      res.set('X-Source-Type', 'video');
      res.send(finalBuffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
