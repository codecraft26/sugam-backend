// Organization Repository - Single Responsibility: Organization Data Access
import { AppDataSource } from '../../config/data-source';
import { Organization } from '../orgs/organization.model';
import { BaseRepository } from './base.repository';
import { IOrganizationRepository } from '../interfaces/repository.interface';

export class OrganizationRepository extends BaseRepository<Organization> implements IOrganizationRepository {
  constructor() {
    super(AppDataSource.getRepository(Organization));
  }

  async findByName(name: string, tenant_id: string): Promise<Organization | null> {
    return this.repository.findOne({
      where: { name, tenant_id } as any,
    });
  }
}

