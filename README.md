# Image Processing Service

A Cloudinary-style image processing service built with TypeScript, Express, Sharp, and FFmpeg. Provides URL-based image manipulation and video thumbnail extraction.

## Features

### Image Processing
- Resize images to specified dimensions
- Format conversion (JPEG, PNG, WebP)
- Quality adjustment (1-100)
- Multiple crop modes (fill, cover, contain)

### Video Processing (Bonus Feature)
- Extract thumbnails from videos at specific timestamps
- Support for MP4, MPEG, QuickTime, AVI, MKV, WebM
- Apply same transformations as images

### Additional Features
- LRU caching for improved performance
- Comprehensive error handling
- Input validation with detailed error messages
- Request timeout protection
- Configurable size limits

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **FFmpeg** v4.0 or higher (for video thumbnail extraction)

### Installing FFmpeg

**Windows:**
```powershell
choco install ffmpeg
# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

Verify FFmpeg installation:
```bash
ffmpeg -version
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment (Optional)

Copy `.env.example` to `.env` and adjust settings if needed:

```bash
cp .env.example .env
```

Default configuration works out of the box:
```env
PORT=3000
MAX_IMAGE_SIZE=50000000     # 50MB
REQUEST_TIMEOUT=60000       # 60 seconds
CACHE_MAX_SIZE=100          # Max cached items
CACHE_TTL=3600000           # 1 hour
```

### 3. Build and Start

```bash
# Build TypeScript
npm run build

# Start the service
npm start
```

The service will be available at `http://localhost:3000`

### 4. View API Documentation

Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

Interactive Swagger UI documentation with all endpoints, parameters, and examples.

## API Examples

### Image Processing

Resize an image:
```bash
curl "http://localhost:3000/process?url=https://picsum.photos/1920/1080&width=800&height=600" -o resized.jpg
```

Convert format and adjust quality:
```bash
curl "http://localhost:3000/process?url=https://picsum.photos/1920/1080&format=webp&quality=80" -o converted.webp
```

Combine multiple operations:
```bash
curl "http://localhost:3000/process?url=https://picsum.photos/1920/1080&width=800&height=600&format=webp&quality=85&crop=cover" -o processed.webp
```

### Video Thumbnail Extraction

Extract frame at 15 seconds:
```bash
curl "http://localhost:3000/video/thumbnail?url=https://example.com/video.mp4&time=15" -o thumbnail.jpg
```

Extract and resize:
```bash
curl "http://localhost:3000/video/thumbnail?url=https://example.com/video.mp4&time=30&width=640&height=360&format=webp" -o thumbnail.webp
```

## API Endpoints

### `GET /process`

Process an image from a URL.

**Query Parameters:**
- `url` (required): Image URL (HTTP/HTTPS)
- `width` (optional): Target width (1-10000 pixels)
- `height` (optional): Target height (1-10000 pixels)
- `format` (optional): Output format - `jpeg`, `jpg`, `png`, `webp`
- `quality` (optional): Compression quality (1-100)
- `crop` (optional): Crop mode - `fill` (default), `cover`, `contain`

**Response Headers:**
- `X-Cache`: Cache status (`HIT` or `MISS`)
- `X-Image-Width`: Output image width
- `X-Image-Height`: Output image height
- `X-Source-Type`: `image`

### `GET /video/thumbnail`

Extract a thumbnail from a video.

**Query Parameters:**
- `url` (required): Video URL (HTTP/HTTPS)
- `time` (optional): Time in seconds (default: 1)
- `width` (optional): Target width (1-10000 pixels)
- `height` (optional): Target height (1-10000 pixels)
- `format` (optional): Output format - `jpeg`, `jpg`, `png`, `webp`
- `quality` (optional): Compression quality (1-100)

**Response Headers:**
- `X-Cache`: Cache status (`HIT` or `MISS`)
- `X-Image-Width`: Output image width
- `X-Image-Height`: Output image height
- `X-Source-Type`: `video`

## Crop Modes

- **fill** (default): Stretches image to exact dimensions (may distort aspect ratio)
- **cover**: Crops to fill dimensions while maintaining aspect ratio
- **contain**: Fits image within dimensions while maintaining aspect ratio

