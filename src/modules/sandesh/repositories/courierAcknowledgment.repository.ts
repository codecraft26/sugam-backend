// Courier Acknowledgment Repository - Single Responsibility: Data Access
import { AppDataSource } from '../../../config/data-source';
import { CourierAcknowledgment } from '../models/courierAcknowledgment.model';
import { BaseRepository } from '../../../core/repositories/base.repository';

export class CourierAcknowledgmentRepository extends BaseRepository<CourierAcknowledgment> {
  constructor() {
    super(AppDataSource.getRepository(CourierAcknowledgment));
  }

  async findByCourierId(courier_id: string): Promise<CourierAcknowledgment | null> {
    return this.repository.findOne({
      where: { courier_id } as any,
      relations: ['acknowledgedBy'],
    });
  }
}

