import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import imageRoutes from './routes/imageRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import { swaggerDocument } from './swagger.js';

const app = express();

// Request logger (before body parsers to ensure all requests are logged)
app.use(requestLogger);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use(imageRoutes);
app.use('/video', videoRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Image Processing Service API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      process:
        'GET /process?url=<image-url>&width=<w>&height=<h>&format=<fmt>&quality=<q>&crop=<mode>',
      videoThumbnail:
        'GET /video/thumbnail?url=<video-url>&time=<t>&width=<w>&height=<h>&format=<fmt>&quality=<q>',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
