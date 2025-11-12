// Announcement Repository - Single Responsibility: Data Access
import { AppDataSource } from '../../config/data-source';
import { Announcement } from '../announcements/announcement.model';
import { BaseRepository } from './base.repository';
import { IAnnouncementRepository } from '../interfaces/repository.interface';

export class AnnouncementRepository extends BaseRepository<Announcement> implements IAnnouncementRepository {
  constructor() {
    super(AppDataSource.getRepository(Announcement));
  }

  async findByTenant(tenant_id: string, options?: {
    department?: string | null;
    is_active?: boolean;
  }): Promise<Announcement[]> {
    const where: any = { tenant_id };
    
    if (options?.department !== undefined) {
      if (options.department === null) {
        where.department = null;
      } else {
        // Use QueryBuilder for OR condition
        return await this.repository
          .createQueryBuilder('announcement')
          .where('announcement.tenant_id = :tenant_id', { tenant_id })
          .andWhere(
            '(announcement.department = :department OR announcement.department IS NULL)',
            { department: options.department }
          )
          .andWhere(
            options.is_active !== undefined
              ? 'announcement.is_active = :is_active'
              : '1=1',
            options.is_active !== undefined ? { is_active: options.is_active } : {}
          )
          .orderBy('announcement.created_at', 'DESC')
          .getMany();
      }
    }

    if (options?.is_active !== undefined) {
      where.is_active = options.is_active;
    }

    return this.repository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findByDepartment(tenant_id: string, department: string | null): Promise<Announcement[]> {
    return this.repository
      .createQueryBuilder('announcement')
      .where('announcement.tenant_id = :tenant_id', { tenant_id })
      .andWhere(
        '(announcement.department = :department OR announcement.department IS NULL)',
        { department }
      )
      .orderBy('announcement.created_at', 'DESC')
      .getMany();
  }

  async findActiveByDepartment(tenant_id: string, department: string | null): Promise<Announcement[]> {
    return this.repository
      .createQueryBuilder('announcement')
      .where('announcement.tenant_id = :tenant_id', { tenant_id })
      .andWhere('announcement.is_active = :is_active', { is_active: true })
      .andWhere(
        '(announcement.department = :department OR announcement.department IS NULL)',
        { department }
      )
      .orderBy('announcement.created_at', 'DESC')
      .getMany();
  }
}

