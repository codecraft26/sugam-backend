// Courier service - comprehensive courier management
import { AppDataSource } from '../../../config/data-source';
import { Courier } from '../models/courier.model';
import { CourierRequest } from '../models/courierRequest.model';
import { CourierAcknowledgment } from '../models/courierAcknowledgment.model';
import { SystemConfig } from '../../../core/system/systemConfig.model';
import { User } from '../../../core/users/user.model';
import { Admin } from '../../../core/admin/admin.model';
import { logger } from '../../../config/logger';
import { emailService } from '../../../core/email';

export class CourierService {
  private courierRepository = AppDataSource.getRepository(Courier);
  private requestRepository = AppDataSource.getRepository(CourierRequest);
  private acknowledgmentRepository = AppDataSource.getRepository(CourierAcknowledgment);
  private systemConfigRepository = AppDataSource.getRepository(SystemConfig);
  private userRepository = AppDataSource.getRepository(User);
  private adminRepository = AppDataSource.getRepository(Admin);

  // ============================================
  // 4.1 COURIER MANAGEMENT (Receptionist/Admin)
  // ============================================

  /**
   * Add courier (incoming or outgoing)
   */
  async addCourier(
    tenant_id: string,
    admin_id: string,
    data: {
      courier_type: 'INCOMING' | 'OUTGOING';
      receiver_id: string;
      tracking_no: string;
      courier_name?: string;
      courier_partner_name?: string;
      sender?: string;
      company_name?: string;
      company_code?: string;
      status?: 'RECEIVED' | 'IN_TRANSIT' | 'DELIVERED' | 'PENDING';
      received_at?: Date;
      comments?: string;
      courier_request_id?: string; // Link to request if created from request
    }
  ): Promise<Courier> {
    try {
      // Validate tracking code length
      if (data.tracking_no.length > 50) {
        throw new Error('Tracking code must be less than 50 characters');
      }

      // Validate comments length
      if (data.comments && data.comments.length > 200) {
        throw new Error('Comments must be less than 200 characters');
      }

      // Verify receiver exists
      const receiver = await this.userRepository.findOne({
        where: { id: data.receiver_id, tenant_id },
      });

      if (!receiver) {
        throw new Error('Receiver not found');
      }

      // Set default status
      const status = data.status || (data.courier_type === 'INCOMING' ? 'RECEIVED' : 'PENDING');

      const courier = this.courierRepository.create({
        tenant_id,
        admin_id,
        receiver_id: data.receiver_id,
        tracking_no: data.tracking_no.trim(),
        courier_name: data.courier_name?.trim() || (null as any),
        courier_partner_name: data.courier_partner_name?.trim() || (null as any),
        courier_type: data.courier_type,
        sender: data.sender?.trim() || (null as any),
        company_name: data.company_name?.trim() || (null as any),
        company_code: data.company_code?.trim() || (null as any),
        status,
        received_at: data.received_at || (status === 'RECEIVED' ? new Date() : undefined),
        admin_notes: data.comments?.trim() || (null as any),
      });

      const savedCourier = await this.courierRepository.save(courier);

      // Link to request if provided
      if (data.courier_request_id) {
        const request = await this.requestRepository.findOne({
          where: { id: data.courier_request_id, tenant_id },
        });

        if (request) {
          request.courier_id = savedCourier.id;
          request.status = 'APPROVED';
          await this.requestRepository.save(request);
        }
      }

      logger.info(`Courier added: ${savedCourier.id} - ${savedCourier.tracking_no} (Tenant: ${tenant_id})`);

      // Notify employee
      await this.notifyNewCourier(savedCourier, receiver);

      return savedCourier;
    } catch (error: any) {
      logger.error('Error adding courier:', error);
      throw error;
    }
  }

