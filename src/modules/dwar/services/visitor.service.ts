// Visitor Management Service - Comprehensive VMS
import { AppDataSource } from '../../../config/data-source';
import { Visitor } from '../models/visitor.model';
import { Receptionist } from '../models/receptionist.model';
import { Kiosk } from '../models/kiosk.model';
import { BuildingStaff } from '../models/buildingStaff.model';
import { VisitorActivityLog } from '../models/visitorActivityLog.model';
import { SystemConfig } from '../../../core/system/systemConfig.model';
import { User } from '../../../core/users/user.model';
import { Admin } from '../../../core/admin/admin.model';
import { Building } from '../../../core/orgs/building.model';
import { Floor } from '../../../core/orgs/floor.model';
import { MeetingRoom } from '../../sammilan/models/meetingRoom.model';
import { logger } from '../../../config/logger';
import { emailService } from '../../../core/email';
import { v4 as uuidv4 } from 'uuid';

export class VisitorService {
  private visitorRepository = AppDataSource.getRepository(Visitor);
  private receptionistRepository = AppDataSource.getRepository(Receptionist);
  private kioskRepository = AppDataSource.getRepository(Kiosk);
  private buildingStaffRepository = AppDataSource.getRepository(BuildingStaff);
  private activityLogRepository = AppDataSource.getRepository(VisitorActivityLog);
  private systemConfigRepository = AppDataSource.getRepository(SystemConfig);
  private userRepository = AppDataSource.getRepository(User);
  private adminRepository = AppDataSource.getRepository(Admin);
  private buildingRepository = AppDataSource.getRepository(Building);
  private floorRepository = AppDataSource.getRepository(Floor);
  private meetingRoomRepository = AppDataSource.getRepository(MeetingRoom);

  // ============================================
  // 2.1 VISITOR REGISTRATION
  // ============================================

