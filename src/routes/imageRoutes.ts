import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation.js';
import { imageProcessingSchema } from '../schemas/imageProcessing.schema.js';
import { ImageFetcher } from '../services/imageFetcher.js';
import { ImageProcessor } from '../services/imageProcessor.js';
import { imageCache } from '../services/cache.js';
import { BadRequestError } from '../utils/errors.js';

const router = Router();

/**
 * GET /process
 * Process an image from a URL with optional transformations
 *
 * Query parameters:
 * - url: Image URL (required)
 * - width: Target width in pixels (1-10000)
 * - height: Target height in pixels (1-10000)
 * - format: Output format (jpeg, jpg, png, webp)
 * - quality: Quality 1-100
 * - crop: Crop mode (cover, contain, fill)
 */
router.get(
  '/process',
  validate(imageProcessingSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url, width, height, format, quality, crop } = req.query;

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
        crop: crop as string | undefined,
      });

      // Check cache
      const cached = imageCache.get(cacheKey);
      if (cached) {
        res.set('Content-Type', cached.contentType);
        res.set('Cache-Control', 'public, no-cache');
        res.set('X-Image-Width', cached.metadata.width.toString());
        res.set('X-Image-Height', cached.metadata.height.toString());
        res.set('X-Cache', 'HIT');
        res.send(cached.buffer);
        return;
      }

      // Fetch image
      const imageFetcher = new ImageFetcher();
      const fetchResult = await imageFetcher.fetch(url);

      // Process image
      const imageProcessor = new ImageProcessor();
      const result = await imageProcessor.process(fetchResult.buffer, {
        width: width as number | undefined,
        height: height as number | undefined,
        format: format as 'jpeg' | 'jpg' | 'png' | 'webp' | undefined,
        quality: quality as number | undefined,
        crop: crop as 'cover' | 'contain' | 'fill' | undefined,
      });

      // Store in cache
      imageCache.set(cacheKey, {
        buffer: result.buffer,
        contentType: result.contentType,
        metadata: {
          width: result.width,
          height: result.height,
        },
      });

      // Send response with appropriate headers
      res.set('Content-Type', result.contentType);
      res.set('Cache-Control', 'public, no-cache');
      res.set('X-Image-Width', result.width.toString());
      res.set('X-Image-Height', result.height.toString());
      res.set('X-Cache', 'MISS');
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
