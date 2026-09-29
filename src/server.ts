import app from './app.js';
import { CONFIG } from './utils/constants.js';

const PORT = CONFIG.PORT;

const server = app.listen(PORT, () => {
  console.info(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.info(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
