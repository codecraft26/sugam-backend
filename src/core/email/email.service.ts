// Email service - handles email sending with queue
import { emailQueue, EMAIL_QUEUE_NAME } from './email.queue';
import { EmailOptions, EmailJobData } from './email.types';
import { getDefaultFromEmail, getDefaultFromName } from '../../config/email';
import { logger } from '../../config/logger';

export class EmailService {
  /**
   * Send email asynchronously (adds to queue)
   * This is the main method to use throughout the app
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // Prepare email job data
      const jobData: EmailJobData = {
        ...options,
        from: options.from || getDefaultFromEmail(),
        fromName: options.fromName || getDefaultFromName(),
      };

      // Add email to queue
      const job = await emailQueue.add(jobData, {
        priority: options.priority === 'high' ? 1 : options.priority === 'low' ? 10 : 5,
      });

      logger.info(`Email queued: ${job.id} - To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}, Subject: ${options.subject}`);
    } catch (error: any) {
      logger.error('Error queueing email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(data: { name: string; email: string }): Promise<void> {
    const { getWelcomeEmailTemplate } = await import('./email.templates');
    
    await this.sendEmail({
      to: data.email,
      subject: 'Welcome to Sugam Platform!',
      html: getWelcomeEmailTemplate(data),
      text: `Hello ${data.name},\n\nWelcome to Sugam Platform! Your account has been successfully created.\n\nEmail: ${data.email}\n\nYou can now log in and start using the platform.\n\nBest regards,\nThe Sugam Team`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: { name: string; email: string; resetLink: string }): Promise<void> {
    const { getPasswordResetEmailTemplate } = await import('./email.templates');
    
    await this.sendEmail({
      to: data.email,
      subject: 'Password Reset Request - Sugam Platform',
      html: getPasswordResetEmailTemplate(data),
      text: `Hello ${data.name},\n\nWe received a request to reset your password. Click the link below to reset it:\n\n${data.resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe Sugam Team`,
    });
  }

  /**
   * Send request approval email
   */
  async sendRequestApprovedEmail(data: { name: string; email: string; requestDescription: string; adminComments?: string }): Promise<void> {
    const { getRequestApprovedEmailTemplate } = await import('./email.templates');
    
    await this.sendEmail({
      to: data.email,
      subject: 'Your Request Has Been Approved - Sugam Platform',
      html: getRequestApprovedEmailTemplate(data),
      text: `Hello ${data.name},\n\nYour request has been approved!\n\nRequest: ${data.requestDescription}\n${data.adminComments ? `Admin Comments: ${data.adminComments}\n` : ''}\nYou can now proceed with your request.\n\nBest regards,\nThe Sugam Team`,
    });
  }

  /**
   * Send request rejection email
   */
  async sendRequestRejectedEmail(data: { name: string; email: string; requestDescription: string; adminComments?: string }): Promise<void> {
    const { getRequestRejectedEmailTemplate } = await import('./email.templates');
    
    await this.sendEmail({
      to: data.email,
      subject: 'Your Request Has Been Rejected - Sugam Platform',
      html: getRequestRejectedEmailTemplate(data),
      text: `Hello ${data.name},\n\nUnfortunately, your request has been rejected.\n\nRequest: ${data.requestDescription}\n${data.adminComments ? `Admin Comments: ${data.adminComments}\n` : ''}\nIf you have any questions, please contact your administrator.\n\nBest regards,\nThe Sugam Team`,
    });
  }

  /**
   * Send user approval email
   */
  async sendUserApprovedEmail(data: { name: string; email: string; loginUrl?: string }): Promise<void> {
    const { getUserApprovedEmailTemplate } = await import('./email.templates');
    
    await this.sendEmail({
      to: data.email,
      subject: 'Your Account Has Been Approved - Sugam Platform',
      html: getUserApprovedEmailTemplate(data),
      text: `Hello ${data.name},\n\nGreat news! Your account has been approved by the administrator.\n\nEmail: ${data.email}\n\nYou can now log in and start using the platform.\n\nBest regards,\nThe Sugam Team`,
    });
  }

  /**
   * Send generic notification email
   */
  async sendNotificationEmail(data: { name: string; email: string; title: string; message: string }): Promise<void> {
    const { getNotificationEmailTemplate } = await import('./email.templates');
    
    await this.sendEmail({
      to: data.email,
      subject: data.title,
      html: getNotificationEmailTemplate(data),
      text: `Hello ${data.name},\n\n${data.message}\n\nBest regards,\nThe Sugam Team`,
    });
  }

  /**
   * Send custom email with HTML template
   */
  async sendCustomEmail(data: { to: string | string[]; subject: string; html: string; text?: string; cc?: string | string[]; bcc?: string | string[] }): Promise<void> {
    await this.sendEmail({
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      cc: data.cc,
      bcc: data.bcc,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();

