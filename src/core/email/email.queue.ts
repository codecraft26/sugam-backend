// Email queue configuration using Bull with Redis
import Queue from 'bull';
import { redisClient } from '../../config/cache';
import { logger } from '../../config/logger';

// Email queue name
export const EMAIL_QUEUE_NAME = 'email';

// Create email queue
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds delay
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Queue event handlers
emailQueue.on('error', (error) => {
  logger.error('Email queue error:', error);
});

emailQueue.on('waiting', (jobId) => {
  logger.debug(`Email job ${jobId} is waiting`);
});

emailQueue.on('active', (job) => {
  logger.info(`Processing email job ${job.id}: ${job.data.to}`);
});

emailQueue.on('completed', (job, result) => {
  logger.info(`Email job ${job.id} completed: ${job.data.to}`);
});

emailQueue.on('failed', (job, error) => {
  logger.error(`Email job ${job?.id} failed: ${job?.data.to}`, error);
});

emailQueue.on('stalled', (jobId) => {
  logger.warn(`Email job ${jobId} stalled`);
});

/**
 * Close email queue connection
 */
export async function closeEmailQueue(): Promise<void> {
  try {
    await emailQueue.close();
    logger.info('✅ Email queue closed');
  } catch (error: any) {
    logger.error('Error closing email queue:', error);
  }
}

