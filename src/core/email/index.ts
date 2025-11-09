// Email service exports
export { emailService, EmailService } from './email.service';
export { emailQueue, closeEmailQueue, EMAIL_QUEUE_NAME } from './email.queue';
export { processEmailJobs, getEmailQueueStats } from './email.worker';
export * from './email.types';
export * from './email.templates';

