// Admin controller
import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { AdminAuthService } from './adminAuth.service';
import { UserService } from '../users/user.service';
import { User } from '../users/user.model';
import { logger } from '../../config/logger';
import { ApiResponseUtil } from '../../utils/apiResponse';

const adminService = new AdminService();
const adminAuthService = new AdminAuthService();
const userService = new UserService();

export class AdminController {
  /**
   * Create admin (by superadmin)
   * POST /api/v1/admin/admins
   */
  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can create admins
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can create admins');
      }

      const { email, first_name, last_name, password, module_scope } = req.body;

      // Validation
      if (!email || !first_name || !last_name || !password || !module_scope) {
        return ApiResponseUtil.validationError(
          res,
          ['Missing required fields: email, first_name, last_name, password, module_scope']
        );
      }

      if (password.length < 8) {
        return ApiResponseUtil.validationError(
          res,
          ['Password must be at least 8 characters long']
        );
      }

      // Validate module_scope format (will be validated in service, but provide helpful message here)
      const validModules = ['DWAR', 'SANGRAH', 'SAMMILAN', 'SANDESH', 'FRESH_SERVE', 'ALL'];
      const normalizedScope = module_scope.toUpperCase();
      if (!validModules.includes(normalizedScope)) {
        return ApiResponseUtil.validationError(
          res,
          [`Invalid module_scope. Must be one of: ${validModules.join(', ')}. Use "ALL" for access to all modules.`]
        );
      }

      // Get superadmin's tenant_id from JWT token
      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      // Get superadmin ID from token
      const created_by = req.user.id;

      // Verify superadmin exists and is active
      const superadmin = await adminAuthService.getAdminById(created_by);
      if (!superadmin || !superadmin.is_active || !superadmin.is_super_admin) {
        return ApiResponseUtil.forbidden(res, 'Invalid superadmin account');
      }

      // Verify tenant_id matches
      if (superadmin.tenant_id !== tenant_id) {
        return ApiResponseUtil.forbidden(res, 'Tenant mismatch');
      }

      const admin = await adminService.createAdmin({
        email,
        first_name,
        last_name,
        password,
        module_scope,
        tenant_id,
        created_by,
      });

      ApiResponseUtil.created(res, {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        module_scope: admin.module_scope,
        tenant_id: admin.tenant_id,
        is_super_admin: admin.is_super_admin,
        created_at: admin.created_at,
      }, 'Admin created successfully');
    } catch (error: any) {
      logger.error('Error in createAdmin:', error);
      ApiResponseUtil.error(res, error, 400, 'Failed to create admin');
    }
  }

  /**
   * Get all admins in tenant (by superadmin)
   * GET /api/v1/admin/admins
   * 
   * Query Parameters:
   * - include_superadmin: boolean (default: false) - Include superadmin in results
   * - module_scope: string (optional) - Filter by module scope (e.g., "DWAR", "ALL")
   * - is_active: boolean (optional) - Filter by active status
   */
  async getTenantAdmins(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can view all admins
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can view all admins');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      // Parse query parameters
      const includeSuperadmin = req.query.include_superadmin === 'true';
      const module_scope = req.query.module_scope as string | undefined;
      const is_active = req.query.is_active !== undefined 
        ? req.query.is_active === 'true' 
        : undefined;

      // Validate module_scope if provided
      if (module_scope) {
        const validModules = ['DWAR', 'SANGRAH', 'SAMMILAN', 'SANDESH', 'FRESH_SERVE', 'ALL'];
        const normalizedScope = module_scope.toUpperCase();
        if (!validModules.includes(normalizedScope)) {
          return ApiResponseUtil.validationError(
            res,
            [`Invalid module_scope. Must be one of: ${validModules.join(', ')}`]
          );
        }
      }

      const admins = await adminService.getTenantAdmins(tenant_id, {
        includeSuperadmin,
        module_scope,
        is_active,
      });

      ApiResponseUtil.success(res, {
        count: admins.length,
        filters: {
          include_superadmin: includeSuperadmin,
          module_scope: module_scope || 'all',
          is_active: is_active !== undefined ? is_active : 'all',
        },
        admins: admins.map(admin => ({
          id: admin.id,
          email: admin.email,
          first_name: admin.first_name,
          last_name: admin.last_name,
          module_scope: admin.module_scope,
          is_super_admin: admin.is_super_admin,
          admin_level: admin.admin_level,
          is_active: admin.is_active,
          created_at: admin.created_at,
          updated_at: admin.updated_at,
          created_by: admin.creator ? {
            id: admin.creator.id,
            email: admin.creator.email,
          } : null,
        })),
      }, 'Admins retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getTenantAdmins:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch admins');
    }
  }

  /**
   * Get admin by ID (by superadmin)
   * GET /api/v1/admin/admins/:id
   */
  async getAdminById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can view admin details
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can view admin details');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const admin = await adminService.getAdminById(id, tenant_id);

      if (!admin) {
        return ApiResponseUtil.notFound(res, 'Admin not found in your tenant');
      }

      ApiResponseUtil.success(res, {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        module_scope: admin.module_scope,
        is_super_admin: admin.is_super_admin,
        admin_level: admin.admin_level,
        is_active: admin.is_active,
        tenant_id: admin.tenant_id,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
        created_by: admin.creator ? {
          id: admin.creator.id,
          email: admin.creator.email,
        } : null,
      }, 'Admin retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getAdminById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch admin');
    }
  }

  /**
   * Update admin (by superadmin)
   * PUT /api/v1/admin/admins/:id
   */
  async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can update admins
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can update admins');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { first_name, last_name, module_scope, is_active } = req.body;

      const admin = await adminService.updateAdmin(id, tenant_id, {
        first_name,
        last_name,
        module_scope,
        is_active,
      });

      ApiResponseUtil.success(res, {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        module_scope: admin.module_scope,
        is_active: admin.is_active,
        updated_at: admin.updated_at,
      }, 'Admin updated successfully');
    } catch (error: any) {
      logger.error('Error in updateAdmin:', error);
      ApiResponseUtil.error(res, error, 400, 'Failed to update admin');
    }
  }

  /**
   * Delete admin (by superadmin)
   * DELETE /api/v1/admin/admins/:id
   * 
   * This will permanently delete the admin and all related records:
   * - Admin assignments
   * - Admin permissions
   * - Admin onboarding requests
   */
  async deleteAdmin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can delete admins
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can delete admins');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      // Prevent deleting self
      if (id === req.user.id) {
        return ApiResponseUtil.error(res, new Error('Cannot delete your own admin account'), 400);
      }

      const result = await adminService.deleteAdmin(id, tenant_id);

      ApiResponseUtil.success(res, {
        deleted_admin: {
          id: result.deletedAdmin.id,
          email: result.deletedAdmin.email,
          module_scope: result.deletedAdmin.module_scope,
        },
      }, 'Admin deleted successfully');
    } catch (error: any) {
      logger.error('Error in deleteAdmin:', error);
      
      // Handle specific error messages
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }
      
      if (error.message && error.message.includes('Cannot delete')) {
        return ApiResponseUtil.error(res, error, 403, error.message);
      }
      
      ApiResponseUtil.error(res, error, 400, 'Failed to delete admin');
    }
  }

  /**
   * Get pending users (users waiting for approval)
   * GET /api/v1/admin/users/pending
   */
  async getPendingUsers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can view pending users
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can view pending users');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const users = await adminService.getPendingUsers(tenant_id);

      ApiResponseUtil.success(res, {
        count: users.length,
        users: users.map((user: User) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          employee_id: user.employee_id,
          department: user.department,
          organization_id: user.organization_id,
          organization_name: (user as any).organization?.name || null,
          role_id: user.role_id,
          role_name: (user as any).role?.name || null,
          is_active: user.is_active,
          is_verified: user.is_verified,
          approved_by: user.approved_by,
          approver_email: (user as any).approver?.email || null,
          created_at: user.created_at,
        })),
      }, 'Pending users retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getPendingUsers:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch pending users');
    }
  }

  /**
   * Approve user (by superadmin)
   * PUT /api/v1/admin/users/:id/approve
   */
  async approveUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can approve users
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can approve users');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const approved_by = req.user.id;

      const user = await adminService.approveUser(id, tenant_id, approved_by);

      ApiResponseUtil.success(res, {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        is_verified: user.is_verified,
        approved_by: user.approved_by,
      }, 'User approved successfully. User can now login.');
    } catch (error: any) {
      logger.error('Error in approveUser:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }
      
      if (error.message && error.message.includes('already verified')) {
        return ApiResponseUtil.error(res, error, 400, error.message);
      }
      
      if (error.message && error.message.includes('Only superadmins')) {
        return ApiResponseUtil.forbidden(res, error.message);
      }
      
      ApiResponseUtil.error(res, error, 400, 'Failed to approve user');
    }
  }

  /**
   * Reject user (by superadmin)
   * DELETE /api/v1/admin/users/:id/reject?delete=true
   */
  async rejectUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can reject users
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can reject users');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const rejected_by = req.user.id;
      const deleteUser = req.query.delete === 'true';

      await adminService.rejectUser(id, tenant_id, rejected_by, deleteUser);

      const message = deleteUser 
        ? 'User rejected and deleted successfully'
        : 'User rejected successfully. User remains inactive.';

      ApiResponseUtil.success(res, null, message);
    } catch (error: any) {
      logger.error('Error in rejectUser:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }
      
      ApiResponseUtil.error(res, error, 400, 'Failed to reject user');
    }
  }

  /**
   * Get all users in tenant (by superadmin)
   * GET /api/v1/admin/users
   */
  async getTenantUsers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can view all users
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can view all users');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const includeInactive = req.query.include_inactive !== 'false';
      const includeUnverified = req.query.include_unverified !== 'false';
      const users = await adminService.getTenantUsers(tenant_id, { includeInactive, includeUnverified });

      ApiResponseUtil.success(res, {
        count: users.length,
        users: users.map((user: User) => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          employee_id: user.employee_id,
          department: user.department,
          organization_id: user.organization_id,
          organization_name: (user as any).organization?.name || null,
          role_id: user.role_id,
          role_name: (user as any).role?.name || null,
          is_active: user.is_active,
          is_verified: user.is_verified,
          approved_by: user.approved_by,
          approver_email: (user as any).approver?.email || null,
          created_at: user.created_at,
        })),
      }, 'Users retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getTenantUsers:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch users');
    }
  }

  /**
   * Update user profile (by superadmin)
   * PUT /api/v1/admin/users/:id
   * Superadmins have full access to update any user field
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can update users
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can update users');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const {
        email,
        first_name,
        last_name,
        phone,
        employee_id,
        department,
        employee_grade,
        office_location,
        building_id,
        floor_id,
        role_id,
        module_scope,
        organization_id,
        is_active,
      } = req.body;

      const user = await userService.updateUser(id, tenant_id, {
        email,
        first_name,
        last_name,
        phone,
        employee_id,
        department,
        employee_grade,
        office_location,
        building_id,
        floor_id,
        role_id,
        module_scope,
        organization_id,
        is_active,
      });

      // Return updated user
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
        is_verified: user.is_verified,
        updated_at: user.updated_at,
      }, 'User updated successfully');
    } catch (error: any) {
      logger.error('Error in updateUser:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }

      if (error.message && (error.message.includes('already exists') || error.message.includes('already taken'))) {
        return ApiResponseUtil.error(res, error, 409, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to update user');
    }
  }

  /**
   * Delete user (by superadmin)
   * DELETE /api/v1/admin/users/:id
   * Permanently deletes a user from the tenant
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can delete users
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can delete users');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const deleted_by = req.user.id;

      await adminService.deleteUser(id, tenant_id, deleted_by);

      ApiResponseUtil.success(res, null, 'User deleted successfully');
    } catch (error: any) {
      logger.error('Error in deleteUser:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to delete user');
    }
  }

  /**
   * Create user (by superadmin)
   * POST /api/v1/admin/users
   * Allows superadmins to create users with full details
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can create users
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can create users');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('Superadmin must be associated with a tenant'), 400);
      }

      const {
        email,
        password,
        first_name,
        last_name,
        organization_id,
        organization_name,
        phone,
        employee_id,
        department,
        employee_grade,
        office_location,
        building_id,
        floor_id,
        role_id,
        module_scope,
        is_active,
        is_verified,
      } = req.body;

      // Validation
      if (!email || !password || !first_name || !last_name) {
        return ApiResponseUtil.validationError(
          res,
          ['Missing required fields: email, password, first_name, last_name']
        );
      }

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

      // Create user
      const user = await userService.createUser({
        email,
        password,
        first_name,
        last_name,
        tenant_id,
        organization_id,
        organization_name,
        phone,
        employee_id,
        department,
        employee_grade,
        office_location,
        building_id,
        floor_id,
        role_id,
        module_scope,
        created_by: req.user.id,
        is_active: is_active !== undefined ? is_active : true,
        is_verified: is_verified !== undefined ? is_verified : false,
      });

      // Return created user
      ApiResponseUtil.created(res, {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: user.tenant_id,
        organization_id: user.organization_id,
        employee_id: user.employee_id,
        department: user.department,
        employee_grade: user.employee_grade,
        office_location: user.office_location,
        phone: user.phone,
        building_id: user.building_id,
        floor_id: user.floor_id,
        role_id: user.role_id,
        module_scope: user.module_scope,
        is_active: user.is_active,
        is_verified: user.is_verified,
        created_at: user.created_at,
      }, 'User created successfully');
    } catch (error: any) {
      logger.error('Error in createUser:', error);
      
      if (error.message && error.message.includes('already exists')) {
        return ApiResponseUtil.error(res, error, 409, error.message);
      }

      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.error(res, error, 404, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to create user');
    }
  }
}
