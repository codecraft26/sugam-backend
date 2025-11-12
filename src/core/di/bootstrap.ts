// Dependency Injection Bootstrap - Register all services
import { container, SERVICE_IDS } from './container';
import { CourierRepository } from '../../modules/sandesh/repositories/courier.repository';
import { CourierRequestRepository } from '../../modules/sandesh/repositories/courierRequest.repository';
import { CourierAcknowledgmentRepository } from '../../modules/sandesh/repositories/courierAcknowledgment.repository';
import { NotificationService } from '../services/notification.service';
import { QRCodeService } from '../services/qr-code.service';
import { WiFiPasswordService } from '../services/wifi-password.service';
import { PasswordService } from '../services/password.service';
import { JWTService } from '../services/jwt.service';
import { logger } from '../../config/logger';
import { CourierNotificationService } from '../../modules/sandesh/services/courierNotification.service';
import { CourierValidationService } from '../../modules/sandesh/services/courierValidation.service';
// NOTE: CourierService still uses AppDataSource directly - needs full refactoring
// For now, using the original service with singleton export
import { UserRepository } from '../repositories/user.repository';
import { AdminRepository } from '../repositories/admin.repository';
import { SystemConfigRepository } from '../repositories/systemConfig.repository';
import { TenantRepository } from '../repositories/tenant.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { AnnouncementRepository } from '../repositories/announcement.repository';
import { TodoRepository } from '../repositories/todo.repository';
import { AuthService, setAuthService } from '../auth/auth.service';
import { AdminAuthService, setAdminAuthService } from '../admin/adminAuth.service';
import { AnnouncementService, setAnnouncementService } from '../announcements/announcement.service';
import { TodoService, setTodoService } from '../todos/todo.service';
import { CourierAcknowledgment } from '../../modules/sandesh/models/courierAcknowledgment.model';

// Logger service wrapper
class LoggerService {
  info(message: string, ...args: any[]): void {
    logger.info(message, ...args);
  }
  error(message: string, ...args: any[]): void {
    logger.error(message, ...args);
  }
  warn(message: string, ...args: any[]): void {
    logger.warn(message, ...args);
  }
  debug(message: string, ...args: any[]): void {
    logger.debug(message, ...args);
  }
}

/**
 * Bootstrap DI Container - Register all dependencies
 * Following Dependency Inversion Principle
 */
export function bootstrapDI(): void {
  // ============================================
  // REGISTER REPOSITORIES
  // ============================================
  container.registerClass(SERVICE_IDS.COURIER_REPOSITORY, CourierRepository);
  container.registerClass(SERVICE_IDS.COURIER_REQUEST_REPOSITORY, CourierRequestRepository);
  container.registerClass(SERVICE_IDS.COURIER_ACKNOWLEDGMENT_REPOSITORY, CourierAcknowledgmentRepository);
  container.registerClass(SERVICE_IDS.USER_REPOSITORY, UserRepository);
  container.registerClass(SERVICE_IDS.ADMIN_REPOSITORY, AdminRepository);
  container.registerClass(SERVICE_IDS.SYSTEM_CONFIG_REPOSITORY, SystemConfigRepository);
  container.registerClass(SERVICE_IDS.TENANT_REPOSITORY, TenantRepository);
  container.registerClass(SERVICE_IDS.ORGANIZATION_REPOSITORY, OrganizationRepository);
  container.registerClass(SERVICE_IDS.ANNOUNCEMENT_REPOSITORY, AnnouncementRepository);
  container.registerClass(SERVICE_IDS.TODO_REPOSITORY, TodoRepository);

  // ============================================
  // REGISTER CORE SERVICES
  // ============================================
  container.registerClass(SERVICE_IDS.NOTIFICATION_SERVICE, NotificationService);
  container.registerClass(SERVICE_IDS.QR_CODE_SERVICE, QRCodeService);
  container.registerClass(SERVICE_IDS.WIFI_PASSWORD_SERVICE, WiFiPasswordService);
  container.registerClass(SERVICE_IDS.PASSWORD_SERVICE, PasswordService);
  container.registerClass(SERVICE_IDS.JWT_SERVICE, JWTService);
  container.register(SERVICE_IDS.LOGGER_SERVICE, () => new LoggerService());

  // ============================================
  // REGISTER AUTH SERVICES
  // ============================================
  const authServiceInstance = new AuthService(
    container.resolve(SERVICE_IDS.USER_REPOSITORY) as any,
    container.resolve(SERVICE_IDS.PASSWORD_SERVICE) as any,
    container.resolve(SERVICE_IDS.LOGGER_SERVICE) as any
  );
  container.register(SERVICE_IDS.AUTH_SERVICE, () => authServiceInstance);

  const adminAuthServiceInstance = new AdminAuthService(
    container.resolve(SERVICE_IDS.ADMIN_REPOSITORY) as any,
    container.resolve(SERVICE_IDS.PASSWORD_SERVICE) as any,
    container.resolve(SERVICE_IDS.LOGGER_SERVICE) as any
  );
  container.register(SERVICE_IDS.ADMIN_AUTH_SERVICE, () => adminAuthServiceInstance);
  
  // Set instances for direct use (avoids circular dependency issues)
  setAuthService(authServiceInstance);
  setAdminAuthService(adminAuthServiceInstance);

  // ============================================
  // REGISTER ANNOUNCEMENT SERVICE
  // ============================================
  const announcementServiceInstance = new AnnouncementService(
    container.resolve(SERVICE_IDS.ANNOUNCEMENT_REPOSITORY) as any,
    container.resolve(SERVICE_IDS.LOGGER_SERVICE) as any
  );
  container.register(SERVICE_IDS.ANNOUNCEMENT_SERVICE, () => announcementServiceInstance);
  setAnnouncementService(announcementServiceInstance);

  // ============================================
  // REGISTER TODO SERVICE
  // ============================================
  const todoServiceInstance = new TodoService(
    container.resolve(SERVICE_IDS.TODO_REPOSITORY) as any,
    container.resolve(SERVICE_IDS.LOGGER_SERVICE) as any
  );
  container.register(SERVICE_IDS.TODO_SERVICE, () => todoServiceInstance);
  setTodoService(todoServiceInstance);

  // ============================================
  // REGISTER USER MANAGEMENT SERVICES
  // ============================================
  // NOTE: UserService and AdminService still use AppDataSource directly
  // They need to be fully refactored to use DI container
  // For now, they export singleton instances for backward compatibility

  // ============================================
  // REGISTER MODULE SERVICES
  // ============================================
  // NOTE: Module services (CourierService, FreshServeService, etc.) still use AppDataSource directly
  // They need to be fully refactored to use DI container
  // For now, they export singleton instances for backward compatibility
}

// Bootstrap is called explicitly in app.ts to avoid circular dependencies
// bootstrapDI();

