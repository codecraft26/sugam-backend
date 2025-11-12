// Base repository interface following Interface Segregation Principle
export interface IRepository<T = any> {
  findOne(id: string, tenant_id?: string): Promise<T | null>;
  find(options?: any): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string, tenant_id?: string): Promise<void>;
  create(data: Partial<T>): T;
}

// ============================================
// COURIER REPOSITORIES
// ============================================
export interface ICourierRepository extends IRepository<any> {
  findByTrackingCode(tracking_code: string, tenant_id: string): Promise<any | null>;
  findByStatus(status: string, tenant_id: string): Promise<any[]>;
  findUnclaimed(tenant_id: string, thresholdDate: Date): Promise<any[]>;
}

export interface ICourierRequestRepository extends IRepository<any> {
  findPending(tenant_id: string): Promise<any[]>;
  findByUserId(user_id: string, tenant_id: string): Promise<any[]>;
}

export interface ICourierAcknowledgmentRepository extends IRepository<any> {
  findByCourierId(courier_id: string): Promise<any | null>;
}

// ============================================
// USER & AUTH REPOSITORIES
// ============================================
export interface IUserRepository extends IRepository<any> {
  findByEmail(email: string, tenant_id?: string): Promise<any | null>;
  findByTenant(tenant_id: string): Promise<any[]>;
  findByEmployeeId(employee_id: string, tenant_id: string): Promise<any | null>;
}

export interface IAdminRepository extends IRepository<any> {
  findByEmail(email: string): Promise<any | null>;
  findByModuleScope(tenant_id: string, module_scope: string): Promise<any[]>;
  findActiveAdmins(tenant_id: string): Promise<any[]>;
  findSuperAdmins(tenant_id: string): Promise<any[]>;
}

export interface IPlatformAdminRepository extends IRepository<any> {
  findByEmail(email: string): Promise<any | null>;
}

// ============================================
// SYSTEM & CONFIG REPOSITORIES
// ============================================
export interface ISystemConfigRepository extends IRepository<any> {
  findByKey(tenant_id: string, config_key: string): Promise<any | null>;
}

export interface ITenantRepository extends IRepository<any> {
  findByDomain(domain: string): Promise<any | null>;
  findBySubdomain(subdomain: string): Promise<any | null>;
}

export interface IOrganizationRepository extends IRepository<any> {
  findByName(name: string, tenant_id: string): Promise<any | null>;
}

// ============================================
// MODULE-SPECIFIC REPOSITORIES
// ============================================
export interface IStationeryItemRepository extends IRepository<any> {
  findByCategory(category: string, tenant_id: string): Promise<any[]>;
  findLowStock(tenant_id: string): Promise<any[]>;
}

export interface IStationeryRequestRepository extends IRepository<any> {
  findPendingApproval(tenant_id: string): Promise<any[]>;
  findByUserId(user_id: string, tenant_id: string): Promise<any[]>;
}

export interface IMenuItemRepository extends IRepository<any> {
  findByCategory(category: string, tenant_id: string): Promise<any[]>;
  findAvailable(tenant_id: string): Promise<any[]>;
}

export interface IFoodOrderRepository extends IRepository<any> {
  findByUserId(user_id: string, tenant_id: string): Promise<any[]>;
  findByStatus(status: string, tenant_id: string): Promise<any[]>;
}

export interface IVisitorRepository extends IRepository<any> {
  findByHost(host_id: string, tenant_id: string): Promise<any[]>;
  findByStatus(status: string, tenant_id: string): Promise<any[]>;
  findUnclaimed(tenant_id: string, thresholdDate: Date): Promise<any[]>;
}

export interface IKioskRepository extends IRepository<any> {
  findByDeviceId(device_id: string): Promise<any | null>;
  findByStatus(status: string, tenant_id: string): Promise<any[]>;
}

export interface IReceptionistRepository extends IRepository<any> {
  findByEmail(email: string): Promise<any | null>;
  findByApprovalStatus(status: string, tenant_id: string): Promise<any[]>;
}

export interface IBuildingStaffRepository extends IRepository<any> {
  findByBuilding(building_id: string, tenant_id: string): Promise<any[]>;
  findByFloor(floor_id: string, tenant_id: string): Promise<any[]>;
}

// ============================================
// ANNOUNCEMENT REPOSITORIES
// ============================================
export interface IAnnouncementRepository extends IRepository<any> {
  findByTenant(tenant_id: string, options?: any): Promise<any[]>;
  findByDepartment(tenant_id: string, department: string | null): Promise<any[]>;
  findActiveByDepartment(tenant_id: string, department: string | null): Promise<any[]>;
}

// ============================================
// TODO REPOSITORIES
// ============================================
export interface ITodoRepository extends IRepository<any> {
  findByUser(user_id: string, tenant_id: string, options?: any): Promise<any[]>;
  findByUserAndId(todo_id: string, user_id: string, tenant_id: string): Promise<any | null>;
}

