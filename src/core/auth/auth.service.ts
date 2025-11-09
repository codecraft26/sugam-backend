// User authentication service
import { AppDataSource } from '../../config/data-source';
import { User } from '../users/user.model';
import { logger } from '../../config/logger';
import * as bcrypt from 'bcryptjs';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Login user (regular employee)
   * Efficient login with minimal database queries
   * Gracefully handles missing relation tables
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // First, try to load user with relations
      let user: User | null = null;
      
      try {
        user = await this.userRepository.findOne({
          where: { email },
          relations: ['tenant', 'role'], // Only load essential relations
        });
      } catch (relationError: any) {
        // If relation tables don't exist, try loading without relations
        if (relationError.message && relationError.message.includes('does not exist')) {
          logger.warn('Relation tables may not exist. Loading user without relations:', relationError.message);
          user = await this.userRepository.findOne({
            where: { email },
          });
        } else {
          throw relationError;
        }
      }

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        throw new Error('Your account is inactive. Please contact your administrator.');
      }

      if (!user.is_verified) {
        throw new Error('Your account is pending approval. Please wait for superadmin approval before logging in.');
      }

      if (!user.tenant_id) {
        throw new Error('User is not associated with a tenant');
      }

      // Verify password (bcrypt comparison is optimized)
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      logger.info(`User logged in: ${user.email} (Tenant: ${(user as any).tenant?.name || user.tenant_id})`);
      return user;
    } catch (error: any) {
      logger.error('Error in user login:', error);
      throw error;
    }
  }

  /**
   * Get user by ID (for token verification)
   * Gracefully handles missing relation tables
   */
  async getUserById(id: string, tenant_id?: string): Promise<User | null> {
    try {
      const where: any = { id };
      if (tenant_id) {
        where.tenant_id = tenant_id;
      }

      // Try to load with relations first
      try {
        return await this.userRepository.findOne({
          where,
          relations: ['tenant', 'role', 'organization', 'building', 'floor'],
        });
      } catch (relationError: any) {
        // If relation tables don't exist, load without relations
        if (relationError.message && relationError.message.includes('does not exist')) {
          logger.warn('Relation tables may not exist. Loading user without relations:', relationError.message);
          return await this.userRepository.findOne({
            where,
          });
        } else {
          throw relationError;
        }
      }
    } catch (error: any) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Get user by email (for validation)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'tenant_id', 'is_active'],
      });
    } catch (error: any) {
      logger.error('Error fetching user by email:', error);
      throw error;
    }
  }
}
