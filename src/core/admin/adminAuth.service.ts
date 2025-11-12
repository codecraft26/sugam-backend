// Superadmin authentication service - Following SOLID Principles
import { Admin } from './admin.model';
import { IAdminRepository } from '../interfaces/repository.interface';
import { IPasswordService } from '../interfaces/service.interface';
import { ILoggerService } from '../interfaces/service.interface';

// Interface for Admin Auth Service
export interface IAdminAuthService {
  login(email: string, password: string): Promise<Admin>;
  getAdminById(id: string, tenant_id?: string): Promise<Admin | null>;
}

// Admin Auth Service - Single Responsibility: Admin Authentication
export class AdminAuthService implements IAdminAuthService {
  constructor(
    private adminRepository: IAdminRepository,
    private passwordService: IPasswordService,
    private logger: ILoggerService
  ) {}

  /**
   * Login admin or superadmin (unified login for both)
   */
  async login(email: string, password: string): Promise<Admin> {
    try {
      const admin = await this.adminRepository.findByEmail(email);

      if (!admin) {
        throw new Error('Invalid email or password');
      }

      if (!admin.is_active) {
        throw new Error('Admin account is inactive');
      }

      if (!admin.tenant_id) {
        throw new Error('Admin is not associated with a tenant');
      }

      // Verify password
      const isPasswordValid = await this.passwordService.comparePassword(password, admin.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      const adminType = admin.is_super_admin ? 'Superadmin' : 'Admin';
      this.logger.info(`${adminType} logged in: ${admin.email} (Tenant: ${admin.tenant_id}${admin.module_scope ? `, Module: ${admin.module_scope}` : ''})`);
      return admin;
    } catch (error: any) {
      this.logger.error('Error in admin login:', error);
      throw error;
    }
  }

  /**
   * Get admin by ID
   */
  async getAdminById(id: string, tenant_id?: string): Promise<Admin | null> {
    try {
      return await this.adminRepository.findOne(id, tenant_id);
    } catch (error: any) {
      this.logger.error('Error fetching admin:', error);
      throw error;
    }
  }
}

// Export singleton instance - will be set by bootstrap
// Using a getter function to avoid circular dependencies
let _adminAuthService: AdminAuthService | null = null;

export function setAdminAuthService(service: AdminAuthService): void {
  _adminAuthService = service;
}

export function getAdminAuthService(): AdminAuthService {
  if (!_adminAuthService) {
    throw new Error('AdminAuthService not initialized. Make sure bootstrapDI() is called before using adminAuthService.');
  }
  return _adminAuthService;
}

// Proxy for backward compatibility
export const adminAuthService = new Proxy({} as AdminAuthService, {
  get(_target, prop) {
    return getAdminAuthService()[prop as keyof AdminAuthService];
  }
});
