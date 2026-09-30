import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import tmp from 'tmp';
import { writeFile } from 'fs/promises';
import { UnprocessableEntityError } from '../utils/errors.js';
import { CONFIG } from '../utils/constants.js';

export interface VideoThumbnailOptions {
  timestamp?: number; // Time in seconds to extract frame (default: 1)
  width?: number;
  height?: number;
}

export interface VideoThumbnailResult {
  buffer: Buffer;
  contentType: string;
  width: number;
  height: number;
}

/**
 * Video thumbnail extractor using ffmpeg
 */
export class VideoThumbnailExtractor {
  /**
   * Extract thumbnail from video buffer
   */
  async extract(
    videoBuffer: Buffer,
    options: VideoThumbnailOptions = {}
  ): Promise<VideoThumbnailResult> {
    const { timestamp = 1, width, height } = options;

    // Validate timestamp
    if (timestamp < 0) {
      throw new UnprocessableEntityError('Timestamp must be non-negative');
    }

    try {
      const thumbnailBuffer = await this.extractFrameToBuffer(
        videoBuffer,
        timestamp,
        width,
        height
      );

      // Get dimensions from the generated thumbnail
      const dimensions = await this.getImageDimensions(thumbnailBuffer);

      return {
        buffer: thumbnailBuffer,
        contentType: 'image/jpeg',
        width: dimensions.width,
        height: dimensions.height,
      };
    } catch (error) {
      if (error instanceof UnprocessableEntityError) {
        throw error;
      }
      throw new UnprocessableEntityError(
        `Failed to extract video thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract frame from video buffer to buffer using a temporary file
   * (required for MP4/MOV files where moov atom may be at the end)
   */
  private extractFrameToBuffer(
    videoBuffer: Buffer,
    timestamp: number,
    width?: number,
    height?: number
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Create a temporary file for the video
      tmp.file({ postfix: '.mp4' }, async (err, path, _fd, cleanupCallback) => {
        if (err) {
          reject(new UnprocessableEntityError(`Failed to create temp file: ${err.message}`));
          return;
        }

        try {
          // Write video buffer to temp file
          await writeFile(path, videoBuffer);

          const chunks: Buffer[] = [];

          let command = ffmpeg(path)
            .inputOptions(`-ss ${timestamp}`) // Seek to exact timestamp
            .frames(1)
            .outputFormat('image2')
            .outputOptions('-f', 'image2pipe')
            .outputOptions('-vcodec', 'mjpeg');

          // Add resize if dimensions specified
          if (width || height) {
            const scale = this.buildScaleFilter(width, height);
            command = command.outputOptions('-vf', scale);
          }

          // Set timeout
          const timeoutId = setTimeout(() => {
            command.kill('SIGKILL');
            cleanupCallback();
            reject(
              new UnprocessableEntityError(
                `Video thumbnail extraction timeout after ${CONFIG.REQUEST_TIMEOUT}ms`
              )
            );
          }, CONFIG.REQUEST_TIMEOUT);

          command
            .on('error', (err) => {
              clearTimeout(timeoutId);
              cleanupCallback();
              reject(new UnprocessableEntityError(`FFmpeg error: ${err.message}`));
            })
            .on('end', () => {
              clearTimeout(timeoutId);
              cleanupCallback();
              const out = Buffer.concat(chunks);
              if (out.length === 0) {
                reject(new UnprocessableEntityError('No frame at requested timestamp'));
                return;
              }
              resolve(out);
            })
            .pipe()
            .on('data', (chunk: Buffer) => {
              chunks.push(chunk);
            })
            .on('error', (err: Error) => {
              clearTimeout(timeoutId);
              cleanupCallback();
              reject(new UnprocessableEntityError(`Stream error: ${err.message}`));
            });
        } catch (error) {
          cleanupCallback();
          reject(
            new UnprocessableEntityError(
              `Failed to process temp file: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      });
    });
  }

  /**
   * Build ffmpeg scale filter
   */
  private buildScaleFilter(width?: number, height?: number): string {
    if (width && height) {
      return `scale=${width}:${height}`;
    } else if (width) {
      return `scale=${width}:-1`;
    } else if (height) {
      return `scale=-1:${height}`;
    }
    return 'scale=-1:-1';
  }

  /**
   * Get image dimensions using ffmpeg
   */
  private getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const imageStream = Readable.from(imageBuffer);

      ffmpeg(imageStream).ffprobe((err, metadata) => {
        if (err) {
          reject(new UnprocessableEntityError(`Failed to get image dimensions: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        if (!videoStream || !videoStream.width || !videoStream.height) {
          reject(new UnprocessableEntityError('Could not determine image dimensions'));
          return;
        }

        resolve({
          width: videoStream.width,
          height: videoStream.height,
        });
      });
    });
  }
}
