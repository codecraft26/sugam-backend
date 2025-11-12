// Courier Request Repository - Single Responsibility: Data Access
import { AppDataSource } from '../../../config/data-source';
import { CourierRequest } from '../models/courierRequest.model';
import { BaseRepository } from '../../../core/repositories/base.repository';
import { ICourierRequestRepository } from '../../../core/interfaces/repository.interface';

export class CourierRequestRepository
  extends BaseRepository<CourierRequest>
  implements ICourierRequestRepository
{
  constructor() {
    super(AppDataSource.getRepository(CourierRequest));
  }

  async findPending(tenant_id: string): Promise<CourierRequest[]> {
    return this.repository.find({
      where: { tenant_id, status: 'PENDING' } as any,
      relations: ['user', 'courier'],
      order: { created_at: 'DESC' },
    });
  }

  async findByUserId(user_id: string, tenant_id: string): Promise<CourierRequest[]> {
    return this.repository.find({
      where: { user_id, tenant_id } as any,
      relations: ['courier'],
      order: { created_at: 'DESC' },
    });
  }
}

