// Admin Repository - Single Responsibility: Admin Data Access
import { AppDataSource } from '../../config/data-source';
import { Admin } from '../admin/admin.model';
import { BaseRepository } from './base.repository';
import { IAdminRepository } from '../interfaces/repository.interface';

export class AdminRepository extends BaseRepository<Admin> implements IAdminRepository {
  constructor() {
    super(AppDataSource.getRepository(Admin));
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.repository.findOne({
      where: { email } as any,
    });
  }

  async findByModuleScope(tenant_id: string, module_scope: string): Promise<Admin[]> {
    const allAdmins = await this.repository.find({
      where: { tenant_id, is_active: true } as any,
    });

    return allAdmins.filter(
      (admin) =>
        admin.is_super_admin ||
        admin.module_scope === module_scope ||
        admin.module_scope === 'ALL'
    );
  }

  async findActiveAdmins(tenant_id: string): Promise<Admin[]> {
    return this.repository.find({
      where: { tenant_id, is_active: true } as any,
    });
  }

  async findSuperAdmins(tenant_id: string): Promise<Admin[]> {
    return this.repository.find({
      where: { tenant_id, is_active: true, is_super_admin: true } as any,
    });
  }
}

