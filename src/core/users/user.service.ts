// User service
import { AppDataSource } from '../../config/data-source';
import { User } from './user.model';
import { Organization } from '../orgs/organization.model';
import { Tenant } from '../tenancy/tenant.model';
import { logger } from '../../config/logger';
import * as bcrypt from 'bcryptjs';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private organizationRepository = AppDataSource.getRepository(Organization);
  private tenantRepository = AppDataSource.getRepository(Tenant);

  /**
   * Find or create organization by name within a tenant
   * Gracefully handles case where organizations table doesn't exist
   */
  async findOrCreateOrganization(
    organizationName: string,
    tenant_id: string
  ): Promise<Organization | null> {
    try {
      // First, try to find existing organization
      let organization = await this.organizationRepository.findOne({
        where: {
          name: organizationName,
          tenant_id: tenant_id,
        },
      });

      // If not found, create new organization
      if (!organization) {
        organization = this.organizationRepository.create({
          name: organizationName,
          tenant_id: tenant_id,
        });

        organization = await this.organizationRepository.save(organization);
        logger.info(`Organization created: ${organizationName} (Tenant: ${tenant_id})`);
      }

      return organization;
    } catch (error: any) {
      // If organizations table doesn't exist, log warning and return null
      if (error.message && error.message.includes('does not exist')) {
        logger.warn('Organizations table does not exist. Skipping organization creation:', error.message);
        return null;
      }
      logger.error('Error finding or creating organization:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   * If organization_name is provided, it will find or create the organization
   * If organization_id is provided, it will use that organization
   */
  async registerUser(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    tenant_id: string;
    organization_name?: string;
    organization_id?: string;
    phone?: string;
    employee_id?: string;
    department?: string;
    employee_grade?: string;
    office_location?: string;
    building_id?: string;
    floor_id?: string;
    role_id?: string;
    module_scope?: string;
    created_by?: string;
  }): Promise<User> {
    try {
      // Validate tenant_id is provided
      if (!data.tenant_id) {
        throw new Error('Tenant ID is required');
      }

      // Validate tenant exists
      const tenant = await this.tenantRepository.findOne({
        where: { id: data.tenant_id },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Check if employee_id already exists (if provided)
      if (data.employee_id) {
        const existingEmployeeId = await this.userRepository.findOne({
          where: { employee_id: data.employee_id },
        });

        if (existingEmployeeId) {
          throw new Error('Employee ID already exists');
        }
      }

      // Handle organization (gracefully handle if organizations table doesn't exist)
      let organization_id: string | null = null;

      if (data.organization_id) {
        // Use provided organization_id
        try {
          const organization = await this.organizationRepository.findOne({
            where: {
              id: data.organization_id,
              tenant_id: data.tenant_id,
            },
          });

          if (!organization) {
            throw new Error('Organization not found in this tenant');
          }

          organization_id = data.organization_id;
        } catch (error: any) {
          // If organizations table doesn't exist, log warning and continue without organization
          if (error.message && error.message.includes('does not exist')) {
            logger.warn('Organizations table does not exist. Skipping organization validation:', error.message);
            organization_id = null;
          } else {
            throw error;
          }
        }
      } else if (data.organization_name) {
        // Find or create organization by name
        const organization = await this.findOrCreateOrganization(
          data.organization_name,
          data.tenant_id
        );
        organization_id = organization?.id || null;
      }
      // If neither organization_name nor organization_id is provided, organization_id remains null

      // Hash password
      const password_hash = await bcrypt.hash(data.password, 10);

      // Create user
      const userData: Partial<User> = {
        email: data.email,
        password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        tenant_id: data.tenant_id,
        organization_id: organization_id || undefined,
        phone: data.phone || undefined,
        employee_id: data.employee_id || undefined,
        department: data.department || undefined,
        employee_grade: data.employee_grade || undefined,
        office_location: data.office_location || undefined,
        building_id: data.building_id || undefined,
        floor_id: data.floor_id || undefined,
        role_id: data.role_id || undefined,
        module_scope: data.module_scope || 'CORE',
        created_by: data.created_by || undefined,
        is_active: true, // User account is active
        is_verified: false, // New users require superadmin approval before they can login
        approved_by: undefined, // Will be set when superadmin approves
      };

      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);
      logger.info(`User registered: ${savedUser.email} (Tenant: ${data.tenant_id}, Organization: ${organization_id})`);

      return savedUser;
    } catch (error: any) {
      logger.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string, tenant_id?: string): Promise<User | null> {
    try {
      const where: any = { id };
      if (tenant_id) {
        where.tenant_id = tenant_id;
      }

      return await this.userRepository.findOne({
        where,
        relations: ['tenant', 'organization', 'role', 'building', 'floor'],
      });
    } catch (error: any) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Update user profile (for regular users - restricted fields)
   * Users cannot update: employee_id, email
   */
  async updateProfile(
    user_id: string,
    tenant_id: string,
    data: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      department?: string;
      employee_grade?: string;
      office_location?: string;
      building_id?: string;
      floor_id?: string;
      role_id?: string;
      module_scope?: string;
    }
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: user_id, tenant_id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update allowed fields only
      if (data.first_name !== undefined) user.first_name = data.first_name;
      if (data.last_name !== undefined) user.last_name = data.last_name;
      if (data.phone !== undefined) user.phone = data.phone;
      if (data.department !== undefined) user.department = data.department;
      if (data.employee_grade !== undefined) user.employee_grade = data.employee_grade;
      if (data.office_location !== undefined) user.office_location = data.office_location;
      if (data.building_id !== undefined) {
        user.building_id = data.building_id ? data.building_id : (null as any);
      }
      if (data.floor_id !== undefined) {
        user.floor_id = data.floor_id ? data.floor_id : (null as any);
      }
      if (data.role_id !== undefined) {
        user.role_id = data.role_id ? data.role_id : (null as any);
      }
      if (data.module_scope !== undefined) user.module_scope = data.module_scope;

      const updatedUser = await this.userRepository.save(user);
      logger.info(`User profile updated: ${updatedUser.email}`);
      return updatedUser;
    } catch (error: any) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user (for superadmin - full access)
   * Superadmins can update all fields including employee_id and email
   */
  async updateUser(
    user_id: string,
    tenant_id: string,
    data: {
      email?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      employee_id?: string;
      department?: string;
      employee_grade?: string;
      office_location?: string;
      building_id?: string;
      floor_id?: string;
      role_id?: string;
      module_scope?: string;
      organization_id?: string;
      is_active?: boolean;
    }
  ): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: user_id, tenant_id },
      });

      if (!user) {
        throw new Error('User not found in your tenant');
      }

      // Update all fields (superadmin has full access)
      if (data.email !== undefined) {
        // Check if email is already taken by another user
        if (data.email !== user.email) {
          const existingUser = await this.userRepository.findOne({
            where: { email: data.email },
          });
          if (existingUser && existingUser.id !== user_id) {
            throw new Error('Email already exists');
          }
        }
        user.email = data.email;
      }
      if (data.first_name !== undefined) user.first_name = data.first_name;
      if (data.last_name !== undefined) user.last_name = data.last_name;
      if (data.phone !== undefined) user.phone = data.phone;
      if (data.employee_id !== undefined) {
        // Check if employee_id is already taken by another user
        if (data.employee_id && data.employee_id !== user.employee_id) {
          const existingUser = await this.userRepository.findOne({
            where: { employee_id: data.employee_id },
          });
          if (existingUser && existingUser.id !== user_id) {
            throw new Error('Employee ID already exists');
          }
        }
        user.employee_id = data.employee_id || null;
      }
      if (data.department !== undefined) user.department = data.department;
      if (data.employee_grade !== undefined) user.employee_grade = data.employee_grade;
      if (data.office_location !== undefined) user.office_location = data.office_location;
      if (data.building_id !== undefined) {
        user.building_id = data.building_id ? data.building_id : (null as any);
      }
      if (data.floor_id !== undefined) {
        user.floor_id = data.floor_id ? data.floor_id : (null as any);
      }
      if (data.role_id !== undefined) {
        user.role_id = data.role_id ? data.role_id : (null as any);
      }
      if (data.module_scope !== undefined) user.module_scope = data.module_scope;
      if (data.organization_id !== undefined) {
        user.organization_id = data.organization_id ? data.organization_id : (null as any);
      }
      if (data.is_active !== undefined) user.is_active = data.is_active;

      const updatedUser = await this.userRepository.save(user);
      logger.info(`User updated by superadmin: ${updatedUser.email}`);
      return updatedUser;
    } catch (error: any) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Create user (by superadmin)
   * Allows superadmins to create users with full control, including immediate verification
   */
  async createUser(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    tenant_id: string;
    organization_id?: string;
    organization_name?: string;
    phone?: string;
    employee_id?: string;
    department?: string;
    employee_grade?: string;
    office_location?: string;
    building_id?: string;
    floor_id?: string;
    role_id?: string;
    module_scope?: string;
    created_by: string; // Admin ID who created this user
    is_active?: boolean;
    is_verified?: boolean; // Can be set to true immediately by superadmin
  }): Promise<User> {
    try {
      // Validate tenant_id is provided
      if (!data.tenant_id) {
        throw new Error('Tenant ID is required');
      }

      // Validate tenant exists
      const tenant = await this.tenantRepository.findOne({
        where: { id: data.tenant_id },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Check if employee_id already exists (if provided)
      if (data.employee_id) {
        const existingEmployeeId = await this.userRepository.findOne({
          where: { employee_id: data.employee_id },
        });

        if (existingEmployeeId) {
          throw new Error('Employee ID already exists');
        }
      }

      // Handle organization (gracefully handle if organizations table doesn't exist)
      let organization_id: string | null = null;

      if (data.organization_id) {
        // Use provided organization_id
        try {
          const organization = await this.organizationRepository.findOne({
            where: {
              id: data.organization_id,
              tenant_id: data.tenant_id,
            },
          });

          if (!organization) {
            throw new Error('Organization not found in this tenant');
          }

          organization_id = data.organization_id;
        } catch (error: any) {
          // If organizations table doesn't exist, log warning and continue without organization
          if (error.message && error.message.includes('does not exist')) {
            logger.warn('Organizations table does not exist. Skipping organization validation:', error.message);
            organization_id = null;
          } else {
            throw error;
          }
        }
      } else if (data.organization_name) {
        // Find or create organization by name
        const organization = await this.findOrCreateOrganization(
          data.organization_name,
          data.tenant_id
        );
        organization_id = organization?.id || null;
      }

      // Hash password
      const password_hash = await bcrypt.hash(data.password, 10);

      // Create user
      const userData: Partial<User> = {
        email: data.email,
        password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        tenant_id: data.tenant_id,
        organization_id: organization_id || undefined,
        phone: data.phone || undefined,
        employee_id: data.employee_id || undefined,
        department: data.department || undefined,
        employee_grade: data.employee_grade || undefined,
        office_location: data.office_location || undefined,
        building_id: data.building_id || undefined,
        floor_id: data.floor_id || undefined,
        role_id: data.role_id || undefined,
        module_scope: data.module_scope || 'CORE',
        created_by: null, // Set to null when admin creates user (created_by FK references users.id, not admins.id)
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_verified: data.is_verified !== undefined ? data.is_verified : false, // Can be set to true by superadmin
        approved_by: data.is_verified === true ? data.created_by : undefined, // If verified, set approved_by to creator (admin ID)
      };

      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);
      logger.info(`User created by admin: ${savedUser.email} (Tenant: ${data.tenant_id}, Organization: ${organization_id}, Verified: ${savedUser.is_verified})`);

      return savedUser;
    } catch (error: any) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get all users in the same organization
   * Returns active and verified users from the same organization and tenant
   */
  async getOrganizationUsers(organization_id: string, tenant_id: string): Promise<User[]> {
    try {
      const where: any = {
        organization_id,
        tenant_id,
        is_active: true,
        is_verified: true, // Only return verified users
      };

      // Try to load with relations, gracefully handle if they don't exist
      try {
        return await this.userRepository.find({
          where,
          relations: ['organization', 'role', 'building', 'floor'],
          order: { created_at: 'DESC' },
        });
      } catch (relationError: any) {
        // If relation tables don't exist, try loading without some relations
        if (relationError.message && relationError.message.includes('does not exist')) {
          logger.warn('Relation tables may not exist. Loading users without relations:', relationError.message);
          try {
            return await this.userRepository.find({
              where,
              relations: ['organization', 'role'],
              order: { created_at: 'DESC' },
            });
          } catch (innerError: any) {
            // If even organization/role don't exist, load without any relations
            return await this.userRepository.find({
              where,
              order: { created_at: 'DESC' },
            });
          }
        } else {
          throw relationError;
        }
      }
    } catch (error: any) {
      logger.error('Error fetching organization users:', error);
      throw error;
    }
  }
}

// Export singleton instance for backward compatibility
// TODO: Refactor to use DI container following SOLID principles
export const userService = new UserService();
