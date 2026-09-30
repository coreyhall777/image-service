import https from 'https';
import http from 'http';
import { URL } from 'url';
import { CONFIG } from '../utils/constants.js';
import { BadRequestError, UnprocessableEntityError } from '../utils/errors.js';

export interface FetchImageResult {
  buffer: Buffer;
  contentType: string;
  contentLength: number;
}

export interface FetchOptions {
  allowedContentTypes?: string[];
}

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const DEFAULT_ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class ImageFetcher {
  /**
   * Fetch an image from a URL with validation and size limits
   */
  async fetch(urlString: string, options: FetchOptions = {}): Promise<FetchImageResult> {
    const allowedContentTypes = options.allowedContentTypes || DEFAULT_ALLOWED_CONTENT_TYPES;
    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlString);
    } catch (error) {
      throw new BadRequestError('Invalid URL format');
    }

    // Validate protocol
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      throw new BadRequestError(
        `Unsupported protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are allowed`
      );
    }

    return new Promise((resolve, reject) => {
      const client = parsedUrl.protocol === 'https:' ? https : http;
      let rejected = false;
      let totalDeadlineTimer: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (totalDeadlineTimer) {
          clearTimeout(totalDeadlineTimer);
          totalDeadlineTimer = null;
        }
      };

      const safeReject = (error: Error) => {
        if (!rejected) {
          rejected = true;
          cleanup();
          reject(error);
        }
      };

      const safeResolve = (result: FetchImageResult) => {
        if (!rejected) {
          cleanup();
          resolve(result);
        }
      };

      let request: http.ClientRequest;

      try {
        request = client.get(
          urlString,
          {
            headers: {
              'User-Agent': 'ImageProcessingService/1.0',
            },
          },
          (response) => {
            // Handle redirects
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
              request.destroy();
              safeReject(
                new BadRequestError(
                  'URL redirects are not supported. Please provide the direct image URL'
                )
              );
              return;
            }

            // Check HTTP status
            if (!response.statusCode || response.statusCode !== 200) {
              request.destroy();
              safeReject(
                new UnprocessableEntityError(
                  `Failed to fetch image: HTTP ${response.statusCode || 'error'}`
                )
              );
              return;
            }

            // Validate content type
            const contentType = response.headers['content-type']?.toLowerCase() || '';
            const mediaType = contentType.split(';')[0].trim();
            if (!allowedContentTypes.includes(mediaType)) {
              request.destroy();
              safeReject(new UnprocessableEntityError(`Unsupported content type: ${contentType}`));
              return;
            }

            // Check content length header if available
            const contentLength = response.headers['content-length']
              ? parseInt(response.headers['content-length'], 10)
              : null;

            if (contentLength && contentLength > CONFIG.MAX_IMAGE_SIZE) {
              request.destroy();
              safeReject(
                new UnprocessableEntityError(
                  `Image size (${contentLength} bytes) exceeds maximum allowed size (${CONFIG.MAX_IMAGE_SIZE} bytes)`
                )
              );
              return;
            }

            // Collect response data
            const chunks: Buffer[] = [];
            let receivedBytes = 0;

            response.on('data', (chunk: Buffer) => {
              if (rejected) return;

              receivedBytes += chunk.length;

              // Check size limit during download
              if (receivedBytes > CONFIG.MAX_IMAGE_SIZE) {
                request.destroy();
                safeReject(
                  new UnprocessableEntityError(
                    `Image size exceeds maximum allowed size (${CONFIG.MAX_IMAGE_SIZE} bytes)`
                  )
                );
                return;
              }

              chunks.push(chunk);
            });

            response.on('end', () => {
              if (rejected) return;

              const buffer = Buffer.concat(chunks);
              safeResolve({
                buffer,
                contentType: contentType.split(';')[0].trim(),
                contentLength: buffer.length,
              });
            });

            response.on('error', (error) => {
              safeReject(
                new UnprocessableEntityError(`Failed to download image: ${error.message}`)
              );
            });
          }
        );

        request.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOTFOUND') {
            safeReject(new BadRequestError('URL host not found'));
          } else if (error.code === 'ECONNREFUSED') {
            safeReject(new BadRequestError('Connection refused by host'));
          } else if (error.code === 'ETIMEDOUT') {
            safeReject(new UnprocessableEntityError('Connection timeout'));
          } else {
            safeReject(new UnprocessableEntityError(`Failed to fetch image: ${error.message}`));
          }
        });

        // Set total deadline timer after request is created
        totalDeadlineTimer = setTimeout(() => {
          request.destroy();
          safeReject(
            new UnprocessableEntityError(
              `Request timeout: Total fetch time exceeded ${CONFIG.REQUEST_TIMEOUT}ms`
            )
          );
        }, CONFIG.REQUEST_TIMEOUT);
      } catch (error) {
        cleanup();
        reject(
          new UnprocessableEntityError(
            `Failed to create request: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
      }
    });
  }
}
