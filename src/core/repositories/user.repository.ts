// User Repository - Single Responsibility: User Data Access
import { AppDataSource } from '../../config/data-source';
import { User } from '../users/user.model';
import { BaseRepository } from './base.repository';
import { IUserRepository } from '../interfaces/repository.interface';

export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor() {
    super(AppDataSource.getRepository(User));
  }

  async findByEmail(email: string, tenant_id?: string): Promise<User | null> {
    const where: any = { email };
    if (tenant_id) {
      where.tenant_id = tenant_id;
    }
    return this.repository.findOne({ where, relations: ['tenant', 'role'] });
  }

  async findByTenant(tenant_id: string): Promise<User[]> {
    return this.repository.find({
      where: { tenant_id } as any,
      relations: ['role', 'organization'],
    });
  }

  async findByEmployeeId(employee_id: string, tenant_id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { employee_id, tenant_id } as any,
    });
  }
}