  /**
   * Register visitor (supports all modes: walk-in, pre-registration, self-checkin, bulk)
   */
  async registerVisitor(
    tenant_id: string,
    data: {
      name: string;
      contact_no: string;
      email?: string;
      visitor_type: 'Guest' | 'Vendor' | 'Delivery' | 'VIP' | 'VVIP';
      purpose: string;
      visiting_user_id: string;
      registration_mode: 'walk-in' | 'pre-registration' | 'self-checkin' | 'bulk';
      visitor_photo_url?: string;
      visitor_id_photo_url?: string;
      digital_signature?: string;
      device_object_carrying?: string;
      additional_comments?: string;
      custom_fields?: Record<string, any>;
      // For walk-in
      receptionist_id?: string;
      // For self-checkin
      kiosk_id?: string;
      // For VIP/VVIP
      access_areas?: string[];
      qr_code_type?: 'Single Entry/Exit' | 'Multiple Entry/Exit';
      max_visits_allowed?: number;
      expected_date_time?: Date;
      assigned_room_id?: string;
      food_arrangements?: boolean;
      escort_bouquet_options?: string[];
      airport_cab_pickup?: string;
      vehicle_number?: string;
      remarks?: string;
      // For bulk registration
      group_visitors?: Array<{ name: string; contact_no: string }>;
      building_id?: string;
      floor_id?: string;
    }
  ): Promise<Visitor> {
    try {
      // Validate name
      if (!data.name || data.name.length < 1 || data.name.length > 100) {
        throw new Error('Name must be between 1 and 100 characters');
      }

      // Validate contact number
      if (!data.contact_no || !/^\d{10,15}$/.test(data.contact_no)) {
        throw new Error('Contact number must be 10-15 digits');
      }

      // Validate email if provided
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new Error('Invalid email format');
      }

      // Validate visiting user exists
      const visitingUser = await this.userRepository.findOne({
        where: { id: data.visiting_user_id, tenant_id },
      });

      if (!visitingUser) {
        throw new Error('Host/Employee not found');
      }

      // Validate receptionist if walk-in
      if (data.registration_mode === 'walk-in' && data.receptionist_id) {
        const receptionist = await this.receptionistRepository.findOne({
          where: { id: data.receptionist_id, tenant_id },
        });

        if (!receptionist) {
          throw new Error('Receptionist not found');
        }
      }

      // Validate kiosk if self-checkin
      if (data.registration_mode === 'self-checkin' && data.kiosk_id) {
        const kiosk = await this.kioskRepository.findOne({
          where: { id: data.kiosk_id, tenant_id },
        });

        if (!kiosk) {
          throw new Error('Kiosk not found');
        }
      }

      // Generate QR code
      const qr_code = this.generateQRCode();

      // Generate WiFi password
      const wifi_password = this.generateWiFiPassword();

      // Set default status
      let status = 'PENDING';
      if (data.registration_mode === 'walk-in' || data.registration_mode === 'self-checkin') {
        status = 'APPROVED'; // Auto-approved for walk-in and self-checkin
      }

      // For host-initiated pre-registration, needs admin approval
      if (data.registration_mode === 'pre-registration') {
        status = 'PENDING';
      }

      const visitor = this.visitorRepository.create({
        tenant_id,
        name: data.name.trim(),
        contact_no: data.contact_no.trim(),
        email: data.email?.trim() || (null as any),
        visitor_type: data.visitor_type,
        purpose: data.purpose.trim(),
        visiting_user: data.visiting_user_id,
        registration_mode: data.registration_mode,
        receptionist_id: data.receptionist_id || (null as any),
        kiosk_id: data.kiosk_id || (null as any),
        visitor_photo_url: data.visitor_photo_url || (null as any),
        visitor_id_photo_url: data.visitor_id_photo_url || (null as any),
        digital_signature: data.digital_signature || (null as any),
        device_object_carrying: data.device_object_carrying || (null as any),
        additional_comments: data.additional_comments?.trim() || (null as any),
        custom_fields: data.custom_fields ? JSON.stringify(data.custom_fields) : (null as any),
        qr_code,
        wifi_password,
        building_id: data.building_id || (null as any),
        floor_id: data.floor_id || (null as any),
        // VIP/VVIP fields
        access_areas: data.access_areas ? JSON.stringify(data.access_areas) : (null as any),
        qr_code_type: data.qr_code_type || (null as any),
        max_visits_allowed: data.max_visits_allowed || (null as any),
        expected_date_time: data.expected_date_time || (null as any),
        assigned_room_id: data.assigned_room_id || (null as any),
        food_arrangements: data.food_arrangements || false,
        escort_bouquet_options: data.escort_bouquet_options
          ? JSON.stringify(data.escort_bouquet_options)
          : (null as any),
        airport_cab_pickup: data.airport_cab_pickup || (null as any),
        vehicle_number: data.vehicle_number || (null as any),
        remarks: data.remarks || (null as any),
        // Bulk registration
        group_visitors: data.group_visitors ? JSON.stringify(data.group_visitors) : (null as any),
        status,
      });

      const savedVisitor = await this.visitorRepository.save(visitor);

      // Log activity
      await this.logActivity(savedVisitor.id, null, 'VISITOR_REGISTERED', 'Visitor registered', {
        registration_mode: data.registration_mode,
      });

      logger.info(`Visitor registered: ${savedVisitor.id} - ${savedVisitor.name} (Tenant: ${tenant_id})`);

      // Notify host if pre-registration
      if (data.registration_mode === 'pre-registration' && visitingUser) {
        await this.notifyHost(savedVisitor, visitingUser, 'NEW_VISITOR_REQUEST');
      }

      // Notify admins for approval if needed
      if (status === 'PENDING') {
        await this.notifyAdmins(savedVisitor, 'PENDING_APPROVAL');
      }

      return savedVisitor;
    } catch (error: any) {
      logger.error('Error registering visitor:', error);
      throw error;
    }
  }

  /**
   * Get visitors with search and filters
   */
  async getVisitors(
    tenant_id: string,
    options?: {
      visitor_name?: string;
      host_name?: string;
      visitor_type?: string;
      status?: string;
      date_from?: Date;
      date_to?: Date;
      registration_mode?: string;
      building_id?: string;
      floor_id?: string;
      search?: string;
    }
  ): Promise<Visitor[]> {
    try {
      const queryBuilder = this.visitorRepository
        .createQueryBuilder('visitor')
        .leftJoinAndSelect('visitor.visitingUser', 'visitingUser')
        .leftJoinAndSelect('visitor.admin', 'admin')
        .leftJoinAndSelect('visitor.building', 'building')
        .leftJoinAndSelect('visitor.floor', 'floor')
        .where('visitor.tenant_id = :tenant_id', { tenant_id });

      if (options?.visitor_name) {
        queryBuilder.andWhere('visitor.name ILIKE :visitor_name', {
          visitor_name: `%${options.visitor_name}%`,
        });
      }

      if (options?.host_name) {
        queryBuilder.andWhere(
          '(visitingUser.first_name ILIKE :host_name OR visitingUser.last_name ILIKE :host_name)',
          { host_name: `%${options.host_name}%` }
        );
      }

      if (options?.visitor_type) {
        queryBuilder.andWhere('visitor.visitor_type = :visitor_type', {
          visitor_type: options.visitor_type,
        });
      }

      if (options?.status) {
        queryBuilder.andWhere('visitor.status = :status', { status: options.status });
      }

      if (options?.registration_mode) {
        queryBuilder.andWhere('visitor.registration_mode = :registration_mode', {
          registration_mode: options.registration_mode,
        });
      }

      if (options?.building_id) {
        queryBuilder.andWhere('visitor.building_id = :building_id', {
          building_id: options.building_id,
        });
      }

      if (options?.floor_id) {
        queryBuilder.andWhere('visitor.floor_id = :floor_id', { floor_id: options.floor_id });
      }

      if (options?.date_from) {
        queryBuilder.andWhere('visitor.created_at >= :date_from', {
          date_from: options.date_from,
        });
      }

      if (options?.date_to) {
        queryBuilder.andWhere('visitor.created_at <= :date_to', { date_to: options.date_to });
      }

      if (options?.search) {
        queryBuilder.andWhere(
          '(visitor.name ILIKE :search OR visitor.contact_no ILIKE :search OR visitor.email ILIKE :search OR visitingUser.first_name ILIKE :search OR visitingUser.last_name ILIKE :search)',
          { search: `%${options.search}%` }
        );
      }

      return await queryBuilder.orderBy('visitor.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching visitors:', error);
      throw error;
    }
  }

  /**
   * Get visitor by ID
   */
  async getVisitorById(visitor_id: string, tenant_id: string): Promise<Visitor | null> {
    try {
      const visitor = await this.visitorRepository.findOne({
        where: { id: visitor_id, tenant_id },
        relations: ['visitingUser', 'admin', 'building', 'floor'],
      });

      return visitor;
    } catch (error: any) {
      logger.error('Error fetching visitor:', error);
      throw error;
    }
  }

  /**
   * Get user's visitors (for employee journey)
   */
  async getUserVisitors(
    tenant_id: string,
    user_id: string,
    options?: {
      status?: string;
      date_from?: Date;
      date_to?: Date;
    }
  ): Promise<Visitor[]> {
    try {
      const queryBuilder = this.visitorRepository
        .createQueryBuilder('visitor')
        .leftJoinAndSelect('visitor.visitingUser', 'visitingUser')
        .where('visitor.tenant_id = :tenant_id', { tenant_id })
        .andWhere('visitor.visiting_user = :user_id', { user_id });

      if (options?.status) {
        queryBuilder.andWhere('visitor.status = :status', { status: options.status });
      }

      if (options?.date_from) {
        queryBuilder.andWhere('visitor.created_at >= :date_from', {
          date_from: options.date_from,
        });
      }

      if (options?.date_to) {
        queryBuilder.andWhere('visitor.created_at <= :date_to', { date_to: options.date_to });
      }

      return await queryBuilder.orderBy('visitor.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching user visitors:', error);
      throw error;
    }
  }

  // ============================================
  // 2.4 ADMIN JOURNEY - VISITOR MANAGEMENT
  // ============================================

  /**
   * Approve visitor request
   */
  async approveVisitor(
    visitor_id: string,
    tenant_id: string,
    admin_id: string,
    admin_notes?: string
  ): Promise<Visitor> {
    try {
      const visitor = await this.visitorRepository.findOne({
        where: { id: visitor_id, tenant_id },
        relations: ['visitingUser'],
      });

      if (!visitor) {
        throw new Error('Visitor not found');
      }

      if (visitor.status !== 'PENDING') {
        throw new Error('Visitor is not pending approval');
      }

      visitor.status = 'APPROVED';
      visitor.admin_id = admin_id;
      if (admin_notes) {
        visitor.admin_notes = admin_notes.trim();
      }

      const updatedVisitor = await this.visitorRepository.save(visitor);

      // Log activity
      await this.logActivity(visitor_id, admin_id, 'VISITOR_APPROVED', 'Visitor approved', {
        admin_notes,
      });

      // Notify visitor and host
      if (visitor.visitingUser) {
        await this.notifyHost(updatedVisitor, visitor.visitingUser, 'VISITOR_APPROVED');
      }

      logger.info(`Visitor approved: ${visitor_id} by admin ${admin_id}`);

      return updatedVisitor;
    } catch (error: any) {
      logger.error('Error approving visitor:', error);
      throw error;
    }
  }

  /**
   * Reject visitor request
   */
  async rejectVisitor(
    visitor_id: string,
    tenant_id: string,
    admin_id: string,
    reason?: string
  ): Promise<Visitor> {
    try {
      const visitor = await this.visitorRepository.findOne({
        where: { id: visitor_id, tenant_id },
        relations: ['visitingUser'],
      });

      if (!visitor) {
        throw new Error('Visitor not found');
      }

      if (visitor.status !== 'PENDING') {
        throw new Error('Visitor is not pending approval');
      }

      visitor.status = 'REJECTED';
      visitor.admin_id = admin_id;
      if (reason) {
        visitor.admin_notes = reason.trim();
      }

      const updatedVisitor = await this.visitorRepository.save(visitor);

      // Log activity
      await this.logActivity(visitor_id, admin_id, 'VISITOR_REJECTED', 'Visitor rejected', {
        reason,
      });

      // Notify host
      if (visitor.visitingUser) {
        await emailService.sendNotificationEmail({
          name: `${visitor.visitingUser.first_name} ${visitor.visitingUser.last_name}`,
          email: visitor.visitingUser.email,
          title: 'Visitor Request Rejected',
          message: `Visitor request for ${visitor.name} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        });
      }

      logger.info(`Visitor rejected: ${visitor_id} by admin ${admin_id}`);

      return updatedVisitor;
    } catch (error: any) {
      logger.error('Error rejecting visitor:', error);
      throw error;
    }
  }

  /**
   * Update visitor host
   */
  async updateVisitorHost(
    visitor_id: string,
    tenant_id: string,
    admin_id: string,
    new_host_id: string
  ): Promise<Visitor> {
    try {
      const visitor = await this.visitorRepository.findOne({
        where: { id: visitor_id, tenant_id },
      });

      if (!visitor) {
        throw new Error('Visitor not found');
      }

      const newHost = await this.userRepository.findOne({
        where: { id: new_host_id, tenant_id },
      });

      if (!newHost) {
        throw new Error('New host not found');
      }

      const oldHostId = visitor.visiting_user;
      visitor.visiting_user = new_host_id;
      visitor.admin_id = admin_id;

      const updatedVisitor = await this.visitorRepository.save(visitor);

      // Log activity
      await this.logActivity(visitor_id, admin_id, 'HOST_CHANGED', 'Host changed', {
        old_host_id: oldHostId,
        new_host_id: new_host_id,
      });

      logger.info(`Visitor host changed: ${visitor_id} from ${oldHostId} to ${new_host_id}`);

      return updatedVisitor;
    } catch (error: any) {
      logger.error('Error updating visitor host:', error);
      throw error;
    }
  }

  /**
   * Check-in visitor
   */
  async checkInVisitor(
    visitor_id: string,
    tenant_id: string,
    action_by: string,
    notes?: string
  ): Promise<Visitor> {
    try {
      const visitor = await this.visitorRepository.findOne({
        where: { id: visitor_id, tenant_id },
        relations: ['visitingUser'],
      });

      if (!visitor) {
        throw new Error('Visitor not found');
      }

      if (visitor.status !== 'APPROVED' && visitor.status !== 'CHECKED_OUT') {
        throw new Error('Visitor must be approved or previously checked out to check in');
      }

      visitor.status = 'CHECKED_IN';
      visitor.check_in = new Date();

      const updatedVisitor = await this.visitorRepository.save(visitor);

      // Log activity
      await this.logActivity(visitor_id, action_by, 'CHECK_IN', 'Visitor checked in', { notes });

      // Notify host
      if (visitor.visitingUser) {
        await emailService.sendNotificationEmail({
          name: `${visitor.visitingUser.first_name} ${visitor.visitingUser.last_name}`,
          email: visitor.visitingUser.email,
          title: 'Visitor Checked In',
          message: `Visitor ${visitor.name} has checked in.`,
        });
      }

      // Notify building staff for VIP
      if (visitor.visitor_type === 'VIP' || visitor.visitor_type === 'VVIP') {
        await this.notifyBuildingStaff(visitor, 'VIP_CHECK_IN');
      }

      logger.info(`Visitor checked in: ${visitor_id}`);

      return updatedVisitor;
    } catch (error: any) {
      logger.error('Error checking in visitor:', error);
      throw error;
    }
  }

  /**
   * Check-out visitor
   */
  async checkOutVisitor(
    visitor_id: string,
    tenant_id: string,
    action_by: string,
    notes?: string
  ): Promise<Visitor> {
    try {
      const visitor = await this.visitorRepository.findOne({
        where: { id: visitor_id, tenant_id },
        relations: ['visitingUser'],
      });

      if (!visitor) {
        throw new Error('Visitor not found');
      }

      if (visitor.status !== 'CHECKED_IN') {
        throw new Error('Visitor must be checked in to check out');
      }

      visitor.status = 'CHECKED_OUT';
      visitor.check_out = new Date();
      visitor.visit_count = (visitor.visit_count || 0) + 1;

      const updatedVisitor = await this.visitorRepository.save(visitor);

      // Log activity
      await this.logActivity(visitor_id, action_by, 'CHECK_OUT', 'Visitor checked out', { notes });

      // Notify host
      if (visitor.visitingUser) {
        await emailService.sendNotificationEmail({
          name: `${visitor.visitingUser.first_name} ${visitor.visitingUser.last_name}`,
          email: visitor.visitingUser.email,
          title: 'Visitor Checked Out',
          message: `Visitor ${visitor.name} has checked out.`,
        });
      }

      logger.info(`Visitor checked out: ${visitor_id}`);

      return updatedVisitor;
    } catch (error: any) {
      logger.error('Error checking out visitor:', error);
      throw error;
    }
  }

  /**
   * Archive visitor
   */
  async archiveVisitor(visitor_id: string, tenant_id: string, admin_id: string): Promise<Visitor> {
    try {
      const visitor = await this.visitorRepository.findOne({
        where: { id: visitor_id, tenant_id },
      });

      if (!visitor) {
        throw new Error('Visitor not found');
      }

      visitor.status = 'ARCHIVED';

      const updatedVisitor = await this.visitorRepository.save(visitor);

      // Log activity
      await this.logActivity(visitor_id, admin_id, 'ARCHIVED', 'Visitor archived');

      logger.info(`Visitor archived: ${visitor_id} by admin ${admin_id}`);

      return updatedVisitor;
    } catch (error: any) {
      logger.error('Error archiving visitor:', error);
      throw error;
    }
  }

  /**
   * Get visitor activity log
   */
  async getVisitorActivityLog(visitor_id: string, tenant_id: string): Promise<VisitorActivityLog[]> {
    try {
      const visitor = await this.visitorRepository.findOne({
        where: { id: visitor_id, tenant_id },
      });

      if (!visitor) {
        throw new Error('Visitor not found');
      }

      const logs = await this.activityLogRepository.find({
        where: { visitor_id },
        relations: ['actionBy'],
        order: { created_at: 'DESC' },
      });

      return logs;
    } catch (error: any) {
      logger.error('Error fetching visitor activity log:', error);
      throw error;
    }
  }

  // ============================================
  // 2.4.3 KIOSK MANAGEMENT
  // ============================================

  /**
   * Add kiosk device
   */
  async addKiosk(
    tenant_id: string,
    data: {
      device_name: string;
      device_id: string;
      building_id?: string;
      floor_id?: string;
      registration_form_config?: Record<string, any>;
    }
  ): Promise<Kiosk> {
    try {
      const existingKiosk = await this.kioskRepository.findOne({
        where: { device_id: data.device_id },
      });

      if (existingKiosk) {
        throw new Error('Device ID already exists');
      }

      const kiosk = this.kioskRepository.create({
        tenant_id,
        device_name: data.device_name.trim(),
        device_id: data.device_id.trim(),
        building_id: data.building_id || (null as any),
        floor_id: data.floor_id || (null as any),
        registration_form_config: data.registration_form_config
          ? JSON.stringify(data.registration_form_config)
          : (null as any),
        status: 'offline',
      });

      const savedKiosk = await this.kioskRepository.save(kiosk);

      logger.info(`Kiosk added: ${savedKiosk.id} - ${savedKiosk.device_name} (Tenant: ${tenant_id})`);

      return savedKiosk;
    } catch (error: any) {
      logger.error('Error adding kiosk:', error);
      throw error;
    }
  }

  /**
   * Get kiosks
   */
  async getKiosks(tenant_id: string, options?: { building_id?: string; floor_id?: string }): Promise<Kiosk[]> {
    try {
      const queryBuilder = this.kioskRepository
        .createQueryBuilder('kiosk')
        .leftJoinAndSelect('kiosk.building', 'building')
        .leftJoinAndSelect('kiosk.floor', 'floor')
        .where('kiosk.tenant_id = :tenant_id', { tenant_id });

      if (options?.building_id) {
        queryBuilder.andWhere('kiosk.building_id = :building_id', {
          building_id: options.building_id,
        });
      }

      if (options?.floor_id) {
        queryBuilder.andWhere('kiosk.floor_id = :floor_id', { floor_id: options.floor_id });
      }

      return await queryBuilder.orderBy('kiosk.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching kiosks:', error);
      throw error;
    }
  }

  /**
   * Update kiosk status
   */
  async updateKioskStatus(
    kiosk_id: string,
    tenant_id: string,
    status: 'online' | 'offline'
  ): Promise<Kiosk> {
    try {
      const kiosk = await this.kioskRepository.findOne({
        where: { id: kiosk_id, tenant_id },
      });

      if (!kiosk) {
        throw new Error('Kiosk not found');
      }

      kiosk.status = status;
      kiosk.last_seen = new Date();

      const updatedKiosk = await this.kioskRepository.save(kiosk);

      logger.info(`Kiosk status updated: ${kiosk_id} to ${status}`);

      return updatedKiosk;
    } catch (error: any) {
      logger.error('Error updating kiosk status:', error);
      throw error;
    }
  }

  /**
   * Update kiosk registration form config
   */
  async updateKioskConfig(
    kiosk_id: string,
    tenant_id: string,
    registration_form_config: Record<string, any>
  ): Promise<Kiosk> {
    try {
      const kiosk = await this.kioskRepository.findOne({
        where: { id: kiosk_id, tenant_id },
      });

      if (!kiosk) {
        throw new Error('Kiosk not found');
      }

      kiosk.registration_form_config = JSON.stringify(registration_form_config);

      const updatedKiosk = await this.kioskRepository.save(kiosk);

      logger.info(`Kiosk config updated: ${kiosk_id}`);

      return updatedKiosk;
    } catch (error: any) {
      logger.error('Error updating kiosk config:', error);
      throw error;
    }
  }

  // ============================================
  // 2.4.4 STAFF MANAGEMENT
  // ============================================

  /**
   * Add building staff
   */
  async addBuildingStaff(
    tenant_id: string,
    data: {
      employee_code: string;
      name: string;
      mobile_number: string;
      building_id?: string;
      floor_id?: string;
      area?: string;
    }
  ): Promise<BuildingStaff> {
    try {
      const staff = this.buildingStaffRepository.create({
        tenant_id,
        employee_code: data.employee_code.trim(),
        name: data.name.trim(),
        mobile_number: data.mobile_number.trim(),
        building_id: data.building_id || (null as any),
        floor_id: data.floor_id || (null as any),
        area: data.area?.trim() || (null as any),
        is_active: true,
      });

      const savedStaff = await this.buildingStaffRepository.save(staff);

      logger.info(`Building staff added: ${savedStaff.id} - ${savedStaff.name} (Tenant: ${tenant_id})`);

      return savedStaff;
    } catch (error: any) {
      logger.error('Error adding building staff:', error);
      throw error;
    }
  }

  /**
   * Get building staff
   */
  async getBuildingStaff(
    tenant_id: string,
    options?: { building_id?: string; floor_id?: string; area?: string }
  ): Promise<BuildingStaff[]> {
    try {
      const queryBuilder = this.buildingStaffRepository
        .createQueryBuilder('staff')
        .leftJoinAndSelect('staff.building', 'building')
        .leftJoinAndSelect('staff.floor', 'floor')
        .where('staff.tenant_id = :tenant_id', { tenant_id })
        .andWhere('staff.is_active = :is_active', { is_active: true });

      if (options?.building_id) {
        queryBuilder.andWhere('staff.building_id = :building_id', {
          building_id: options.building_id,
        });
      }

      if (options?.floor_id) {
        queryBuilder.andWhere('staff.floor_id = :floor_id', { floor_id: options.floor_id });
      }

      if (options?.area) {
        queryBuilder.andWhere('staff.area = :area', { area: options.area });
      }

      return await queryBuilder.orderBy('staff.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching building staff:', error);
      throw error;
    }
  }

  /**
   * Update building staff
   */
  async updateBuildingStaff(
    staff_id: string,
    tenant_id: string,
    data: {
      employee_code?: string;
      name?: string;
      mobile_number?: string;
      building_id?: string;
      floor_id?: string;
      area?: string;
      is_active?: boolean;
    }
  ): Promise<BuildingStaff> {
    try {
      const staff = await this.buildingStaffRepository.findOne({
        where: { id: staff_id, tenant_id },
      });

      if (!staff) {
        throw new Error('Building staff not found');
      }

      if (data.employee_code) staff.employee_code = data.employee_code.trim();
      if (data.name) staff.name = data.name.trim();
      if (data.mobile_number) staff.mobile_number = data.mobile_number.trim();
      if (data.building_id !== undefined) staff.building_id = data.building_id || null;
      if (data.floor_id !== undefined) staff.floor_id = data.floor_id || null;
      if (data.area !== undefined) staff.area = data.area?.trim() || null;
      if (data.is_active !== undefined) staff.is_active = data.is_active;

      const updatedStaff = await this.buildingStaffRepository.save(staff);

      logger.info(`Building staff updated: ${staff_id}`);

      return updatedStaff;
    } catch (error: any) {
      logger.error('Error updating building staff:', error);
      throw error;
    }
  }

  /**
   * Delete building staff
   */
  async deleteBuildingStaff(staff_id: string, tenant_id: string): Promise<void> {
    try {
      const staff = await this.buildingStaffRepository.findOne({
        where: { id: staff_id, tenant_id },
      });

      if (!staff) {
        throw new Error('Building staff not found');
      }

      await this.buildingStaffRepository.remove(staff);

      logger.info(`Building staff deleted: ${staff_id}`);
    } catch (error: any) {
      logger.error('Error deleting building staff:', error);
      throw error;
    }
  }

  // ============================================
  // 2.4.5 RECEPTIONIST APPROVAL
  // ============================================

  /**
   * Approve receptionist
   */
  async approveReceptionist(
    receptionist_id: string,
    tenant_id: string,
    admin_id: string,
    building_id?: string,
    floor_id?: string
  ): Promise<Receptionist> {
    try {
      const receptionist = await this.receptionistRepository.findOne({
        where: { id: receptionist_id, tenant_id },
      });

      if (!receptionist) {
        throw new Error('Receptionist not found');
      }

      receptionist.approval_status = 'APPROVED';
      if (building_id) receptionist.building_id = building_id;
      if (floor_id) receptionist.floor_id = floor_id;

      const updatedReceptionist = await this.receptionistRepository.save(receptionist);

      // Send welcome email
      await emailService.sendNotificationEmail({
        name: receptionist.full_name,
        email: receptionist.email,
        title: 'Receptionist Account Approved',
        message: `Your receptionist account has been approved. You can now log in to the system.`,
      });

      logger.info(`Receptionist approved: ${receptionist_id} by admin ${admin_id}`);

      return updatedReceptionist;
    } catch (error: any) {
      logger.error('Error approving receptionist:', error);
      throw error;
    }
  }

  /**
   * Reject receptionist
   */
  async rejectReceptionist(receptionist_id: string, tenant_id: string, admin_id: string): Promise<Receptionist> {
    try {
      const receptionist = await this.receptionistRepository.findOne({
        where: { id: receptionist_id, tenant_id },
      });

      if (!receptionist) {
        throw new Error('Receptionist not found');
      }

      receptionist.approval_status = 'REJECTED';

      const updatedReceptionist = await this.receptionistRepository.save(receptionist);

      logger.info(`Receptionist rejected: ${receptionist_id} by admin ${admin_id}`);

      return updatedReceptionist;
    } catch (error: any) {
      logger.error('Error rejecting receptionist:', error);
      throw error;
    }
  }

  /**
   * Get receptionists
   */
  async getReceptionists(
    tenant_id: string,
    options?: { building_id?: string; floor_id?: string; approval_status?: string }
  ): Promise<Receptionist[]> {
    try {
      const queryBuilder = this.receptionistRepository
        .createQueryBuilder('receptionist')
        .leftJoinAndSelect('receptionist.building', 'building')
        .leftJoinAndSelect('receptionist.floor', 'floor')
        .where('receptionist.tenant_id = :tenant_id', { tenant_id });

      if (options?.building_id) {
        queryBuilder.andWhere('receptionist.building_id = :building_id', {
          building_id: options.building_id,
        });
      }

      if (options?.floor_id) {
        queryBuilder.andWhere('receptionist.floor_id = :floor_id', { floor_id: options.floor_id });
      }

      if (options?.approval_status) {
        queryBuilder.andWhere('receptionist.approval_status = :approval_status', {
          approval_status: options.approval_status,
        });
      }

      return await queryBuilder.orderBy('receptionist.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching receptionists:', error);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Generate QR code
   */
  private generateQRCode(): string {
    return `QR-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  /**
   * Generate WiFi password
   */
  private generateWiFiPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Log activity
   */
  private async logActivity(
    visitor_id: string,
    action_by: string | null,
    action: string,
    notes?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const log = this.activityLogRepository.create({
        visitor_id,
        action_by: action_by || (null as any),
        action,
        notes: notes || (null as any),
        metadata: metadata ? JSON.stringify(metadata) : (null as any),
      });

      await this.activityLogRepository.save(log);
    } catch (error: any) {
      logger.error('Error logging activity:', error);
      // Don't throw - logging should not break the main flow
    }
  }

  /**
   * Notify host
   */
  private async notifyHost(visitor: Visitor, host: User, event: string): Promise<void> {
    try {
      let title = 'Visitor Update';
      let message = `Visitor ${visitor.name} status updated.`;

      switch (event) {
        case 'NEW_VISITOR_REQUEST':
          title = 'New Visitor Request';
          message = `A new visitor request has been submitted for ${visitor.name}.`;
          break;
        case 'VISITOR_APPROVED':
          title = 'Visitor Approved';
          message = `Visitor ${visitor.name} has been approved.`;
          break;
        case 'VISITOR_REJECTED':
          title = 'Visitor Rejected';
          message = `Visitor ${visitor.name} has been rejected.`;
          break;
      }

      await emailService.sendNotificationEmail({
        name: `${host.first_name} ${host.last_name}`,
        email: host.email,
        title,
        message,
      });
    } catch (error: any) {
      logger.error('Error notifying host:', error);
    }
  }

  /**
   * Notify admins
   */
  private async notifyAdmins(visitor: Visitor, event: string): Promise<void> {
    try {
      const admins = await this.getDwarAdmins(visitor.tenant_id!);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Visitor Approval Required',
          message: `A new visitor request requires approval: ${visitor.name}`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying admins:', error);
    }
  }

  /**
   * Notify building staff
   */
  private async notifyBuildingStaff(visitor: Visitor, event: string): Promise<void> {
    try {
      const staff = await this.getBuildingStaff(visitor.tenant_id!, {
        building_id: visitor.building_id || undefined,
        floor_id: visitor.floor_id || undefined,
      });

      for (const staffMember of staff) {
        // Send SMS or email notification
        await emailService.sendNotificationEmail({
          name: staffMember.name,
          email: '', // Building staff might not have email, would need SMS service
          title: 'VIP Visitor Alert',
          message: `VIP visitor ${visitor.name} has checked in.`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying building staff:', error);
    }
  }

  /**
   * Get DWAR admins
   */
  private async getDwarAdmins(tenant_id: string): Promise<Admin[]> {
    try {
      const allAdmins = await this.adminRepository.find({
        where: { tenant_id, is_active: true },
      });

      return allAdmins.filter(
        (admin) =>
          admin.is_super_admin ||
          admin.module_scope === 'DWAR' ||
          admin.module_scope === 'ALL'
      );
    } catch (error: any) {
      logger.error('Error fetching DWAR admins:', error);
      return [];
    }
  }
}

// Export singleton instance
export const visitorService = new VisitorService();

