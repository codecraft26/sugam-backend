// System Config Repository - Single Responsibility: System Config Data Access
import { AppDataSource } from '../../config/data-source';
import { SystemConfig } from '../system/systemConfig.model';
import { BaseRepository } from './base.repository';
import { ISystemConfigRepository } from '../interfaces/repository.interface';

export class SystemConfigRepository extends BaseRepository<SystemConfig> implements ISystemConfigRepository {
  constructor() {
    super(AppDataSource.getRepository(SystemConfig));
  }

  async findByKey(tenant_id: string, config_key: string): Promise<SystemConfig | null> {
    return this.repository.findOne({
      where: { tenant_id, config_key } as any,
    });
  }
}

