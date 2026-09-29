import { z } from 'zod';
import { CONFIG } from '../utils/constants.js';

/**
 * Schema for image processing query parameters
 */
export const imageProcessingSchema = z
  .object({
    url: z
      .string({
        required_error: 'url parameter is required',
        invalid_type_error: 'url must be a string',
      })
      .url('url must be a valid URL')
      .refine(
        (url) => {
          // Only allow HTTP and HTTPS protocols
          return url.startsWith('http://') || url.startsWith('https://');
        },
        {
          message: 'url must point to an image (http/https protocol required)',
        }
      ),

    width: z
      .string()
      .regex(/^\d+$/, 'width must be a positive integer between 1 and 10000')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (val > 0 && val <= 10000), {
        message: 'width must be a positive integer between 1 and 10000',
      }),

    height: z
      .string()
      .regex(/^\d+$/, 'height must be a positive integer between 1 and 10000')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (val > 0 && val <= 10000), {
        message: 'height must be a positive integer between 1 and 10000',
      }),

    format: z
      .enum(['jpeg', 'jpg', 'png', 'webp'], {
        errorMap: () => ({
          message: 'format must be one of: jpeg, jpg, png, webp',
        }),
      })
      .optional(),

    quality: z
      .string()
      .regex(
        /^\d+$/,
        `quality must be an integer between ${CONFIG.MIN_QUALITY} and ${CONFIG.MAX_QUALITY}`
      )
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine(
        (val) => val === undefined || (val >= CONFIG.MIN_QUALITY && val <= CONFIG.MAX_QUALITY),
        {
          message: `quality must be an integer between ${CONFIG.MIN_QUALITY} and ${CONFIG.MAX_QUALITY}`,
        }
      ),

    crop: z
      .enum(['fill', 'fit', 'contain'], {
        errorMap: () => ({
          message: 'crop must be one of: fill, fit, contain',
        }),
      })
      .optional(),
  })
  .strict(); // Reject unknown query parameters

/**
 * TypeScript type inferred from schema
 */
export type ImageProcessingParams = z.infer<typeof imageProcessingSchema>;
