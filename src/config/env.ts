// Environment variable loader with validation
// All values must be provided in .env file - no hardcoded defaults
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation - all values come from .env
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string(),
  
  // Database Configuration
  DB_HOST: z.string(),
  DB_PORT: z.string().transform(Number),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: z.string().transform(val => val === 'true'),
  
  // Database Connection Pool Configuration (optional)
  DB_POOL_MAX: z.string().transform(Number).optional(), // Maximum connections in pool
  DB_POOL_MIN: z.string().transform(Number).optional(), // Minimum connections in pool
  DB_POOL_IDLE_TIMEOUT: z.string().transform(Number).optional(), // Idle timeout in milliseconds
  DB_POOL_CONNECTION_TIMEOUT: z.string().transform(Number).optional(), // Connection timeout in milliseconds
  
  // JWT Configuration
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),
  
  // Application Configuration
  APP_NAME: z.string(),
  APP_URL: z.string(),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).optional(),
  
  // Redis Configuration
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  
  // RazorPay Configuration
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  
  // Email Configuration (Gmail SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_SECURE: z.string().transform(val => val === 'true').optional(),
  SMTP_USER: z.string().optional(), // Gmail email address
  SMTP_PASSWORD: z.string().optional(), // Gmail App Password (not regular password)
  SMTP_FROM_NAME: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(), // Usually same as SMTP_USER
});

// Validate and export config
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const config = parseResult.data;
