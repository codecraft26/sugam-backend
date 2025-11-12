// Notification Service - Single Responsibility: Sending Notifications
import { INotificationService } from '../interfaces/service.interface';
import { emailService } from '../email';

export class NotificationService implements INotificationService {
  async sendNotification(data: {
    name: string;
    email: string;
    title: string;
    message: string;
  }): Promise<void> {
    await emailService.sendNotificationEmail(data);
  }
}

