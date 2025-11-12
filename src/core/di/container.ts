// Simple Dependency Injection Container following Dependency Inversion Principle
type Constructor<T = {}> = new (...args: any[]) => T;
type Factory<T> = () => T;

interface ServiceDescriptor {
  factory: Factory<any>;
  singleton: boolean;
  instance?: any;
}

class DIContainer {
  private services = new Map<string, ServiceDescriptor>();

  /**
   * Register a service
   */
  register<T>(
    identifier: string,
    factory: Factory<T>,
    singleton: boolean = true
  ): void {
    this.services.set(identifier, { factory, singleton });
  }

  /**
   * Register a class as a service
   */
  registerClass<T>(
    identifier: string,
    constructor: Constructor<T>,
    singleton: boolean = true
  ): void {
    this.register(identifier, () => new constructor(), singleton);
  }

  /**
   * Resolve a service
   */
  resolve<T>(identifier: string): T {
    const descriptor = this.services.get(identifier);

    if (!descriptor) {
      throw new Error(`Service '${identifier}' not found`);
    }

    // Return singleton instance if exists
    if (descriptor.singleton && descriptor.instance) {
      return descriptor.instance as T;
    }

    // Create new instance
    const instance = descriptor.factory();

    // Store singleton instance
    if (descriptor.singleton) {
      descriptor.instance = instance;
    }

    return instance as T;
  }

  /**
   * Check if service is registered
   */
  isRegistered(identifier: string): boolean {
    return this.services.has(identifier);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }
}

// Export singleton instance
export const container = new DIContainer();

// Service identifiers - Following Dependency Inversion Principle
export const SERVICE_IDS = {
  // ============================================
  // REPOSITORIES
  // ============================================
  // Courier
  COURIER_REPOSITORY: 'ICourierRepository',
  COURIER_REQUEST_REPOSITORY: 'ICourierRequestRepository',
  COURIER_ACKNOWLEDGMENT_REPOSITORY: 'ICourierAcknowledgmentRepository',
  
  // User & Auth
  USER_REPOSITORY: 'IUserRepository',
  ADMIN_REPOSITORY: 'IAdminRepository',
  PLATFORM_ADMIN_REPOSITORY: 'IPlatformAdminRepository',
  
  // System
  SYSTEM_CONFIG_REPOSITORY: 'ISystemConfigRepository',
  TENANT_REPOSITORY: 'ITenantRepository',
  ORGANIZATION_REPOSITORY: 'IOrganizationRepository',
  
  // Stationery
  STATIONERY_ITEM_REPOSITORY: 'IStationeryItemRepository',
  STATIONERY_REQUEST_REPOSITORY: 'IStationeryRequestRepository',
  
  // Fresh Serve
  MENU_ITEM_REPOSITORY: 'IMenuItemRepository',
  FOOD_ORDER_REPOSITORY: 'IFoodOrderRepository',
  
  // DWAR
  VISITOR_REPOSITORY: 'IVisitorRepository',
  KIOSK_REPOSITORY: 'IKioskRepository',
  RECEPTIONIST_REPOSITORY: 'IReceptionistRepository',
  BUILDING_STAFF_REPOSITORY: 'IBuildingStaffRepository',
  
  // Announcements
  ANNOUNCEMENT_REPOSITORY: 'IAnnouncementRepository',
  
  // Todos
  TODO_REPOSITORY: 'ITodoRepository',
  
  // ============================================
  // CORE SERVICES
  // ============================================
  NOTIFICATION_SERVICE: 'INotificationService',
  EMAIL_SERVICE: 'IEmailService',
  LOGGER_SERVICE: 'ILoggerService',
  QR_CODE_SERVICE: 'IQRCodeService',
  WIFI_PASSWORD_SERVICE: 'IWiFiPasswordService',
  PASSWORD_SERVICE: 'IPasswordService',
  JWT_SERVICE: 'IJWTService',
  
  // ============================================
  // BUSINESS SERVICES
  // ============================================
  // Auth
  AUTH_SERVICE: 'IAuthService',
  ADMIN_AUTH_SERVICE: 'IAdminAuthService',
  PLATFORM_AUTH_SERVICE: 'IPlatformAuthService',
  
  // User Management
  USER_SERVICE: 'IUserService',
  ADMIN_SERVICE: 'IAdminService',
  TENANT_SERVICE: 'ITenantService',
  
  // Module Services
  COURIER_SERVICE: 'ICourierService',
  STATIONERY_SERVICE: 'IStationeryService',
  FRESH_SERVE_SERVICE: 'IFreshServeService',
  VISITOR_SERVICE: 'IVisitorService',
  ANNOUNCEMENT_SERVICE: 'IAnnouncementService',
  TODO_SERVICE: 'ITodoService',
} as const;