  /**
   * Update courier status
   */
  async updateCourierStatus(
    courier_id: string,
    tenant_id: string,
    admin_id: string,
    status: 'RECEIVED' | 'IN_TRANSIT' | 'DELIVERED' | 'PENDING',
    admin_notes?: string
  ): Promise<Courier> {
    try {
      const courier = await this.courierRepository.findOne({
        where: { id: courier_id, tenant_id },
        relations: ['receiver'],
      });

      if (!courier) {
        throw new Error('Courier not found');
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        PENDING: ['RECEIVED'],
        RECEIVED: ['IN_TRANSIT'],
        IN_TRANSIT: ['DELIVERED'],
        DELIVERED: [], // Final state
      };

      const currentStatus = courier.status;
      const allowedNextStatuses = validTransitions[currentStatus] || [];

      if (status !== currentStatus && !allowedNextStatuses.includes(status)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
      }

      const oldStatus = courier.status;
      courier.status = status;
      courier.admin_id = admin_id;

      if (admin_notes) {
        courier.admin_notes = admin_notes.trim();
      }

      // Update timestamps
      if (status === 'RECEIVED' && !courier.received_at) {
        courier.received_at = new Date();
      }

      if (status === 'DELIVERED' && !courier.delivered_at) {
        courier.delivered_at = new Date();
      }

      const updatedCourier = await this.courierRepository.save(courier);

      logger.info(`Courier status updated: ${courier_id} from ${oldStatus} to ${status}`);

      // Notify employee of status change
      if (courier.receiver) {
        await this.notifyStatusUpdate(updatedCourier, courier.receiver, oldStatus, status);
      }

      // If status changed to DELIVERED, notify for acknowledgment
      if (status === 'DELIVERED' && courier.receiver) {
        await this.notifyAcknowledgmentRequired(updatedCourier, courier.receiver);
      }

      return updatedCourier;
    } catch (error: any) {
      logger.error('Error updating courier status:', error);
      throw error;
    }
  }

  /**
   * Get couriers with search and filters
   */
  async getCouriers(
    tenant_id: string,
    options?: {
      tracking_code?: string;
      employee_id?: string;
      status?: string;
      courier_type?: 'INCOMING' | 'OUTGOING';
      date_from?: Date;
      date_to?: Date;
      search?: string;
    }
  ): Promise<Courier[]> {
    try {
      const queryBuilder = this.courierRepository
        .createQueryBuilder('courier')
        .leftJoinAndSelect('courier.receiver', 'receiver')
        .leftJoinAndSelect('courier.admin', 'admin')
        .where('courier.tenant_id = :tenant_id', { tenant_id });

      if (options?.tracking_code) {
        queryBuilder.andWhere('courier.tracking_no = :tracking_code', {
          tracking_code: options.tracking_code,
        });
      }

      if (options?.employee_id) {
        queryBuilder.andWhere('courier.receiver_id = :employee_id', {
          employee_id: options.employee_id,
        });
      }

      if (options?.status) {
        queryBuilder.andWhere('courier.status = :status', { status: options.status });
      }

      if (options?.courier_type) {
        queryBuilder.andWhere('courier.courier_type = :courier_type', {
          courier_type: options.courier_type,
        });
      }

      if (options?.date_from) {
        queryBuilder.andWhere('courier.created_at >= :date_from', {
          date_from: options.date_from,
        });
      }

      if (options?.date_to) {
        queryBuilder.andWhere('courier.created_at <= :date_to', { date_to: options.date_to });
      }

      if (options?.search) {
        queryBuilder.andWhere(
          '(courier.tracking_no ILIKE :search OR courier.courier_name ILIKE :search OR courier.sender ILIKE :search)',
          { search: `%${options.search}%` }
        );
      }

      return await queryBuilder.orderBy('courier.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching couriers:', error);
      throw error;
    }
  }

  /**
   * Get courier by ID
   */
  async getCourierById(courier_id: string, tenant_id: string): Promise<Courier | null> {
    try {
      const courier = await this.courierRepository.findOne({
        where: { id: courier_id, tenant_id },
        relations: ['receiver', 'admin'],
      });

      return courier;
    } catch (error: any) {
      logger.error('Error fetching courier:', error);
      throw error;
    }
  }

