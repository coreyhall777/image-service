export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Image Processing Service API',
    version: '1.0.0',
    description:
      'A Cloudinary-style image processing service that provides URL-based image manipulation and video thumbnail extraction.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current server',
    },
  ],
  tags: [
    {
      name: 'Image Processing',
      description: 'Image manipulation operations',
    },
    {
      name: 'Video Processing',
      description: 'Video thumbnail extraction operations',
    },
  ],
  paths: {
    '/process': {
      get: {
        tags: ['Image Processing'],
        summary: 'Process an image from URL',
        description:
          'Fetch an image from a URL and apply transformations such as resizing, format conversion, quality adjustment, and cropping.',
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            description: 'Image URL to process (HTTP or HTTPS)',
            schema: {
              type: 'string',
              format: 'uri',
              example: 'https://picsum.photos/1920/1080',
            },
          },
          {
            name: 'width',
            in: 'query',
            description: 'Target width in pixels (1-10000)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 800,
            },
          },
          {
            name: 'height',
            in: 'query',
            description: 'Target height in pixels (1-10000)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 600,
            },
          },
          {
            name: 'format',
            in: 'query',
            description: 'Output image format',
            schema: {
              type: 'string',
              enum: ['jpeg', 'jpg', 'png', 'webp'],
              example: 'webp',
            },
          },
          {
            name: 'quality',
            in: 'query',
            description: 'Image quality (1-100, only for JPEG/WebP)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              example: 80,
            },
          },
          {
            name: 'crop',
            in: 'query',
            description:
              'Crop mode: fill (stretch to exact dimensions), cover (crop to fill maintaining aspect ratio), contain (fit within dimensions maintaining aspect ratio)',
            schema: {
              type: 'string',
              enum: ['fill', 'cover', 'contain'],
              default: 'fill',
              example: 'cover',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successfully processed image',
            headers: {
              'Content-Type': {
                description: 'MIME type of the processed image',
                schema: {
                  type: 'string',
                  example: 'image/webp',
                },
              },
              'Cache-Control': {
                description: 'Cache directives',
                schema: {
                  type: 'string',
                  example: 'public, no-cache',
                },
              },
              'X-Image-Width': {
                description: 'Width of the output image in pixels',
                schema: {
                  type: 'integer',
                  example: 800,
                },
              },
              'X-Image-Height': {
                description: 'Height of the output image in pixels',
                schema: {
                  type: 'integer',
                  example: 600,
                },
              },
              'X-Cache': {
                description: 'Cache status',
                schema: {
                  type: 'string',
                  enum: ['HIT', 'MISS'],
                  example: 'MISS',
                },
              },
              'X-Source-Type': {
                description: 'Type of source content',
                schema: {
                  type: 'string',
                  example: 'image',
                },
              },
            },
            content: {
              'image/jpeg': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
              'image/png': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
              'image/webp': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          '400': {
            description: 'Bad Request - Invalid parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                examples: {
                  invalidUrl: {
                    value: {
                      error: 'BadRequestError',
                      message: 'Invalid URL format',
                    },
                  },
                  invalidWidth: {
                    value: {
                      error: 'BadRequestError',
                      message: 'width must be a positive integer between 1 and 10000',
                    },
                  },
                },
              },
            },
          },
          '422': {
            description: 'Unprocessable Entity - Processing failed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                examples: {
                  unsupportedFormat: {
                    value: {
                      error: 'UnprocessableEntityError',
                      message: 'Unsupported content type: application/pdf',
                    },
                  },
                  timeout: {
                    value: {
                      error: 'UnprocessableEntityError',
                      message: 'Request timeout: Total fetch time exceeded 10000ms',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/video/thumbnail': {
      get: {
        tags: ['Video Processing'],
        summary: 'Extract thumbnail from video',
        description:
          'Extract a frame from a video at a specified timestamp and optionally apply transformations.',
        parameters: [
          {
            name: 'url',
            in: 'query',
            required: true,
            description: 'Video URL to extract frame from (HTTP or HTTPS)',
            schema: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/video.mp4',
            },
          },
          {
            name: 'time',
            in: 'query',
            description: 'Time in seconds to extract frame (default: 1)',
            schema: {
              type: 'number',
              format: 'float',
              minimum: 0,
              example: 15,
            },
          },
          {
            name: 'width',
            in: 'query',
            description: 'Target width in pixels (1-10000)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 640,
            },
          },
          {
            name: 'height',
            in: 'query',
            description: 'Target height in pixels (1-10000)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 10000,
              example: 360,
            },
          },
          {
            name: 'format',
            in: 'query',
            description: 'Output image format',
            schema: {
              type: 'string',
              enum: ['jpeg', 'jpg', 'png', 'webp'],
              example: 'jpeg',
            },
          },
          {
            name: 'quality',
            in: 'query',
            description: 'Image quality (1-100, only for JPEG/WebP)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              example: 80,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successfully extracted video thumbnail',
            headers: {
              'Content-Type': {
                description: 'MIME type of the thumbnail image',
                schema: {
                  type: 'string',
                  example: 'image/jpeg',
                },
              },
              'Cache-Control': {
                description: 'Cache directives',
                schema: {
                  type: 'string',
                  example: 'public, no-cache',
                },
              },
              'X-Image-Width': {
                description: 'Width of the output image in pixels',
                schema: {
                  type: 'integer',
                  example: 640,
                },
              },
              'X-Image-Height': {
                description: 'Height of the output image in pixels',
                schema: {
                  type: 'integer',
                  example: 360,
                },
              },
              'X-Cache': {
                description: 'Cache status',
                schema: {
                  type: 'string',
                  enum: ['HIT', 'MISS'],
                  example: 'MISS',
                },
              },
              'X-Source-Type': {
                description: 'Type of source content',
                schema: {
                  type: 'string',
                  example: 'video',
                },
              },
            },
            content: {
              'image/jpeg': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
              'image/png': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
              'image/webp': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
          '400': {
            description: 'Bad Request - Invalid parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                examples: {
                  invalidTime: {
                    value: {
                      error: 'BadRequestError',
                      message: 'time must be non-negative',
                    },
                  },
                },
              },
            },
          },
          '422': {
            description: 'Unprocessable Entity - Processing failed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
                examples: {
                  noFrame: {
                    value: {
                      error: 'UnprocessableEntityError',
                      message: 'No frame at requested timestamp',
                    },
                  },
                  unsupportedVideo: {
                    value: {
                      error: 'UnprocessableEntityError',
                      message: 'Unsupported content type: text/html',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error type',
            example: 'BadRequestError',
          },
          message: {
            type: 'string',
            description: 'Detailed error message',
            example: 'Invalid URL format',
          },
        },
      },
    },
  },
};
