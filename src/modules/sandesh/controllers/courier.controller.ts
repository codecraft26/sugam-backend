// Courier controller
import { Request, Response } from 'express';
import { courierService } from '../services/courier.service';
import { ApiResponseUtil } from '../../../utils/apiResponse';
import { logger } from '../../../config/logger';

export class CourierController {
  // ============================================
  // 4.1 COURIER MANAGEMENT (Receptionist/Admin)
  // ============================================

  /**
   * Add courier
   * POST /api/v1/sandesh/couriers
   * Role: Admin
   */
  async addCourier(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can add couriers');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const {
        courier_type,
        receiver_id,
        tracking_no,
        courier_name,
        courier_partner_name,
        sender,
        company_name,
        company_code,
        status,
        received_at,
        comments,
        courier_request_id,
      } = req.body;

      if (!courier_type || !receiver_id || !tracking_no) {
        return ApiResponseUtil.error(
          res,
          new Error('Missing required fields: courier_type, receiver_id, tracking_no'),
          400
        );
      }

      if (courier_type !== 'INCOMING' && courier_type !== 'OUTGOING') {
        return ApiResponseUtil.error(res, new Error('courier_type must be INCOMING or OUTGOING'), 400);
      }

      const courier = await courierService.addCourier(tenant_id, req.user.id, {
        courier_type,
        receiver_id,
        tracking_no,
        courier_name,
        courier_partner_name,
        sender,
        company_name,
        company_code,
        status,
        received_at: received_at ? new Date(received_at) : undefined,
        comments,
        courier_request_id,
      });

