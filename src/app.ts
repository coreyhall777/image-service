import express, { Request, Response } from 'express';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Image Processing Service API',
    version: '1.0.0',
    status: 'Service is running. Available endpoints will be listed once implemented.',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

export default app;
