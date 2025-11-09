// Request controller
import { Request, Response } from 'express';
import { RequestService } from './request.service';
import { logger } from '../../config/logger';
import { ApiResponseUtil } from '../../utils/apiResponse';

const requestService = new RequestService();

export class RequestController {
  /**
   * Create a new request (user only)
   * POST /api/v1/auth/requests
   */
  async createRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can create requests
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { employee_name, employee_id, module_scope, description, company, department } = req.body;

      if (!description || !description.trim()) {
        return ApiResponseUtil.validationError(res, ['Description is required']);
      }

      const request = await requestService.createRequest({
        user_id: req.user.id,
        tenant_id,
        employee_name,
        employee_id,
        module_scope,
        description,
        company,
        department,
      });

      ApiResponseUtil.created(res, {
        id: request.id,
        employee_name: request.employee_name,
        employee_id: request.employee_id,
        module_scope: request.module_scope,
        description: request.description,
        company: request.company,
        department: request.department,
        status: request.status,
        created_at: request.created_at,
      }, 'Request created successfully');
    } catch (error: any) {
      logger.error('Error in createRequest:', error);
      ApiResponseUtil.error(res, error, 400, 'Failed to create request');
    }
  }

  /**
   * Get all requests for the current user
   * GET /api/v1/auth/requests
   * GET /api/v1/requests (unified endpoint for users)
   */
  async getUserRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can view their requests
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      logger.info(`Fetching user requests for user: ${req.user.id}, tenant: ${tenant_id}`);

      const requests = await requestService.getUserRequests(req.user.id, tenant_id);

      logger.info(`Found ${requests.length} requests for user ${req.user.id}`);

      ApiResponseUtil.success(res, {
        count: requests.length,
        requests: requests.map((request) => ({
          id: request.id,
          employee_name: request.employee_name,
          employee_id: request.employee_id,
          module_scope: request.module_scope,
          description: request.description,
          company: request.company,
          department: request.department,
          status: request.status,
          admin_comments: request.admin_comments,
          created_at: request.created_at,
          updated_at: request.updated_at,
        })),
      }, 'Requests retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUserRequests:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch requests');
    }
  }

  /**
   * Get a single request by ID (user)
   * GET /api/v1/auth/requests/:id
   */
  async getUserRequestById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can view their requests
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      const request = await requestService.getRequestById(id, tenant_id, req.user.id);

      if (!request) {
        return ApiResponseUtil.notFound(res, 'Request not found');
      }

      ApiResponseUtil.success(res, {
        id: request.id,
        employee_name: request.employee_name,
        employee_id: request.employee_id,
        module_scope: request.module_scope,
        description: request.description,
        company: request.company,
        department: request.department,
        status: request.status,
        admin_comments: request.admin_comments,
        created_at: request.created_at,
        updated_at: request.updated_at,
      }, 'Request retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUserRequestById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch request');
    }
  }

  /**
   * Get all requests for the tenant (superadmin)
   * GET /api/v1/admin/requests
   * GET /api/v1/requests (unified endpoint for superadmin)
   */
  async getTenantRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can view all requests
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can view all requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const status = req.query.status as string | undefined;
      const module_scope = req.query.module_scope as string | undefined;
      const department = req.query.department as string | undefined;

      logger.info(`Fetching tenant requests for tenant: ${tenant_id}, filters: status=${status}, module_scope=${module_scope}, department=${department}`);

      const requests = await requestService.getTenantRequests(tenant_id, {
        status,
        module_scope,
        department,
      });

      logger.info(`Found ${requests.length} requests for tenant ${tenant_id}`);

      ApiResponseUtil.success(res, {
        count: requests.length,
        requests: requests.map((request) => ({
          id: request.id,
          employee_name: request.employee_name,
          employee_id: request.employee_id,
          module_scope: request.module_scope,
          description: request.description,
          company: request.company,
          department: request.department,
          status: request.status,
          admin_comments: request.admin_comments,
          user_id: request.user_id,
          created_at: request.created_at,
          updated_at: request.updated_at,
        })),
      }, 'Requests retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getTenantRequests:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch requests');
    }
  }

  /**
   * Get a single request by ID (superadmin)
   * GET /api/v1/admin/requests/:id
   */
  async getRequestById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can view request details
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can view request details');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      const request = await requestService.getRequestById(id, tenant_id);

      if (!request) {
        return ApiResponseUtil.notFound(res, 'Request not found');
      }

      ApiResponseUtil.success(res, {
        id: request.id,
        employee_name: request.employee_name,
        employee_id: request.employee_id,
        module_scope: request.module_scope,
        description: request.description,
        company: request.company,
        department: request.department,
        status: request.status,
        admin_comments: request.admin_comments,
        user_id: request.user_id,
        created_at: request.created_at,
        updated_at: request.updated_at,
      }, 'Request retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getRequestById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch request');
    }
  }

  /**
   * Approve a request (superadmin only)
   * PUT /api/v1/admin/requests/:id/approve
   */
  async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can approve requests
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can approve requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      const { admin_comments } = req.body;

      const request = await requestService.approveRequest(id, tenant_id, req.user.id, admin_comments);

      ApiResponseUtil.success(res, {
        id: request.id,
        employee_name: request.employee_name,
        employee_id: request.employee_id,
        module_scope: request.module_scope,
        description: request.description,
        company: request.company,
        department: request.department,
        status: request.status,
        admin_comments: request.admin_comments,
        created_at: request.created_at,
        updated_at: request.updated_at,
      }, 'Request approved successfully');
    } catch (error: any) {
      logger.error('Error in approveRequest:', error);
      
      if (error.message && (error.message.includes('not found') || error.message.includes('already'))) {
        return ApiResponseUtil.error(res, error, 400, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to approve request');
    }
  }

  /**
   * Reject a request (superadmin only)
   * PUT /api/v1/admin/requests/:id/reject
   */
  async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can reject requests
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can reject requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      const { admin_comments } = req.body;

      const request = await requestService.rejectRequest(id, tenant_id, req.user.id, admin_comments);

      ApiResponseUtil.success(res, {
        id: request.id,
        employee_name: request.employee_name,
        employee_id: request.employee_id,
        module_scope: request.module_scope,
        description: request.description,
        company: request.company,
        department: request.department,
        status: request.status,
        admin_comments: request.admin_comments,
        created_at: request.created_at,
        updated_at: request.updated_at,
      }, 'Request rejected successfully');
    } catch (error: any) {
      logger.error('Error in rejectRequest:', error);
      
      if (error.message && (error.message.includes('not found') || error.message.includes('already'))) {
        return ApiResponseUtil.error(res, error, 400, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to reject request');
    }
  }
}