      ApiResponseUtil.success(res, courier, 'Courier added successfully');
    } catch (error: any) {
      logger.error('Error in addCourier:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to add courier');
    }
  }

  /**
   * Update courier status
   * PUT /api/v1/sandesh/couriers/:id/status
   * Role: Admin
   */
  async updateCourierStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update courier status');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { status, admin_notes } = req.body;

      if (!status) {
        return ApiResponseUtil.error(res, new Error('Missing required field: status'), 400);
      }

      const validStatuses = ['RECEIVED', 'IN_TRANSIT', 'DELIVERED', 'PENDING'];
      if (!validStatuses.includes(status)) {
        return ApiResponseUtil.error(res, new Error('Invalid status'), 400);
      }

      const courier = await courierService.updateCourierStatus(
        id,
        tenant_id,
        req.user.id,
        status,
        admin_notes
      );

      ApiResponseUtil.success(res, courier, 'Courier status updated successfully');
    } catch (error: any) {
      logger.error('Error in updateCourierStatus:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update courier status');
    }
  }

  /**
   * Get all couriers
   * GET /api/v1/sandesh/couriers
   * Role: Admin
   */
  async getCouriers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { tracking_code, employee_id, status, courier_type, date_from, date_to, search } = req.query;

      const couriers = await courierService.getCouriers(tenant_id, {
        tracking_code: tracking_code as string,
        employee_id: employee_id as string,
        status: status as string,
        courier_type: courier_type as 'INCOMING' | 'OUTGOING',
        date_from: date_from ? new Date(date_from as string) : undefined,
        date_to: date_to ? new Date(date_to as string) : undefined,
        search: search as string,
      });

      ApiResponseUtil.success(res, couriers, 'Couriers retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getCouriers:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch couriers');
    }
  }

  /**
   * Get courier by ID
   * GET /api/v1/sandesh/couriers/:id
   * Role: All authenticated users
   */
  async getCourierById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const courier = await courierService.getCourierById(id, tenant_id);

      if (!courier) {
        return ApiResponseUtil.notFound(res, 'Courier not found');
      }

      // Check if user is receiver or admin
      if (req.user.type !== 'admin' && req.user.type !== 'super_admin' && courier.receiver_id !== req.user.id) {
        return ApiResponseUtil.forbidden(res, 'You do not have permission to view this courier');
      }

      ApiResponseUtil.success(res, courier, 'Courier retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getCourierById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch courier');
    }
  }

  /**
   * Get unclaimed couriers
   * GET /api/v1/sandesh/couriers/unclaimed
   * Role: Admin
   */
  async getUnclaimedCouriers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view unclaimed couriers');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const couriers = await courierService.getUnclaimedCouriers(tenant_id);

      ApiResponseUtil.success(res, couriers, 'Unclaimed couriers retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUnclaimedCouriers:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch unclaimed couriers');
    }
  }

  /**
   * Mark courier as claimed
   * PUT /api/v1/sandesh/couriers/:id/claim
   * Role: Admin
   */
  async markAsClaimed(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can mark couriers as claimed');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const courier = await courierService.markAsClaimed(id, tenant_id);

      ApiResponseUtil.success(res, courier, 'Courier marked as claimed successfully');
    } catch (error: any) {
      logger.error('Error in markAsClaimed:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to mark courier as claimed');
    }
  }

  // ============================================
  // 4.2 COURIER REQUEST (Employee)
  // ============================================

  /**
   * Create courier request
   * POST /api/v1/sandesh/requests
   * Role: User
   */
  async createRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can create courier requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { courier_type, intended_recipient, message, company_name, company_code } = req.body;

      if (!courier_type) {
        return ApiResponseUtil.error(res, new Error('Missing required field: courier_type'), 400);
      }

      if (courier_type !== 'INCOMING' && courier_type !== 'OUTGOING') {
        return ApiResponseUtil.error(res, new Error('courier_type must be INCOMING or OUTGOING'), 400);
      }

      const request = await courierService.createRequest(tenant_id, req.user.id, {
        courier_type,
        intended_recipient,
        message,
        company_name,
        company_code,
      });

      ApiResponseUtil.success(res, request, 'Courier request created successfully');
    } catch (error: any) {
      logger.error('Error in createRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to create courier request');
    }
  }

  /**
   * Get user's courier requests
   * GET /api/v1/sandesh/requests
   * Role: User
   */
  async getUserRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can view their requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { status, courier_type } = req.query;

      const requests = await courierService.getUserRequests(tenant_id, req.user.id, {
        status: status as string,
        courier_type: courier_type as 'INCOMING' | 'OUTGOING',
      });

      ApiResponseUtil.success(res, requests, 'Requests retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUserRequests:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch requests');
    }
  }

  /**
   * Cancel courier request
   * PUT /api/v1/sandesh/requests/:id/cancel
   * Role: User
   */
  async cancelRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can cancel their requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const request = await courierService.cancelRequest(id, tenant_id, req.user.id);

      ApiResponseUtil.success(res, request, 'Request canceled successfully');
    } catch (error: any) {
      logger.error('Error in cancelRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to cancel request');
    }
  }

  // ============================================
  // 4.3 REQUEST HANDLING (Receptionist/Admin)
  // ============================================

  /**
   * Get pending courier requests
   * GET /api/v1/sandesh/requests/pending
   * Role: Admin
   */
  async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view pending requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const requests = await courierService.getPendingRequests(tenant_id);

      ApiResponseUtil.success(res, requests, 'Pending requests retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getPendingRequests:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch pending requests');
    }
  }

  /**
   * Approve courier request
   * PUT /api/v1/sandesh/requests/:id/approve
   * Role: Admin
   */
  async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can approve requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { tracking_no, courier_name, courier_partner_name, sender, comments } = req.body;

      if (!tracking_no) {
        return ApiResponseUtil.error(res, new Error('Missing required field: tracking_no'), 400);
      }

      const result = await courierService.approveRequest(id, tenant_id, req.user.id, tracking_no, {
        courier_name,
        courier_partner_name,
        sender,
        comments,
      });

      ApiResponseUtil.success(res, result, 'Request approved and courier created successfully');
    } catch (error: any) {
      logger.error('Error in approveRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to approve request');
    }
  }

  /**
   * Reject courier request
   * PUT /api/v1/sandesh/requests/:id/reject
   * Role: Admin
   */
  async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can reject requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { reason } = req.body;

      const request = await courierService.rejectRequest(id, tenant_id, req.user.id, reason);

      ApiResponseUtil.success(res, request, 'Request rejected successfully');
    } catch (error: any) {
      logger.error('Error in rejectRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to reject request');
    }
  }

  // ============================================
  // 4.4 ACKNOWLEDGMENT (Employee)
  // ============================================

  /**
   * Acknowledge courier receipt
   * POST /api/v1/sandesh/couriers/:id/acknowledge
   * Role: User
   */
  async acknowledgeCourier(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can acknowledge couriers');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { check_in_popup, digital_signature } = req.body;

      const acknowledgment = await courierService.acknowledgeCourier(id, tenant_id, req.user.id, {
        check_in_popup,
        digital_signature,
      });

      ApiResponseUtil.success(res, acknowledgment, 'Courier acknowledged successfully');
    } catch (error: any) {
      logger.error('Error in acknowledgeCourier:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to acknowledge courier');
    }
  }

  /**
   * Get acknowledgment by courier ID
   * GET /api/v1/sandesh/couriers/:id/acknowledgment
   * Role: User, Admin
   */
  async getAcknowledgment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const acknowledgment = await courierService.getAcknowledgment(id, tenant_id);

      if (!acknowledgment) {
        return ApiResponseUtil.notFound(res, 'Acknowledgment not found');
      }

      ApiResponseUtil.success(res, acknowledgment, 'Acknowledgment retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getAcknowledgment:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch acknowledgment');
    }
  }

  // ============================================
  // SYSTEM CONFIG (Admin)
  // ============================================

  /**
   * Get system config
   * GET /api/v1/sandesh/config/:key
   * Role: Super Admin
   */
  async getSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'super_admin' && req.user.type !== 'platform_admin') {
        return ApiResponseUtil.forbidden(res, 'Only super admins can view system config');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { key } = req.params;

      const value = await courierService.getSystemConfig(tenant_id, key);

      ApiResponseUtil.success(res, { key, value }, 'System config retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getSystemConfig:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch system config');
    }
  }

  /**
   * Set system config
   * POST /api/v1/sandesh/config
   * Role: Super Admin
   */
  async setSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'super_admin' && req.user.type !== 'platform_admin') {
        return ApiResponseUtil.forbidden(res, 'Only super admins can set system config');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { config_key, config_value, config_type, description } = req.body;

      if (!config_key || config_value === undefined) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: config_key, config_value'), 400);
      }

      const config = await courierService.setSystemConfig(
        tenant_id,
        config_key,
        config_value,
        config_type || 'STRING',
        description
      );

      ApiResponseUtil.success(res, config, 'System config set successfully');
    } catch (error: any) {
      logger.error('Error in setSystemConfig:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to set system config');
    }
  }
}

// Export singleton instance
export const courierController = new CourierController();

