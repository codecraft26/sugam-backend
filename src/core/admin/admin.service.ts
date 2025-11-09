// Admin service
import { AppDataSource } from '../../config/data-source';
import { Admin } from './admin.model';
import { User } from '../users/user.model';
import { logger } from '../../config/logger';
import * as bcrypt from 'bcryptjs';

export class AdminService {
  private adminRepository = AppDataSource.getRepository(Admin);

  /**
   * Create a new admin (regular admin) by superadmin
   * Superadmin can only create admins in their own tenant
   * module_scope can be a specific module (e.g., "DWAR", "SANGRAH") or "ALL" for access to all modules
   */
  async createAdmin(data: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    module_scope: string; // Can be specific module or "ALL" for all modules
    tenant_id: string; // Must match superadmin's tenant
    created_by: string; // Superadmin ID
  }): Promise<Admin> {
    try {
      // Check if email already exists
      const existingAdmin = await this.adminRepository.findOne({
        where: { email: data.email },
      });

      if (existingAdmin) {
        throw new Error('Admin with this email already exists');
      }

      // Verify the creator is a superadmin in the same tenant
      const creator = await this.adminRepository.findOne({
        where: { 
          id: data.created_by,
          tenant_id: data.tenant_id,
          is_super_admin: true,
        },
      });

      if (!creator) {
        throw new Error('Only superadmins can create admins in their tenant');
      }

      // Validate module_scope
      const validModules = ['DWAR', 'SANGRAH', 'SAMMILAN', 'SANDESH', 'FRESH_SERVE', 'ALL'];
      const normalizedScope = data.module_scope.toUpperCase();
      
      if (!validModules.includes(normalizedScope)) {
        throw new Error(`Invalid module_scope. Must be one of: ${validModules.join(', ')}`);
      }

      // Hash password
      const password_hash = await bcrypt.hash(data.password, 10);

      // Create admin (regular admin, not superadmin)
      const admin = this.adminRepository.create({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password_hash,
        tenant_id: data.tenant_id,
        created_by: data.created_by,
        is_super_admin: false,
        admin_level: 'ADMIN',
        module_scope: normalizedScope, // Store as uppercase
        is_active: true,
      });

      const savedAdmin = await this.adminRepository.save(admin);
      const scopeDisplay = normalizedScope === 'ALL' ? 'ALL modules' : normalizedScope;
      logger.info(`Admin created by superadmin: ${savedAdmin.email} (Tenant: ${data.tenant_id}, Module: ${scopeDisplay})`);

      return savedAdmin;
    } catch (error: any) {
      logger.error('Error creating admin:', error);
      throw error;
    }
  }

  /**
   * Get all admins in a tenant (for superadmin)
   * Supports filtering by module_scope, is_active, and including superadmin
   */
  async getTenantAdmins(
    tenant_id: string, 
    options: {
      includeSuperadmin?: boolean;
      module_scope?: string;
      is_active?: boolean;
    } = {}
  ): Promise<Admin[]> {
    try {
      const where: any = { tenant_id };
      
      // If not including superadmin, filter them out
      if (!options.includeSuperadmin) {
        where.is_super_admin = false;
      }

      // Filter by module_scope if provided
      if (options.module_scope) {
        where.module_scope = options.module_scope.toUpperCase();
      }

      // Filter by is_active if provided
      if (options.is_active !== undefined) {
        where.is_active = options.is_active;
      }

      const admins = await this.adminRepository.find({
        where,
        relations: ['tenant', 'creator'],
        order: { created_at: 'DESC' },
      });

      return admins;
    } catch (error: any) {
      logger.error('Error fetching tenant admins:', error);
      throw error;
    }
  }

  /**
   * Get admin by ID (with tenant validation)
   */
  async getAdminById(id: string, tenant_id?: string): Promise<Admin | null> {
    try {
      const where: any = { id };
      if (tenant_id) {
        where.tenant_id = tenant_id;
      }

      return await this.adminRepository.findOne({
        where,
        relations: ['tenant', 'creator'],
      });
    } catch (error: any) {
      logger.error('Error fetching admin:', error);
      throw error;
    }
  }

  /**
   * Update admin (only by superadmin in same tenant)
   */
  async updateAdmin(
    id: string,
    tenant_id: string,
    updates: {
      first_name?: string;
      last_name?: string;
      module_scope?: string;
      is_active?: boolean;
    }
  ): Promise<Admin> {
    try {
      const admin = await this.adminRepository.findOne({
        where: { id, tenant_id },
      });

      if (!admin) {
        throw new Error('Admin not found in your tenant');
      }

      // Don't allow updating superadmin
      if (admin.is_super_admin) {
        throw new Error('Cannot update superadmin through this endpoint');
      }

      // Validate module_scope if provided
      if (updates.module_scope !== undefined) {
        const validModules = ['DWAR', 'SANGRAH', 'SAMMILAN', 'SANDESH', 'FRESH_SERVE', 'ALL'];
        const normalizedScope = updates.module_scope.toUpperCase();
        
        if (!validModules.includes(normalizedScope)) {
          throw new Error(`Invalid module_scope. Must be one of: ${validModules.join(', ')}`);
        }
        admin.module_scope = normalizedScope;
      }

      // Update fields
      if (updates.first_name !== undefined) admin.first_name = updates.first_name;
      if (updates.last_name !== undefined) admin.last_name = updates.last_name;
      if (updates.is_active !== undefined) admin.is_active = updates.is_active;

      const updatedAdmin = await this.adminRepository.save(admin);
      logger.info(`Admin updated: ${updatedAdmin.email}`);

      return updatedAdmin;
    } catch (error: any) {
      logger.error('Error updating admin:', error);
      throw error;
    }
  }

  /**
   * Delete admin (only by superadmin in same tenant)
   * This will cascade delete related records:
   * - Admin assignments
   * - Admin permissions
   * - Admin onboarding requests
   */
  async deleteAdmin(id: string, tenant_id: string): Promise<{ deletedAdmin: Admin }> {
    try {
      // First, find admin without relations (in case tables don't exist)
      const admin = await this.adminRepository.findOne({
        where: { id, tenant_id },
      });

      if (!admin) {
        throw new Error('Admin not found in your tenant');
      }

      // Don't allow deleting superadmin
      if (admin.is_super_admin) {
        throw new Error('Cannot delete superadmin. Superadmins can only be deleted by platform admins.');
      }

      // Try to load relations for logging (gracefully handle if tables don't exist)
      let assignmentCount = 0;
      let permissionCount = 0;
      let requestCount = 0;

      try {
        const adminWithRelations = await this.adminRepository.findOne({
          where: { id, tenant_id },
          relations: ['adminAssignments', 'adminPermissions', 'adminOnboardingRequests'],
        });
        
        if (adminWithRelations) {
          assignmentCount = adminWithRelations.adminAssignments?.length || 0;
          permissionCount = adminWithRelations.adminPermissions?.length || 0;
          requestCount = adminWithRelations.adminOnboardingRequests?.length || 0;
        }
      } catch (relationError: any) {
        // If relations don't exist, just log a warning and continue
        logger.warn('Could not load admin relations for deletion logging (tables may not exist):', relationError.message);
      }

      logger.info(`Deleting admin: ${admin.email}`, {
        admin_id: admin.id,
        tenant_id: admin.tenant_id,
        module_scope: admin.module_scope,
        assignments_count: assignmentCount,
        permissions_count: permissionCount,
        requests_count: requestCount,
      });

      // Delete admin (CASCADE will automatically delete related records if they exist)
      await this.adminRepository.remove(admin);

      logger.info(`Admin deleted successfully: ${admin.email}`, {
        admin_id: admin.id,
        deleted_assignments: assignmentCount,
        deleted_permissions: permissionCount,
        deleted_requests: requestCount,
      });

      return { deletedAdmin: admin };
    } catch (error: any) {
      logger.error('Error deleting admin:', error);
      throw error;
    }
  }

  /**
   * Approve user (by superadmin)
   * Sets is_verified to true and records approved_by, allowing user to login
   */
  async approveUser(user_id: string, tenant_id: string, approved_by: string): Promise<User> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      const user = await userRepository.findOne({
        where: { id: user_id, tenant_id },
      });

      if (!user) {
        throw new Error('User not found in your tenant');
      }

      if (user.is_verified) {
        throw new Error('User is already verified');
      }

      // Verify the approver is a superadmin
      const approver = await this.adminRepository.findOne({
        where: { id: approved_by, tenant_id, is_super_admin: true },
      });

      if (!approver) {
        throw new Error('Only superadmins can approve users');
      }

      user.is_verified = true;
      user.approved_by = approved_by;
      const updatedUser = await userRepository.save(user);
      
      logger.info(`User approved by superadmin: ${user.email} (Approved by: ${approver.email})`);
      return updatedUser;
    } catch (error: any) {
      logger.error('Error approving user:', error);
      throw error;
    }
  }

  /**
   * Reject user (by superadmin)
   * Keeps is_verified as false, or optionally deletes the user
   */
  async rejectUser(user_id: string, tenant_id: string, rejected_by: string, deleteUser: boolean = false): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      const user = await userRepository.findOne({
        where: { id: user_id, tenant_id },
      });

      if (!user) {
        throw new Error('User not found in your tenant');
      }

      if (deleteUser) {
        await userRepository.remove(user);
        logger.info(`User rejected and deleted by superadmin: ${user.email} (Rejected by: ${rejected_by})`);
      } else {
        // Keep user but ensure is_verified is false
        user.is_verified = false;
        user.approved_by = null;
        await userRepository.save(user);
        logger.info(`User rejected by superadmin: ${user.email} (Rejected by: ${rejected_by})`);
      }
    } catch (error: any) {
      logger.error('Error rejecting user:', error);
      throw error;
    }
  }

  /**
   * Get pending users (users waiting for approval - is_verified: false or NULL)
   */
  async getPendingUsers(tenant_id: string): Promise<User[]> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      // Use QueryBuilder to handle both false and NULL values for is_verified
      let query = userRepository
        .createQueryBuilder('user')
        .where('user.tenant_id = :tenant_id', { tenant_id })
        .andWhere('(user.is_verified = false OR user.is_verified IS NULL)')
        .orderBy('user.created_at', 'DESC');
      
      // Try to load relations, but gracefully handle if they don't exist
      try {
        query = query
          .leftJoinAndSelect('user.organization', 'organization')
          .leftJoinAndSelect('user.role', 'role')
          .leftJoinAndSelect('user.approver', 'approver');
        
        return await query.getMany();
      } catch (relationError: any) {
        // If relation tables don't exist, try loading without approver relation
        if (relationError.message && relationError.message.includes('does not exist')) {
          logger.warn('Relation tables may not exist. Loading users without relations:', relationError.message);
          try {
            query = userRepository
              .createQueryBuilder('user')
              .where('user.tenant_id = :tenant_id', { tenant_id })
              .andWhere('(user.is_verified = false OR user.is_verified IS NULL)')
              .leftJoinAndSelect('user.organization', 'organization')
              .leftJoinAndSelect('user.role', 'role')
              .orderBy('user.created_at', 'DESC');
            
            return await query.getMany();
          } catch (innerError: any) {
            // If even organization/role don't exist, load without any relations
            query = userRepository
              .createQueryBuilder('user')
              .where('user.tenant_id = :tenant_id', { tenant_id })
              .andWhere('(user.is_verified = false OR user.is_verified IS NULL)')
              .orderBy('user.created_at', 'DESC');
            
            return await query.getMany();
          }
        } else {
          throw relationError;
        }
      }
    } catch (error: any) {
      logger.error('Error fetching pending users:', error);
      throw error;
    }
  }

  /**
   * Get all users in tenant (for superadmin)
   */
  async getTenantUsers(tenant_id: string, options: { includeInactive?: boolean; includeUnverified?: boolean } = {}): Promise<User[]> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      const where: any = { tenant_id };
      if (options.includeInactive === false) {
        where.is_active = true;
      }
      if (options.includeUnverified === false) {
        where.is_verified = true;
      }

      try {
        return await userRepository.find({
          where,
          relations: ['organization', 'role', 'approver'],
          order: { created_at: 'DESC' },
        });
      } catch (relationError: any) {
        // If relation tables don't exist, try loading without approver relation
        if (relationError.message && relationError.message.includes('does not exist')) {
          logger.warn('Relation tables may not exist. Loading users without relations:', relationError.message);
          try {
            return await userRepository.find({
              where,
              relations: ['organization', 'role'],
              order: { created_at: 'DESC' },
            });
          } catch (innerError: any) {
            // If even organization/role don't exist, load without any relations
            return await userRepository.find({
              where,
              order: { created_at: 'DESC' },
            });
          }
        } else {
          throw relationError;
        }
      }
    } catch (error: any) {
      logger.error('Error fetching tenant users:', error);
      throw error;
    }
  }

  /**
   * Delete user (by superadmin)
   * Permanently deletes a user from the tenant
   */
  async deleteUser(user_id: string, tenant_id: string, deleted_by: string): Promise<void> {
    try {
      const userRepository = AppDataSource.getRepository(User);
      
      const user = await userRepository.findOne({
        where: { id: user_id, tenant_id },
      });

      if (!user) {
        throw new Error('User not found in your tenant');
      }

      // Delete user (CASCADE will automatically delete related records if they exist)
      await userRepository.remove(user);

      logger.info(`User deleted by superadmin: ${user.email} (Deleted by: ${deleted_by})`);
    } catch (error: any) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }
}
