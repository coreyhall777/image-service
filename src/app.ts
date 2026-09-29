import express, { Request, Response } from 'express';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import imageRoutes from './routes/imageRoutes.js';

const app = express();

// Request logger (before body parsers to ensure all requests are logged)
app.use(requestLogger);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(imageRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Image Processing Service API',
    version: '1.0.0',
    endpoints: {
      process:
        'GET /process?url=<image-url>&width=<w>&height=<h>&format=<fmt>&quality=<q>&crop=<mode>',
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
