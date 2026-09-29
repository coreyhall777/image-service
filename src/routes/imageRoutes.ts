import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation.js';
import { imageProcessingSchema } from '../schemas/imageProcessing.schema.js';
import { ImageFetcher } from '../services/imageFetcher.js';
import { ImageProcessor } from '../services/imageProcessor.js';
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

      // Send response with appropriate headers
      res.set('Content-Type', result.contentType);
      res.set('Cache-Control', 'public, no-cache');
      res.set('X-Image-Width', result.width.toString());
      res.set('X-Image-Height', result.height.toString());
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
