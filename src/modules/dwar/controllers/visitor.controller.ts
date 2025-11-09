// Visitor Management Controller
import { Request, Response } from 'express';
import { visitorService } from '../services/visitor.service';
import { ApiResponseUtil } from '../../../utils/apiResponse';
import { logger } from '../../../config/logger';

export class VisitorController {
  // ============================================
  // 2.1 VISITOR REGISTRATION
  // ============================================

  /**
   * Register visitor
   * POST /api/v1/dwar/visitors
   * Role: User, Admin, Receptionist
   */
  async registerVisitor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const {
        name,
        contact_no,
        email,
        visitor_type,
        purpose,
        visiting_user_id,
        registration_mode,
        visitor_photo_url,
        visitor_id_photo_url,
        digital_signature,
        device_object_carrying,
        additional_comments,
        custom_fields,
        receptionist_id,
        kiosk_id,
        access_areas,
        qr_code_type,
        max_visits_allowed,
        expected_date_time,
        assigned_room_id,
        food_arrangements,
        escort_bouquet_options,
        airport_cab_pickup,
        vehicle_number,
        remarks,
        group_visitors,
        building_id,
        floor_id,
      } = req.body;

      if (!name || !contact_no || !visitor_type || !purpose || !visiting_user_id || !registration_mode) {
        return ApiResponseUtil.error(
          res,
          new Error(
            'Missing required fields: name, contact_no, visitor_type, purpose, visiting_user_id, registration_mode'
          ),
          400
        );
      }

      // Validate registration mode
      const validModes = ['walk-in', 'pre-registration', 'self-checkin', 'bulk'];
      if (!validModes.includes(registration_mode)) {
        return ApiResponseUtil.error(res, new Error('Invalid registration_mode'), 400);
      }

      // Set receptionist_id for walk-in
      // Receptionist ID should be provided in the request for walk-in mode
      const finalReceptionistId = receptionist_id;

      const visitor = await visitorService.registerVisitor(tenant_id, {
        name,
        contact_no,
        email,
        visitor_type,
        purpose,
        visiting_user_id,
        registration_mode,
        visitor_photo_url,
        visitor_id_photo_url,
        digital_signature,
        device_object_carrying,
        additional_comments,
        custom_fields,
        receptionist_id: finalReceptionistId,
        kiosk_id,
        access_areas,
        qr_code_type,
        max_visits_allowed,
        expected_date_time: expected_date_time ? new Date(expected_date_time) : undefined,
        assigned_room_id,
        food_arrangements,
        escort_bouquet_options,
        airport_cab_pickup,
        vehicle_number,
        remarks,
        group_visitors,
        building_id,
        floor_id,
      });

