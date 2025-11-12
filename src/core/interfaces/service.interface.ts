// Service interfaces following Interface Segregation Principle

// ============================================
// CORE SERVICES
// ============================================
export interface INotificationService {
  sendNotification(data: {
    name: string;
    email: string;
    title: string;
    message: string;
  }): Promise<void>;
}

export interface IEmailService extends INotificationService {
  sendEmail(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void>;
}

export interface ILoggerService {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

export interface IQRCodeService {
  generateQRCode(): string;
}

export interface IWiFiPasswordService {
  generatePassword(): string;
}

export interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

export interface IJWTService {
  generateToken(payload: any): string;
  verifyToken(token: string): any;
}

// ============================================
// AUTH SERVICES
// ============================================
export interface IAuthService {
  login(email: string, password: string): Promise<any>;
  register(data: any): Promise<any>;
  verifyUser(user_id: string, tenant_id: string): Promise<any>;
}

export interface IAdminAuthService {
  login(email: string, password: string): Promise<any>;
  createAdmin(data: any): Promise<any>;
}

export interface IPlatformAuthService {
  login(email: string, password: string): Promise<any>;
}

// ============================================
// USER SERVICES
// ============================================
export interface IUserService {
  createUser(data: any): Promise<any>;
  updateUser(user_id: string, tenant_id: string, data: any): Promise<any>;
  getUserById(user_id: string, tenant_id: string): Promise<any | null>;
  getUsers(tenant_id: string, options?: any): Promise<any[]>;
  deleteUser(user_id: string, tenant_id: string): Promise<void>;
}

export interface IAdminService {
  createAdmin(data: any): Promise<any>;
  updateAdmin(admin_id: string, tenant_id: string, data: any): Promise<any>;
  getAdminById(admin_id: string, tenant_id: string): Promise<any | null>;
  getAdmins(tenant_id: string, options?: any): Promise<any[]>;
  deleteAdmin(admin_id: string, tenant_id: string): Promise<void>;
}

// ============================================
// TENANT SERVICES
// ============================================
export interface ITenantService {
  createTenant(data: any): Promise<any>;
  getTenantById(tenant_id: string): Promise<any | null>;
  getTenantByDomain(domain: string): Promise<any | null>;
  updateTenant(tenant_id: string, data: any): Promise<any>;
}

// ============================================
// ANNOUNCEMENT SERVICES
// ============================================
export interface IAnnouncementService {
  createAnnouncement(data: any): Promise<any>;
  getTenantAnnouncements(tenant_id: string, options?: any): Promise<any[]>;
  getUserAnnouncements(tenant_id: string, user_department: string | null): Promise<any[]>;
  getAnnouncementById(announcement_id: string, tenant_id: string): Promise<any | null>;
  updateAnnouncement(announcement_id: string, tenant_id: string, data: any): Promise<any>;
  deleteAnnouncement(announcement_id: string, tenant_id: string): Promise<void>;
}

// ============================================
// TODO SERVICES
// ============================================
export interface ITodoService {
  createTodo(data: any): Promise<any>;
  getUserTodos(user_id: string, tenant_id: string, options?: any): Promise<any[]>;
  getTodoById(todo_id: string, user_id: string, tenant_id: string): Promise<any | null>;
  updateTodo(todo_id: string, user_id: string, tenant_id: string, data: any): Promise<any>;
  deleteTodo(todo_id: string, user_id: string, tenant_id: string): Promise<void>;
}

