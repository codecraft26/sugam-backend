// User authentication controller
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { AdminService } from '../admin/admin.service';
import { AppDataSource } from '../../config/data-source';
import { Organization } from '../orgs/organization.model';
import { logger } from '../../config/logger';
import { ApiResponseUtil } from '../../utils/apiResponse';
import { generateToken } from '../../utils/jwt';

const authService = new AuthService();
const userService = new UserService();
const adminService = new AdminService();

export class AuthController {
  /**
   * User Login
   * POST /api/v1/auth/login
   * Efficient login endpoint for regular users
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Check if req.body exists
      if (!req.body) {
        logger.error('Request body is undefined', {
          headers: req.headers,
          method: req.method,
          url: req.url,
        });
        return ApiResponseUtil.validationError(
          res,
          ['Request body is required. Please ensure Content-Type: application/json header is set.']
        );
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponseUtil.validationError(
          res,
          ['Email and password are required']
        );
      }

      // Validate email format (basic check)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ApiResponseUtil.validationError(
          res,
          ['Invalid email format']
        );
      }

      // Login user
      const user = await authService.login(email, password);

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        type: 'user',
        tenant_id: user.tenant_id || null,
      });

      // Prepare response data (exclude sensitive information)
      // Safely access relations that may not exist
      const responseData: any = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: user.tenant_id,
        tenant_name: (user as any).tenant?.name || null,
        organization_id: user.organization_id,
        building_id: user.building_id,
        floor_id: user.floor_id,
        role_id: user.role_id,
        role_name: (user as any).role?.name || null,
        employee_id: user.employee_id,
        department: user.department,
        employee_grade: user.employee_grade,
        module_scope: user.module_scope,
        phone: user.phone,
        token,
        token_type: 'Bearer',
        expires_in: process.env.JWT_EXPIRES_IN || '24h',
      };

      ApiResponseUtil.success(res, responseData, 'Login successful');
    } catch (error: any) {
      logger.error('Error in user login:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers,
      });
      
      // Handle specific error types
      if (error.message && error.message.includes('Cannot destructure')) {
        return ApiResponseUtil.validationError(
          res,
          ['Request body is required. Please ensure Content-Type: application/json header is set and body is sent as JSON.']
        );
      }
      
      ApiResponseUtil.unauthorized(res, error.message || 'Login failed');
    }
  }

  /**
   * Get current user profile (requires authentication)
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only users can access their own profile
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const user = await authService.getUserById(req.user.id, req.user.tenant_id || undefined);

      if (!user) {
        return ApiResponseUtil.notFound(res, 'User not found');
      }

      // Return user profile (exclude sensitive information)
      // Safely access relations that may not exist
      ApiResponseUtil.success(res, {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: user.tenant_id,
        tenant_name: (user as any).tenant?.name || null,
        organization_id: user.organization_id,
        organization_name: (user as any).organization?.name || null,
        building_id: user.building_id,
        building_name: (user as any).building?.name || null,
        floor_id: user.floor_id,
        floor_name: (user as any).floor?.name || null,
        role_id: user.role_id,
        role_name: (user as any).role?.name || null,
        employee_id: user.employee_id,
        department: user.department,
        employee_grade: user.employee_grade,
        office_location: user.office_location,
        module_scope: user.module_scope,
        phone: user.phone,
        is_active: user.is_active,
        created_at: user.created_at,
      }, 'User profile retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getCurrentUser:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch user profile');
    }
  }

  /**
   * Register new user (Public endpoint - no authentication required)
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body) {
        logger.error('Request body is undefined', {
          headers: req.headers,
          method: req.method,
          url: req.url,
        });
        return ApiResponseUtil.validationError(
          res,
          ['Request body is required. Please ensure Content-Type: application/json header is set.']
        );
      }

      const {
        email,
        password,
        first_name,
        last_name,
        tenant_id,
        organization_name,
        organization_id,
        phone,
        employee_id,
        department,
        employee_grade,
        office_location,
        building_id,
        floor_id,
        role_id,
        module_scope,
      } = req.body;

      // Validation
      if (!email || !password || !first_name || !last_name || !tenant_id) {
        return ApiResponseUtil.validationError(
          res,
          ['Missing required fields: email, password, first_name, last_name, tenant_id']
        );
      }

      // Organization is optional - if organizations table doesn't exist, registration can proceed without it
      // No validation error if both are missing

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ApiResponseUtil.validationError(
          res,
          ['Invalid email format']
        );
      }

      // Validate password strength
      if (password.length < 8) {
        return ApiResponseUtil.validationError(
          res,
          ['Password must be at least 8 characters long']
        );
      }

      // Get creator from auth (if authenticated - optional for registration)
      const created_by = (req as any).user?.id || null;

      const user = await userService.registerUser({
        email,
        password,
        first_name,
        last_name,
        tenant_id,
        organization_name,
        organization_id,
        phone,
        employee_id,
        department,
        employee_grade,
        office_location,
        building_id,
        floor_id,
        role_id,
        module_scope,
        created_by,
      });

      // Generate JWT token for immediate login after registration
      const token = generateToken({
        id: user.id,
        email: user.email,
        type: 'user',
        tenant_id: user.tenant_id || null,
      });

      ApiResponseUtil.created(res, {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: user.tenant_id,
        organization_id: user.organization_id,
        employee_id: user.employee_id,
        department: user.department,
        office_location: user.office_location,
        module_scope: user.module_scope,
        is_verified: user.is_verified,
        token,
        token_type: 'Bearer',
        expires_in: process.env.JWT_EXPIRES_IN || '24h',
      }, 'User registered successfully');
    } catch (error: any) {
      logger.error('Error in user registration:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });

      // Handle specific error types
      if (error.message && error.message.includes('already exists')) {
        return ApiResponseUtil.error(res, error, 409, error.message);
      }

      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.error(res, error, 404, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to register user');
    }
  }

  /**
   * Update user profile (users can update their own profile)
   * PUT /api/v1/auth/profile
   * Users cannot update: employee_id, email
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only users can update their own profile
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const {
        first_name,
        last_name,
        phone,
        department,
        employee_grade,
        office_location,
        building_id,
        floor_id,
        role_id,
        module_scope,
      } = req.body;

      // Validate that restricted fields are not being updated
      if (req.body.email !== undefined) {
        return ApiResponseUtil.forbidden(res, 'You cannot update your email. Please contact your administrator.');
      }

      if (req.body.employee_id !== undefined) {
        return ApiResponseUtil.forbidden(res, 'You cannot update your employee ID. Please contact your administrator.');
      }

      const user = await userService.updateProfile(
        req.user.id,
        req.user.tenant_id || '',
        {
          first_name,
          last_name,
          phone,
          department,
          employee_grade,
          office_location,
          building_id,
          floor_id,
          role_id,
          module_scope,
        }
      );

      // Return updated user profile
      ApiResponseUtil.success(res, {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: user.tenant_id,
        organization_id: user.organization_id,
        building_id: user.building_id,
        floor_id: user.floor_id,
        role_id: user.role_id,
        employee_id: user.employee_id,
        department: user.department,
        employee_grade: user.employee_grade,
        office_location: user.office_location,
        module_scope: user.module_scope,
        phone: user.phone,
        is_active: user.is_active,
        updated_at: user.updated_at,
      }, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Error in updateProfile:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to update profile');
    }
  }

  /**
   * Get all users in organization (for superadmin)
   * GET /api/v1/auth/organization/users?organization_id={uuid}
   * Returns all active and verified users from the specified organization in the tenant
   * If organization_id is not provided, returns all users in the tenant
   */
  async getOrganizationUsers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can access this endpoint
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can access this endpoint');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('Superadmin must be associated with a tenant'),
          400
        );
      }

      const organization_id = req.query.organization_id as string | undefined;

      // Fetch users - if organization_id provided, filter by it; otherwise get all users in tenant
      let users: any[];
      let organization_name: string | null = null;

      if (organization_id) {
        // Fetch users from specific organization
        users = await userService.getOrganizationUsers(organization_id, tenant_id);
        
        // Try to get organization name
        try {
          const orgRepository = AppDataSource.getRepository(Organization);
          const organization = await orgRepository.findOne({
            where: { id: organization_id, tenant_id },
          });
          organization_name = organization?.name || null;
        } catch (error: any) {
          // If organizations table doesn't exist, just continue
          logger.warn('Could not fetch organization name:', error.message);
        }
      } else {
        // Fetch all users in tenant (using admin service method)
        users = await adminService.getTenantUsers(tenant_id, {
          includeInactive: false,
          includeUnverified: false,
        });
      }

      // Return user list (exclude sensitive information)
      ApiResponseUtil.success(res, {
        count: users.length,
        organization_id: organization_id || null,
        organization_name: organization_name,
        users: users.map((user: any) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          employee_id: user.employee_id,
          department: user.department,
          employee_grade: user.employee_grade,
          office_location: user.office_location,
          phone: user.phone,
          building_id: user.building_id,
          building_name: user.building?.name || null,
          floor_id: user.floor_id,
          floor_name: user.floor?.name || null,
          role_id: user.role_id,
          role_name: user.role?.name || null,
          module_scope: user.module_scope,
          is_active: user.is_active,
          is_verified: user.is_verified,
          created_at: user.created_at,
        })),
      }, organization_id 
        ? 'Organization users retrieved successfully'
        : 'Tenant users retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getOrganizationUsers:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch organization users');
    }
  }
}
