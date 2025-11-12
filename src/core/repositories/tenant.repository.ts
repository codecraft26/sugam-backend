// Tenant Repository - Single Responsibility: Tenant Data Access
import { AppDataSource } from '../../config/data-source';
import { Tenant } from '../tenancy/tenant.model';
import { BaseRepository } from './base.repository';
import { ITenantRepository } from '../interfaces/repository.interface';

export class TenantRepository extends BaseRepository<Tenant> implements ITenantRepository {
  constructor() {
    super(AppDataSource.getRepository(Tenant));
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.repository.findOne({
      where: { domain } as any,
    });
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.repository.findOne({
      where: { subdomain } as any,
    });
  }
}