  /**
   * Get unclaimed couriers
   */
  async getUnclaimedCouriers(tenant_id: string): Promise<Courier[]> {
    try {
      // Get unclaimed threshold from system config
      const thresholdConfig = await this.systemConfigRepository.findOne({
        where: { tenant_id, config_key: 'SANDESH_UNCLAIMED_THRESHOLD_HOURS' },
      });

      const thresholdHours = thresholdConfig
        ? parseInt(thresholdConfig.config_value || '24', 10)
        : 24;

      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - thresholdHours);

      const couriers = await this.courierRepository
        .createQueryBuilder('courier')
        .leftJoinAndSelect('courier.receiver', 'receiver')
        .leftJoinAndSelect('courier.admin', 'admin')
        .where('courier.tenant_id = :tenant_id', { tenant_id })
        .andWhere('courier.status = :status', { status: 'RECEIVED' })
        .andWhere('courier.received_at <= :thresholdDate', { thresholdDate })
        .orderBy('courier.received_at', 'ASC')
        .getMany();

      return couriers;
    } catch (error: any) {
      logger.error('Error fetching unclaimed couriers:', error);
      throw error;
    }
  }

  /**
   * Mark courier as claimed
   */
  async markAsClaimed(courier_id: string, tenant_id: string): Promise<Courier> {
    try {
      const courier = await this.courierRepository.findOne({
        where: { id: courier_id, tenant_id },
      });

      if (!courier) {
        throw new Error('Courier not found');
      }

      if (courier.status !== 'RECEIVED') {
        throw new Error('Only received couriers can be marked as claimed');
      }

      courier.status = 'DELIVERED';
      courier.delivered_at = new Date();

      const updatedCourier = await this.courierRepository.save(courier);

      logger.info(`Courier marked as claimed: ${courier_id}`);

      return updatedCourier;
    } catch (error: any) {
      logger.error('Error marking courier as claimed:', error);
      throw error;
    }
  }

  // ============================================
  // 4.2 COURIER REQUEST (Employee)
  // ============================================

  /**
   * Create courier request
   */
  async createRequest(
    tenant_id: string,
    user_id: string,
    data: {
      courier_type: 'INCOMING' | 'OUTGOING';
      intended_recipient?: string;
      message?: string;
      company_name?: string;
      company_code?: string;
    }
  ): Promise<CourierRequest> {
    try {
      // Validate message length
      if (data.message && data.message.length > 200) {
        throw new Error('Message must be less than 200 characters');
      }

      const request = this.requestRepository.create({
        tenant_id,
        user_id,
        courier_type: data.courier_type,
        intended_recipient: data.intended_recipient?.trim() || (null as any),
        message: data.message?.trim() || (null as any),
        company_name: data.company_name?.trim() || (null as any),
        company_code: data.company_code?.trim() || (null as any),
        status: 'PENDING',
      });

      const savedRequest = await this.requestRepository.save(request);

      logger.info(`Courier request created: ${savedRequest.id} by user ${user_id}`);

      // Notify receptionist/admins
      await this.notifyNewRequest(savedRequest);

      return savedRequest;
    } catch (error: any) {
      logger.error('Error creating courier request:', error);
      throw error;
    }
  }

  /**
   * Get user's courier requests
   */
  async getUserRequests(
    tenant_id: string,
    user_id: string,
    options?: {
      status?: string;
      courier_type?: 'INCOMING' | 'OUTGOING';
    }
  ): Promise<CourierRequest[]> {
    try {
      const queryBuilder = this.requestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.courier', 'courier')
        .where('request.tenant_id = :tenant_id', { tenant_id })
        .andWhere('request.user_id = :user_id', { user_id });

      if (options?.status) {
        queryBuilder.andWhere('request.status = :status', { status: options.status });
      }

      if (options?.courier_type) {
        queryBuilder.andWhere('request.courier_type = :courier_type', {
          courier_type: options.courier_type,
        });
      }

      return await queryBuilder.orderBy('request.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching user requests:', error);
      throw error;
    }
  }

  /**
   * Cancel courier request
   */
  async cancelRequest(request_id: string, tenant_id: string, user_id: string): Promise<CourierRequest> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id, user_id },
      });

      if (!request) {
        throw new Error('Request not found or you do not have permission to cancel it');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Only pending requests can be cancelled');
      }

      request.status = 'REJECTED';

      const updatedRequest = await this.requestRepository.save(request);

      logger.info(`Courier request canceled: ${request_id} by user ${user_id}`);

      return updatedRequest;
    } catch (error: any) {
      logger.error('Error canceling courier request:', error);
      throw error;
    }
  }

  // ============================================
  // 4.3 REQUEST HANDLING (Receptionist/Admin)
  // ============================================

  /**
   * Get pending courier requests
   */
  async getPendingRequests(tenant_id: string): Promise<CourierRequest[]> {
    try {
      const requests = await this.requestRepository.find({
        where: { tenant_id, status: 'PENDING' },
        relations: ['user', 'courier'],
        order: { created_at: 'DESC' },
      });

      return requests;
    } catch (error: any) {
      logger.error('Error fetching pending requests:', error);
      throw error;
    }
  }

  /**
   * Approve courier request
   */
  async approveRequest(
    request_id: string,
    tenant_id: string,
    admin_id: string,
    tracking_no: string,
    courier_data?: {
      courier_name?: string;
      courier_partner_name?: string;
      sender?: string;
      comments?: string;
    }
  ): Promise<{ request: CourierRequest; courier: Courier }> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id },
        relations: ['user'],
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Request is not pending');
      }

      // Create courier from request
      const courier = await this.addCourier(tenant_id, admin_id, {
        courier_type: request.courier_type as 'INCOMING' | 'OUTGOING',
        receiver_id: request.user_id,
        tracking_no,
        courier_name: courier_data?.courier_name,
        courier_partner_name: courier_data?.courier_partner_name,
        sender: courier_data?.sender,
        company_name: request.company_name || undefined,
        company_code: request.company_code || undefined,
        status: request.courier_type === 'INCOMING' ? 'RECEIVED' : 'PENDING',
        comments: courier_data?.comments,
        courier_request_id: request_id,
      });

      // Update request
      request.status = 'APPROVED';
      request.courier_id = courier.id;
      const updatedRequest = await this.requestRepository.save(request);

      logger.info(`Courier request approved: ${request_id} with courier ${courier.id}`);

      // Notify employee of docket number
      if (request.user) {
        await this.notifyDocketAdded(courier, request.user, tracking_no);
      }

      return { request: updatedRequest, courier };
    } catch (error: any) {
      logger.error('Error approving courier request:', error);
      throw error;
    }
  }

  /**
   * Reject courier request
   */
  async rejectRequest(
    request_id: string,
    tenant_id: string,
    admin_id: string,
    reason?: string
  ): Promise<CourierRequest> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id },
        relations: ['user'],
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Request is not pending');
      }

      request.status = 'REJECTED';

      const updatedRequest = await this.requestRepository.save(request);

      logger.info(`Courier request rejected: ${request_id} by admin ${admin_id}`);

      // Notify employee
      if (request.user) {
        await emailService.sendNotificationEmail({
          name: `${request.user.first_name} ${request.user.last_name}`,
          email: request.user.email,
          title: 'Courier Request Rejected',
          message: `Your courier request has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        });
      }

      return updatedRequest;
    } catch (error: any) {
      logger.error('Error rejecting courier request:', error);
      throw error;
    }
  }

  // ============================================
  // 4.4 ACKNOWLEDGMENT (Employee)
  // ============================================

  /**
   * Acknowledge courier receipt
   */
  async acknowledgeCourier(
    courier_id: string,
    tenant_id: string,
    user_id: string,
    data: {
      check_in_popup?: boolean;
      digital_signature?: string; // Base64 encoded
    }
  ): Promise<CourierAcknowledgment> {
    try {
      const courier = await this.courierRepository.findOne({
        where: { id: courier_id, tenant_id, receiver_id: user_id },
      });

      if (!courier) {
        throw new Error('Courier not found or you are not the receiver');
      }

      if (courier.status !== 'DELIVERED') {
        throw new Error('Courier must be in DELIVERED status to acknowledge');
      }

      // Check if already acknowledged
      const existingAck = await this.acknowledgmentRepository.findOne({
        where: { courier_id },
      });

      if (existingAck) {
        throw new Error('Courier has already been acknowledged');
      }

      // Validate acknowledgment data
      if (!data.check_in_popup && !data.digital_signature) {
        throw new Error('Either check-in popup or digital signature is required');
      }

      const acknowledgment = this.acknowledgmentRepository.create({
        courier_id,
        acknowledged_by: user_id,
        check_in_popup: data.check_in_popup || false,
        digital_signature: data.digital_signature || (null as any),
        acknowledged_at: new Date(),
      });

      const savedAck = await this.acknowledgmentRepository.save(acknowledgment);

      logger.info(`Courier acknowledged: ${courier_id} by user ${user_id}`);

      return savedAck;
    } catch (error: any) {
      logger.error('Error acknowledging courier:', error);
      throw error;
    }
  }

  /**
   * Get acknowledgment by courier ID
   */
  async getAcknowledgment(courier_id: string, tenant_id: string): Promise<CourierAcknowledgment | null> {
    try {
      const courier = await this.courierRepository.findOne({
        where: { id: courier_id, tenant_id },
      });

      if (!courier) {
        return null;
      }

      const acknowledgment = await this.acknowledgmentRepository.findOne({
        where: { courier_id },
        relations: ['acknowledgedBy'],
      });

      return acknowledgment;
    } catch (error: any) {
      logger.error('Error fetching acknowledgment:', error);
      throw error;
    }
  }

  // ============================================
  // SYSTEM CONFIG (Admin)
  // ============================================

  /**
   * Get system config value
   */
  async getSystemConfig(tenant_id: string, config_key: string): Promise<string | null> {
    try {
      const config = await this.systemConfigRepository.findOne({
        where: { tenant_id, config_key },
      });

      return config?.config_value || null;
    } catch (error: any) {
      logger.error('Error fetching system config:', error);
      return null;
    }
  }

  /**
   * Set system config value
   */
  async setSystemConfig(
    tenant_id: string,
    config_key: string,
    config_value: string,
    config_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' = 'STRING',
    description?: string
  ): Promise<SystemConfig> {
    try {
      let config = await this.systemConfigRepository.findOne({
        where: { tenant_id, config_key },
      });

      if (config) {
        config.config_value = config_value;
        config.config_type = config_type;
        if (description) {
          config.description = description;
        }
      } else {
        config = this.systemConfigRepository.create({
          tenant_id,
          config_key,
          config_value,
          config_type,
          description: description || (null as any),
        });
      }

      const savedConfig = await this.systemConfigRepository.save(config);
      logger.info(`System config set: ${config_key} = ${config_value} (Tenant: ${tenant_id})`);

      return savedConfig;
    } catch (error: any) {
      logger.error('Error setting system config:', error);
      throw error;
    }
  }

  // ============================================
  // NOTIFICATION HELPERS
  // ============================================

  /**
   * Notify employee of new courier
   */
  private async notifyNewCourier(courier: Courier, receiver: User): Promise<void> {
    try {
      await emailService.sendNotificationEmail({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'New Courier Arrived',
        message: `A new ${courier.courier_name || 'courier'} has arrived for you. Please collect it from reception. Tracking No: ${courier.tracking_no}`,
      });
    } catch (error: any) {
      logger.error('Error notifying new courier:', error);
    }
  }

  /**
   * Notify employee of status update
   */
  private async notifyStatusUpdate(
    courier: Courier,
    receiver: User,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    try {
      await emailService.sendNotificationEmail({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'Courier Status Updated',
        message: `Your courier status has been updated to ${newStatus}. Tracking No: ${courier.tracking_no}`,
      });
    } catch (error: any) {
      logger.error('Error notifying status update:', error);
    }
  }

  /**
   * Notify employee of docket number
   */
  private async notifyDocketAdded(courier: Courier, receiver: User, tracking_no: string): Promise<void> {
    try {
      await emailService.sendNotificationEmail({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'Courier Request Approved',
        message: `Your courier request has been approved. Docket No: ${tracking_no}`,
      });
    } catch (error: any) {
      logger.error('Error notifying docket added:', error);
    }
  }

  /**
   * Notify acknowledgment required
   */
  private async notifyAcknowledgmentRequired(courier: Courier, receiver: User): Promise<void> {
    try {
      await emailService.sendNotificationEmail({
        name: `${receiver.first_name} ${receiver.last_name}`,
        email: receiver.email,
        title: 'Courier Delivered - Acknowledgment Required',
        message: `Your courier has been delivered. Please acknowledge receipt. Tracking No: ${courier.tracking_no}`,
      });
    } catch (error: any) {
      logger.error('Error notifying acknowledgment required:', error);
    }
  }

  /**
   * Notify new request to receptionist/admins
   */
  private async notifyNewRequest(request: CourierRequest): Promise<void> {
    try {
      const admins = await this.getSandeshAdmins(request.tenant_id);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'New Courier Request',
          message: `A new courier request has been submitted. Request ID: ${request.id}`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying new request:', error);
    }
  }

  /**
   * Get admins with SANDESH scope
   */
  private async getSandeshAdmins(tenant_id: string): Promise<Admin[]> {
    try {
      const allAdmins = await this.adminRepository.find({
        where: { tenant_id, is_active: true },
      });

      return allAdmins.filter(
        (admin) =>
          admin.is_super_admin ||
          admin.module_scope === 'SANDESH' ||
          admin.module_scope === 'ALL'
      );
    } catch (error: any) {
      logger.error('Error fetching SANDESH admins:', error);
      return [];
    }
  }
}

// Export singleton instance
export const courierService = new CourierService();

