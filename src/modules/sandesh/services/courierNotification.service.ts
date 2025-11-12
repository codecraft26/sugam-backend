// Courier Notification Service - Single Responsibility: Courier-specific Notifications
import { INotificationService } from '../../../core/interfaces/service.interface';
import { Courier } from '../models/courier.model';
import { CourierRequest } from '../models/courierRequest.model';
import { User } from '../../../core/users/user.model';
import { Admin } from '../../../core/admin/admin.model';
import { ILoggerService } from '../../../core/interfaces/service.interface';

export class CourierNotificationService {
  constructor(
    private notificationService: INotificationService,
    private logger: ILoggerService
  ) {}

  async notifyNewCourier(courier: Courier, receiver: User): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'New Courier Arrived',
        message: `A new ${courier.courier_name || 'courier'} has arrived for you. Please collect it from reception. Tracking No: ${courier.tracking_no}`,
      });
    } catch (error: any) {
      this.logger.error('Error notifying new courier:', error);
    }
  }

  async notifyStatusUpdate(
    courier: Courier,
    receiver: User,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'Courier Status Updated',
        message: `Your courier status has been updated to ${newStatus}. Tracking No: ${courier.tracking_no}`,
      });
    } catch (error: any) {
      this.logger.error('Error notifying status update:', error);
    }
  }

  async notifyDocketAdded(courier: Courier, receiver: User, tracking_no: string): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'Courier Request Approved',
        message: `Your courier request has been approved. Docket No: ${tracking_no}`,
      });
    } catch (error: any) {
      this.logger.error('Error notifying docket added:', error);
    }
  }

  async notifyAcknowledgmentRequired(courier: Courier, receiver: User): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'Courier Delivered - Acknowledgment Required',
        message: `Your courier has been delivered. Please acknowledge receipt. Tracking No: ${courier.tracking_no}`,
      });
    } catch (error: any) {
      this.logger.error('Error notifying acknowledgment required:', error);
    }
  }

  async notifyNewRequest(request: CourierRequest, admins: Admin[]): Promise<void> {
    try {
      for (const admin of admins) {
        await this.notificationService.sendNotification({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'New Courier Request',
          message: `A new courier request has been submitted. Request ID: ${request.id}`,
        });
      }
    } catch (error: any) {
      this.logger.error('Error notifying new request:', error);
    }
  }

  async notifyRequestRejected(receiver: User, reason?: string): Promise<void> {
    try {
      await this.notificationService.sendNotification({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'Courier Request Rejected',
        message: `Your courier request has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      });
    } catch (error: any) {
      this.logger.error('Error notifying request rejection:', error);
    }
  }
}

