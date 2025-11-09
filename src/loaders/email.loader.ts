// Email loader - initializes email service and queue
import { initializeEmailTransporter, verifyEmailConnection } from '../config/email';
import { processEmailJobs } from '../core/email/email.worker';
import { logger } from '../config/logger';

export const loadEmail = async (): Promise<void> => {
  try {
    // Initialize email transporter
    initializeEmailTransporter();

    // Verify email connection
    const isConnected = await verifyEmailConnection();
    
    if (!isConnected) {
      logger.warn('⚠️ Email connection verification failed. Emails may not be sent.');
      // Don't throw - allow server to start even if email is not configured
      if (process.env.NODE_ENV === 'production') {
        logger.warn('⚠️ Email is not properly configured in production mode');
      }
    }

    // Start email queue worker
    await processEmailJobs();

    logger.info('✅ Email service loaded successfully');
  } catch (error: any) {
    logger.error('❌ Failed to load email service:', error);
    // Don't throw - allow server to start without email in development
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      logger.warn('⚠️ Continuing without email service (development mode)');
    }
  }
};