      ApiResponseUtil.success(res, visitor, 'Visitor registered successfully');
    } catch (error: any) {
      logger.error('Error in registerVisitor:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to register visitor');
    }
  }

  /**
   * Get visitors
   * GET /api/v1/dwar/visitors
   * Role: Admin
   */
  async getVisitors(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const {
        visitor_name,
        host_name,
        visitor_type,
        status,
        date_from,
        date_to,
        registration_mode,
        building_id,
        floor_id,
        search,
      } = req.query;

      const visitors = await visitorService.getVisitors(tenant_id, {
        visitor_name: visitor_name as string,
        host_name: host_name as string,
        visitor_type: visitor_type as string,
        status: status as string,
        date_from: date_from ? new Date(date_from as string) : undefined,
        date_to: date_to ? new Date(date_to as string) : undefined,
        registration_mode: registration_mode as string,
        building_id: building_id as string,
        floor_id: floor_id as string,
        search: search as string,
      });

      ApiResponseUtil.success(res, visitors, 'Visitors retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getVisitors:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch visitors');
    }
  }

  /**
   * Get visitor by ID
   * GET /api/v1/dwar/visitors/:id
   * Role: All authenticated users
   */
  async getVisitorById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const visitor = await visitorService.getVisitorById(id, tenant_id);

      if (!visitor) {
        return ApiResponseUtil.notFound(res, 'Visitor not found');
      }

      // Check permissions: user can only see their own visitors unless admin
      if (
        req.user.type !== 'admin' &&
        req.user.type !== 'super_admin' &&
        visitor.visiting_user !== req.user.id
      ) {
        return ApiResponseUtil.forbidden(res, 'You do not have permission to view this visitor');
      }

      ApiResponseUtil.success(res, visitor, 'Visitor retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getVisitorById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch visitor');
    }
  }

  /**
   * Get user's visitors (Employee Journey)
   * GET /api/v1/dwar/visitors/my-visitors
   * Role: User
   */
  async getUserVisitors(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can view their visitors');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { status, date_from, date_to } = req.query;

      const visitors = await visitorService.getUserVisitors(tenant_id, req.user.id, {
        status: status as string,
        date_from: date_from ? new Date(date_from as string) : undefined,
        date_to: date_to ? new Date(date_to as string) : undefined,
      });

      ApiResponseUtil.success(res, visitors, 'Visitors retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUserVisitors:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch visitors');
    }
  }

  // ============================================
  // 2.4 ADMIN JOURNEY - VISITOR MANAGEMENT
  // ============================================

  /**
   * Approve visitor
   * PUT /api/v1/dwar/visitors/:id/approve
   * Role: Admin
   */
  async approveVisitor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can approve visitors');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { admin_notes } = req.body;

      const visitor = await visitorService.approveVisitor(id, tenant_id, req.user.id, admin_notes);

      ApiResponseUtil.success(res, visitor, 'Visitor approved successfully');
    } catch (error: any) {
      logger.error('Error in approveVisitor:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to approve visitor');
    }
  }

  /**
   * Reject visitor
   * PUT /api/v1/dwar/visitors/:id/reject
   * Role: Admin
   */
  async rejectVisitor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can reject visitors');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { reason } = req.body;

      const visitor = await visitorService.rejectVisitor(id, tenant_id, req.user.id, reason);

      ApiResponseUtil.success(res, visitor, 'Visitor rejected successfully');
    } catch (error: any) {
      logger.error('Error in rejectVisitor:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to reject visitor');
    }
  }

  /**
   * Update visitor host
   * PUT /api/v1/dwar/visitors/:id/host
   * Role: Admin
   */
  async updateVisitorHost(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update visitor host');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { new_host_id } = req.body;

      if (!new_host_id) {
        return ApiResponseUtil.error(res, new Error('Missing required field: new_host_id'), 400);
      }

      const visitor = await visitorService.updateVisitorHost(id, tenant_id, req.user.id, new_host_id);

      ApiResponseUtil.success(res, visitor, 'Visitor host updated successfully');
    } catch (error: any) {
      logger.error('Error in updateVisitorHost:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update visitor host');
    }
  }

  /**
   * Check-in visitor
   * POST /api/v1/dwar/visitors/:id/check-in
   * Role: Admin, Receptionist
   */
  async checkInVisitor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { notes } = req.body;

      const visitor = await visitorService.checkInVisitor(id, tenant_id, req.user.id, notes);

      ApiResponseUtil.success(res, visitor, 'Visitor checked in successfully');
    } catch (error: any) {
      logger.error('Error in checkInVisitor:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to check in visitor');
    }
  }

  /**
   * Check-out visitor
   * POST /api/v1/dwar/visitors/:id/check-out
   * Role: Admin, Receptionist
   */
  async checkOutVisitor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { notes } = req.body;

      const visitor = await visitorService.checkOutVisitor(id, tenant_id, req.user.id, notes);

      ApiResponseUtil.success(res, visitor, 'Visitor checked out successfully');
    } catch (error: any) {
      logger.error('Error in checkOutVisitor:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to check out visitor');
    }
  }

  /**
   * Archive visitor
   * PUT /api/v1/dwar/visitors/:id/archive
   * Role: Admin
   */
  async archiveVisitor(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can archive visitors');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const visitor = await visitorService.archiveVisitor(id, tenant_id, req.user.id);

      ApiResponseUtil.success(res, visitor, 'Visitor archived successfully');
    } catch (error: any) {
      logger.error('Error in archiveVisitor:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to archive visitor');
    }
  }

  /**
   * Get visitor activity log
   * GET /api/v1/dwar/visitors/:id/activity-log
   * Role: Admin, User (own visitors)
   */
  async getVisitorActivityLog(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      // Check permissions
      const visitor = await visitorService.getVisitorById(id, tenant_id);
      if (!visitor) {
        return ApiResponseUtil.notFound(res, 'Visitor not found');
      }

      if (
        req.user.type !== 'admin' &&
        req.user.type !== 'super_admin' &&
        visitor.visiting_user !== req.user.id
      ) {
        return ApiResponseUtil.forbidden(res, 'You do not have permission to view this activity log');
      }

      const logs = await visitorService.getVisitorActivityLog(id, tenant_id);

      ApiResponseUtil.success(res, logs, 'Activity log retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getVisitorActivityLog:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch activity log');
    }
  }

  // ============================================
  // 2.4.3 KIOSK MANAGEMENT
  // ============================================

  /**
   * Add kiosk
   * POST /api/v1/dwar/kiosks
   * Role: Admin
   */
  async addKiosk(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can add kiosks');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { device_name, device_id, building_id, floor_id, registration_form_config } = req.body;

      if (!device_name || !device_id) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: device_name, device_id'), 400);
      }

      const kiosk = await visitorService.addKiosk(tenant_id, {
        device_name,
        device_id,
        building_id,
        floor_id,
        registration_form_config,
      });

      ApiResponseUtil.success(res, kiosk, 'Kiosk added successfully');
    } catch (error: any) {
      logger.error('Error in addKiosk:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to add kiosk');
    }
  }

  /**
   * Get kiosks
   * GET /api/v1/dwar/kiosks
   * Role: Admin
   */
  async getKiosks(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view kiosks');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { building_id, floor_id } = req.query;

      const kiosks = await visitorService.getKiosks(tenant_id, {
        building_id: building_id as string,
        floor_id: floor_id as string,
      });

      ApiResponseUtil.success(res, kiosks, 'Kiosks retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getKiosks:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch kiosks');
    }
  }

  /**
   * Update kiosk status
   * PUT /api/v1/dwar/kiosks/:id/status
   * Role: Admin
   */
  async updateKioskStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update kiosk status');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || (status !== 'online' && status !== 'offline')) {
        return ApiResponseUtil.error(res, new Error('Invalid status. Must be online or offline'), 400);
      }

      const kiosk = await visitorService.updateKioskStatus(id, tenant_id, status);

      ApiResponseUtil.success(res, kiosk, 'Kiosk status updated successfully');
    } catch (error: any) {
      logger.error('Error in updateKioskStatus:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update kiosk status');
    }
  }

  /**
   * Update kiosk config
   * PUT /api/v1/dwar/kiosks/:id/config
   * Role: Admin
   */
  async updateKioskConfig(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update kiosk config');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { registration_form_config } = req.body;

      if (!registration_form_config) {
        return ApiResponseUtil.error(
          res,
          new Error('Missing required field: registration_form_config'),
          400
        );
      }

      const kiosk = await visitorService.updateKioskConfig(id, tenant_id, registration_form_config);

      ApiResponseUtil.success(res, kiosk, 'Kiosk config updated successfully');
    } catch (error: any) {
      logger.error('Error in updateKioskConfig:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update kiosk config');
    }
  }

  // ============================================
  // 2.4.4 STAFF MANAGEMENT
  // ============================================

  /**
   * Add building staff
   * POST /api/v1/dwar/staff
   * Role: Admin
   */
  async addBuildingStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can add building staff');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { employee_code, name, mobile_number, building_id, floor_id, area } = req.body;

      if (!employee_code || !name || !mobile_number) {
        return ApiResponseUtil.error(
          res,
          new Error('Missing required fields: employee_code, name, mobile_number'),
          400
        );
      }

      const staff = await visitorService.addBuildingStaff(tenant_id, {
        employee_code,
        name,
        mobile_number,
        building_id,
        floor_id,
        area,
      });

      ApiResponseUtil.success(res, staff, 'Building staff added successfully');
    } catch (error: any) {
      logger.error('Error in addBuildingStaff:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to add building staff');
    }
  }

  /**
   * Get building staff
   * GET /api/v1/dwar/staff
   * Role: Admin
   */
  async getBuildingStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view building staff');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { building_id, floor_id, area } = req.query;

      const staff = await visitorService.getBuildingStaff(tenant_id, {
        building_id: building_id as string,
        floor_id: floor_id as string,
        area: area as string,
      });

      ApiResponseUtil.success(res, staff, 'Building staff retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getBuildingStaff:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch building staff');
    }
  }

  /**
   * Update building staff
   * PUT /api/v1/dwar/staff/:id
   * Role: Admin
   */
  async updateBuildingStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update building staff');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { employee_code, name, mobile_number, building_id, floor_id, area, is_active } = req.body;

      const staff = await visitorService.updateBuildingStaff(id, tenant_id, {
        employee_code,
        name,
        mobile_number,
        building_id,
        floor_id,
        area,
        is_active,
      });

      ApiResponseUtil.success(res, staff, 'Building staff updated successfully');
    } catch (error: any) {
      logger.error('Error in updateBuildingStaff:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update building staff');
    }
  }

  /**
   * Delete building staff
   * DELETE /api/v1/dwar/staff/:id
   * Role: Admin
   */
  async deleteBuildingStaff(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can delete building staff');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      await visitorService.deleteBuildingStaff(id, tenant_id);

      ApiResponseUtil.success(res, null, 'Building staff deleted successfully');
    } catch (error: any) {
      logger.error('Error in deleteBuildingStaff:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to delete building staff');
    }
  }

  // ============================================
  // 2.4.5 RECEPTIONIST APPROVAL
  // ============================================

  /**
   * Approve receptionist
   * PUT /api/v1/dwar/receptionists/:id/approve
   * Role: Admin
   */
  async approveReceptionist(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can approve receptionists');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { building_id, floor_id } = req.body;

      const receptionist = await visitorService.approveReceptionist(
        id,
        tenant_id,
        req.user.id,
        building_id,
        floor_id
      );

      ApiResponseUtil.success(res, receptionist, 'Receptionist approved successfully');
    } catch (error: any) {
      logger.error('Error in approveReceptionist:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to approve receptionist');
    }
  }

  /**
   * Reject receptionist
   * PUT /api/v1/dwar/receptionists/:id/reject
   * Role: Admin
   */
  async rejectReceptionist(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can reject receptionists');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const receptionist = await visitorService.rejectReceptionist(id, tenant_id, req.user.id);

      ApiResponseUtil.success(res, receptionist, 'Receptionist rejected successfully');
    } catch (error: any) {
      logger.error('Error in rejectReceptionist:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to reject receptionist');
    }
  }

  /**
   * Get receptionists
   * GET /api/v1/dwar/receptionists
   * Role: Admin
   */
  async getReceptionists(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view receptionists');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { building_id, floor_id, approval_status } = req.query;

      const receptionists = await visitorService.getReceptionists(tenant_id, {
        building_id: building_id as string,
        floor_id: floor_id as string,
        approval_status: approval_status as string,
      });

      ApiResponseUtil.success(res, receptionists, 'Receptionists retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getReceptionists:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch receptionists');
    }
  }
}

// Export singleton instance
export const visitorController = new VisitorController();

