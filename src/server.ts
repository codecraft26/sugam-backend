import "reflect-metadata"; // Required for TypeORM decorators
import app from "./app";
import { config } from "./config/env";
import { logger } from "./config/logger";
import { initializeDatabase, closeDatabase } from "./config/db";
import { loadCache } from "./loaders/cache.loader";
import { closeRedis } from "./config/cache";
import { loadEmail } from "./loaders/email.loader";
import { closeEmailQueue } from "./core/email/email.queue";

// Start server using config from env.ts
const port = parseInt(config.PORT, 10);

// Initialize database before starting server
let server: any;

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Initialize Redis cache
    await loadCache();

    // Initialize email service and queue
    await loadEmail();

    // Start HTTP server
    server = app.listen(port, () => {
      logger.info(`🚀 Server is running at http://localhost:${port}`);
      logger.info(`📝 Environment: ${config.NODE_ENV}`);
      logger.info(`📊 Log Level: ${config.LOG_LEVEL || (config.NODE_ENV === 'production' ? 'info' : 'debug')}`);
    });

    // Handle server errors
    server.on('error', (error: Error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // Close email queue
        await closeEmailQueue();
        
        // Close Redis connection
        await closeRedis();
        
        // Close database connection
        await closeDatabase();
        logger.info('All connections closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
