// Email queue worker - processes email jobs
import { emailQueue } from './email.queue';
import { getEmailTransporter, getDefaultFromEmail, getDefaultFromName } from '../../config/email';
import { EmailJobData } from './email.types';
import { logger } from '../../config/logger';

/**
 * Process email jobs from the queue
 */
export async function processEmailJobs(): Promise<void> {
  logger.info('📧 Starting email queue worker...');

  emailQueue.process(async (job) => {
    try {
      const emailData: EmailJobData = job.data;
      const transporter = getEmailTransporter();

      // Prepare email options
      const mailOptions = {
        from: emailData.fromName 
          ? `"${emailData.fromName}" <${emailData.from || getDefaultFromEmail()}>`
          : emailData.from || getDefaultFromEmail(),
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc) : undefined,
        bcc: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc.join(', ') : emailData.bcc) : undefined,
        replyTo: emailData.replyTo,
        attachments: emailData.attachments,
        priority: emailData.priority,
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);

      logger.info(`✅ Email sent successfully: ${job.id} - Message ID: ${info.messageId} - To: ${emailData.to}`);

      return {
        success: true,
        messageId: info.messageId,
        to: emailData.to,
      };
    } catch (error: any) {
      logger.error(`❌ Failed to send email ${job.id}:`, error);
      throw error; // Re-throw to trigger retry mechanism
    }
  });

  logger.info('✅ Email queue worker started');
}

/**
 * Get email queue statistics
 */
export async function getEmailQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

