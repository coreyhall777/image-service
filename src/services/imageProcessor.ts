import sharp from 'sharp';
import { UnprocessableEntityError } from '../utils/errors.js';

export type ImageFormat = 'jpeg' | 'png' | 'webp';
export type CropMode = 'cover' | 'contain' | 'fill';

export interface ProcessImageOptions {
  width?: number;
  height?: number;
  format?: ImageFormat | 'jpg'; // Accept 'jpg' alias at boundary
  quality?: number;
  crop?: CropMode;
}

export interface ProcessImageResult {
  buffer: Buffer;
  contentType: string;
  width: number;
  height: number;
}

// Map Sharp format to MIME type
const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  tiff: 'image/tiff',
  heif: 'image/heif',
  heic: 'image/heic',
};

// Supported output formats
const SUPPORTED_OUTPUT_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];

function getContentType(format: string | undefined): string {
  if (!format) {
    return 'image/jpeg'; // Default fallback
  }

  const mimeType = FORMAT_TO_MIME[format.toLowerCase()];
  if (!mimeType) {
    throw new UnprocessableEntityError(`Unsupported image format: ${format}`);
  }

  // Reject formats we don't support as output
  if (!SUPPORTED_OUTPUT_FORMATS.includes(format.toLowerCase())) {
    throw new UnprocessableEntityError(
      `Cannot output format ${format}. Supported formats: jpeg, png, webp`
    );
  }

  return mimeType;
}

export class ImageProcessor {
  /**
   * Process an image with the given options
   */
  async process(inputBuffer: Buffer, options: ProcessImageOptions): Promise<ProcessImageResult> {
    // Validate quality upfront
    if (options.quality !== undefined) {
      if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) {
        throw new UnprocessableEntityError('Quality must be an integer between 1 and 100');
      }
    }

    // Normalize format: 'jpg' -> 'jpeg' (Sharp doesn't recognize 'jpg' as output format)
    let normalizedFormat: ImageFormat | undefined = options.format as ImageFormat | undefined;
    if (options.format === 'jpg') {
      normalizedFormat = 'jpeg';
    }

    try {
      let pipeline = sharp(inputBuffer);

      // Apply resizing if width or height specified
      if (options.width || options.height) {
        const resizeOptions: sharp.ResizeOptions = {
          width: options.width,
          height: options.height,
        };

        // Apply crop mode (default: fill)
        if (options.crop) {
          switch (options.crop) {
            case 'cover':
              resizeOptions.fit = 'cover';
              resizeOptions.position = 'center';
              break;
            case 'contain':
              resizeOptions.fit = 'contain';
              resizeOptions.background = { r: 255, g: 255, b: 255, alpha: 0 };
              break;
            case 'fill':
              resizeOptions.fit = 'fill';
              break;
          }
        } else {
          // Default: fill - stretch to exact dimensions
          resizeOptions.fit = 'fill';
        }

        pipeline = pipeline.resize(resizeOptions);
      }

      // Apply format conversion if specified
      if (normalizedFormat) {
        switch (normalizedFormat) {
          case 'jpeg':
            pipeline = pipeline.jpeg({
              quality: options.quality ?? 80,
              mozjpeg: true,
            });
            break;
          case 'png':
            pipeline = pipeline.png({
              quality: options.quality,
              compressionLevel: 9,
            });
            break;
          case 'webp':
            pipeline = pipeline.webp({
              quality: options.quality ?? 80,
            });
            break;
        }
      } else if (options.quality !== undefined) {
        // If quality specified without format, apply to current format
        const metadata = await sharp(inputBuffer).metadata();
        const currentFormat = metadata.format;

        if (currentFormat === 'jpeg') {
          pipeline = pipeline.jpeg({
            quality: options.quality,
            mozjpeg: true,
          });
        } else if (currentFormat === 'webp') {
          pipeline = pipeline.webp({
            quality: options.quality,
          });
        } else if (currentFormat === 'png') {
          pipeline = pipeline.png({
            quality: options.quality,
          });
        }
      }

      // Process the image
      const outputBuffer = await pipeline.toBuffer();
      const metadata = await sharp(outputBuffer).metadata();

      // Determine content type from actual output format
      // Use normalizedFormat if set, otherwise use metadata.format
      const outputFormat = normalizedFormat || metadata.format;
      const contentType = getContentType(outputFormat);

      return {
        buffer: outputBuffer,
        contentType,
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    } catch (error) {
      // Don't wrap validation errors (already thrown above)
      if (error instanceof UnprocessableEntityError) {
        throw error;
      }
      throw new UnprocessableEntityError(
        `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
