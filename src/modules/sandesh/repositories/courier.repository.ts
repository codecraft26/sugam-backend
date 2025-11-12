// Courier Repository - Single Responsibility: Data Access
import { AppDataSource } from '../../../config/data-source';
import { Courier } from '../models/courier.model';
import { BaseRepository } from '../../../core/repositories/base.repository';
import { ICourierRepository } from '../../../core/interfaces/repository.interface';

export class CourierRepository extends BaseRepository<Courier> implements ICourierRepository {
  constructor() {
    super(AppDataSource.getRepository(Courier));
  }

  async findByTrackingCode(tracking_code: string, tenant_id: string): Promise<Courier | null> {
    return this.repository.findOne({
      where: { tracking_no: tracking_code, tenant_id } as any,
    });
  }

  async findByStatus(status: string, tenant_id: string): Promise<Courier[]> {
    return this.repository.find({
      where: { status, tenant_id } as any,
      order: { created_at: 'DESC' },
    });
  }

  async findUnclaimed(tenant_id: string, thresholdDate: Date): Promise<Courier[]> {
    return this.repository
      .createQueryBuilder('courier')
      .leftJoinAndSelect('courier.receiver', 'receiver')
      .leftJoinAndSelect('courier.admin', 'admin')
      .where('courier.tenant_id = :tenant_id', { tenant_id })
      .andWhere('courier.status = :status', { status: 'RECEIVED' })
      .andWhere('courier.received_at <= :thresholdDate', { thresholdDate })
      .orderBy('courier.received_at', 'ASC')
      .getMany();
  }
}