## Testing

### Run All Tests

```bash
npm test
```

The test suite includes:
- **Unit Tests**: Services, utilities, schemas, middleware
- **Integration Tests**: API endpoints, error handling
- **182 Total Tests** with comprehensive coverage

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Linter

```bash
npm run lint
```

## Error Handling

The API returns appropriate HTTP status codes with detailed error messages:

**400 Bad Request** - Invalid parameters:
```json
{
  "error": "BadRequestError",
  "message": "width must be a positive integer between 1 and 10000"
}
```

**422 Unprocessable Entity** - Processing failures:
```json
{
  "error": "UnprocessableEntityError",
  "message": "Unsupported content type: application/pdf"
}
```

**499 Client Closed Request** - Client disconnected during processing

**500 Internal Server Error** - Unexpected server errors

## Project Structure

```
image-service/
├── src/
│   ├── middleware/       # Request logger, error handler, validation
│   ├── routes/          # API route definitions
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # Core business logic
│   │   ├── cache.ts          # LRU cache implementation
│   │   ├── imageFetcher.ts   # Fetch images from URLs
│   │   ├── imageProcessor.ts # Image processing with Sharp
│   │   └── videoThumbnail.ts # Video frame extraction with FFmpeg
│   ├── utils/           # Constants, errors, helpers
│   ├── swagger.ts       # OpenAPI/Swagger specification
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── tests/
│   ├── integration/     # API and middleware integration tests
│   └── unit/           # Unit tests for all services
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Image Processing**: Sharp (high-performance image processing)
- **Video Processing**: FFmpeg via fluent-ffmpeg
- **Validation**: Zod (type-safe validation)
- **Testing**: Vitest (fast unit test framework)
- **API Documentation**: Swagger UI with OpenAPI 3.0
- **Linting**: ESLint with TypeScript support

## Implementation Notes

### Design Decisions

1. **LRU Caching**: Implemented in-memory LRU cache for processed images to improve response times for repeated requests.

2. **Temporary Files for Video Processing**: Videos are written to temporary files before processing to support MP4/MOV files where the moov atom is at the end of the file (common in phone recordings).

3. **Exact MIME Type Matching**: Content-Type validation uses exact matching (not prefix) to prevent security issues with malformed MIME types.

4. **Nullish Coalescing for Parameters**: Used `??` operator instead of `||` to properly handle `0` values (e.g., `time=0` for video thumbnails).

5. **Comprehensive Validation**: All inputs are validated using Zod schemas with detailed error messages for better developer experience.

6. **Timeout Protection**: Both idle timeout and total deadline timeout to prevent hanging requests.

### Edge Cases Handled

- Empty or invalid URLs
- Unsupported content types
- File size exceeding limits
- Network timeouts and connection failures
- Video timestamps beyond duration
- Empty frame buffers
- Client disconnections during processing
- Malformed query parameters
- Cache key collisions

### Performance Considerations

- Streaming for large files to minimize memory usage
- Sharp's automatic format detection and optimization
- Cached results served with proper headers
- Configurable cache size and TTL
- Request timeouts to prevent resource exhaustion

## Development

### Run in Development Mode

```bash
npm run dev
```

### Format Code

```bash
npm run format
```

### Check Types

```bash
npx tsc --noEmit
```

## Troubleshooting

### FFmpeg Not Found

**Error:** `Video thumbnails fail with FFmpeg errors`

**Solution:** 
- Verify FFmpeg is installed: `ffmpeg -version`
- On Windows, ensure FFmpeg is in your system PATH
- Restart your terminal after installing FFmpeg

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:** 
- Change the port in `.env` file: `PORT=8080`
- Or kill the process using port 3000

### Tests Failing on Clean Checkout

**Solution:**
- Run `npm install` to ensure all dependencies are installed
- The `pretest` script will automatically build before running tests

### Video Processing Slow/Timeout

**Solution:**
- Increase `REQUEST_TIMEOUT` in `.env` (e.g., `REQUEST_TIMEOUT=120000` for 2 minutes)
- For large videos, consider increasing `MAX_IMAGE_SIZE` as well
