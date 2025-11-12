// User authentication service - Following SOLID Principles
import { User } from '../users/user.model';
import { IUserRepository } from '../interfaces/repository.interface';
import { IPasswordService } from '../interfaces/service.interface';
import { ILoggerService } from '../interfaces/service.interface';

// Interface for Auth Service - Following Interface Segregation
export interface IAuthService {
  login(email: string, password: string): Promise<User>;
  getUserById(id: string, tenant_id?: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
}

// Auth Service - Single Responsibility: Authentication Logic
export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService,
    private logger: ILoggerService
  ) {}

  /**
   * Login user (regular employee)
   * Efficient login with minimal database queries
   * Gracefully handles missing relation tables
   */
  async login(email: string, password: string): Promise<User> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);

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

      // Verify password - delegated to password service
      const isPasswordValid = await this.passwordService.comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      this.logger.info(`User logged in: ${user.email} (Tenant: ${user.tenant_id})`);
      return user;
    } catch (error: any) {
      this.logger.error('Error in user login:', error);
      throw error;
    }
  }

  /**
   * Get user by ID (for token verification)
   * Gracefully handles missing relation tables
   */
  async getUserById(id: string, tenant_id?: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne(id, tenant_id);
    } catch (error: any) {
      this.logger.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Get user by email (for validation)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error: any) {
      this.logger.error('Error fetching user by email:', error);
      throw error;
    }
  }
}

// Export singleton instance - will be set by bootstrap
// Using a getter function to avoid circular dependencies
let _authService: AuthService | null = null;

export function setAuthService(service: AuthService): void {
  _authService = service;
}

export function getAuthService(): AuthService {
  if (!_authService) {
    throw new Error('AuthService not initialized. Make sure bootstrapDI() is called before using authService.');
  }
  return _authService;
}

// Proxy for backward compatibility
export const authService = new Proxy({} as AuthService, {
  get(_target, prop) {
    return getAuthService()[prop as keyof AuthService];
  }
});
