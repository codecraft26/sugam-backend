// Email configuration (Gmail SMTP)
import nodemailer, { Transporter } from 'nodemailer';
import { config } from './env';
import { logger } from './logger';

let transporter: Transporter | null = null;

/**
 * Initialize email transporter with Gmail SMTP
 */
export function initializeEmailTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  // Check if email is configured
  if (!config.SMTP_USER || !config.SMTP_PASSWORD) {
    logger.warn('⚠️ Email not configured. SMTP_USER and SMTP_PASSWORD are required.');
    throw new Error('Email configuration is missing. Please set SMTP_USER and SMTP_PASSWORD in .env file');
  }

  try {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST || 'smtp.gmail.com',
      port: config.SMTP_PORT || 587,
      secure: config.SMTP_SECURE || false, // true for 465, false for other ports
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD, // Gmail App Password
      },
      // Gmail specific settings
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production', // Reject unauthorized in production
      },
    });

    logger.info('✅ Email transporter initialized (Gmail SMTP)');
    return transporter;
  } catch (error: any) {
    logger.error('❌ Failed to initialize email transporter:', error);
    throw error;
  }
}

/**
 * Verify email transporter connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    if (!transporter) {
      transporter = initializeEmailTransporter();
    }

    await transporter.verify();
    logger.info('✅ Email connection verified');
    return true;
  } catch (error: any) {
    logger.error('❌ Email connection verification failed:', error);
    return false;
  }
}

/**
 * Get email transporter instance
 */
export function getEmailTransporter(): Transporter {
  if (!transporter) {
    transporter = initializeEmailTransporter();
  }
  return transporter;
}

/**
 * Get default from email address
 */
export function getDefaultFromEmail(): string {
  return config.SMTP_FROM_EMAIL || config.SMTP_USER || 'noreply@sugam.com';
}

/**
 * Get default from name
 */
export function getDefaultFromName(): string {
  return config.SMTP_FROM_NAME || 'Sugam Platform';
}

