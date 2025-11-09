// Announcement service
import { AppDataSource } from '../../config/data-source';
import { Announcement } from './announcement.model';
import { logger } from '../../config/logger';

export class AnnouncementService {
  private announcementRepository = AppDataSource.getRepository(Announcement);

  /**
   * Create a new announcement (superadmin only)
   */
  async createAnnouncement(data: {
    tenant_id: string;
    created_by: string; // Admin ID
    title: string;
    description?: string;
    image_url?: string;
    department?: string | null; // null = all departments
  }): Promise<Announcement> {
    try {
      // Validate required fields
      if (!data.title || !data.title.trim()) {
        throw new Error('Title is required');
      }

      const announcement = this.announcementRepository.create({
        tenant_id: data.tenant_id,
        created_by: data.created_by,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        image_url: data.image_url?.trim() || null,
        department: data.department?.trim() || null, // null means all departments
        is_active: true,
      });

      const savedAnnouncement = await this.announcementRepository.save(announcement);
      logger.info(`Announcement created: ${savedAnnouncement.id} by admin ${data.created_by} (Department: ${data.department || 'ALL'})`);
      return savedAnnouncement;
    } catch (error: any) {
      logger.error('Error creating announcement:', error);
      throw error;
    }
  }

  /**
   * Get all announcements for a tenant (with optional filters)
   */
  async getTenantAnnouncements(
    tenant_id: string,
    options?: {
      department?: string | null;
      is_active?: boolean;
      include_inactive?: boolean;
    }
  ): Promise<Announcement[]> {
    try {
      const where: any = {
        tenant_id,
      };

      if (options?.department !== undefined) {
        // If department is specified, show announcements for that department OR for all departments (null)
        // This requires a more complex query
        if (options.department === null) {
          // Show only announcements for all departments
          where.department = null;
        } else {
          // Show announcements for this department OR for all departments
          // We'll need to use QueryBuilder for this OR condition
          return await this.announcementRepository
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

      return await this.announcementRepository.find({
        where,
        order: {
          created_at: 'DESC',
        },
      });
    } catch (error: any) {
      logger.error('Error fetching tenant announcements:', error);
      throw error;
    }
  }

  /**
   * Get announcements visible to a user (based on their department)
   */
  async getUserAnnouncements(
    tenant_id: string,
    user_department: string | null
  ): Promise<Announcement[]> {
    try {
      // Get active announcements for the tenant
      // Show announcements that are:
      // 1. For all departments (department IS NULL), OR
      // 2. For the user's specific department
      return await this.announcementRepository
        .createQueryBuilder('announcement')
        .where('announcement.tenant_id = :tenant_id', { tenant_id })
        .andWhere('announcement.is_active = :is_active', { is_active: true })
        .andWhere(
          '(announcement.department = :department OR announcement.department IS NULL)',
          { department: user_department }
        )
        .orderBy('announcement.created_at', 'DESC')
        .getMany();
    } catch (error: any) {
      logger.error('Error fetching user announcements:', error);
      throw error;
    }
  }

  /**
   * Get a single announcement by ID
   */
  async getAnnouncementById(
    announcement_id: string,
    tenant_id: string
  ): Promise<Announcement | null> {
    try {
      return await this.announcementRepository.findOne({
        where: {
          id: announcement_id,
          tenant_id,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching announcement:', error);
      throw error;
    }
  }

  /**
   * Update an announcement (superadmin only)
   */
  async updateAnnouncement(
    announcement_id: string,
    tenant_id: string,
    data: {
      title?: string;
      description?: string;
      image_url?: string;
      department?: string | null;
      is_active?: boolean;
    }
  ): Promise<Announcement> {
    try {
      const announcement = await this.getAnnouncementById(announcement_id, tenant_id);

      if (!announcement) {
        throw new Error('Announcement not found');
      }

      if (data.title !== undefined) {
        announcement.title = data.title.trim();
      }

      if (data.description !== undefined) {
        announcement.description = data.description?.trim() || null;
      }

      if (data.image_url !== undefined) {
        announcement.image_url = data.image_url?.trim() || null;
      }

      if (data.department !== undefined) {
        announcement.department = data.department?.trim() || null;
      }

      if (data.is_active !== undefined) {
        announcement.is_active = data.is_active;
      }

      const updatedAnnouncement = await this.announcementRepository.save(announcement);
      logger.info(`Announcement updated: ${updatedAnnouncement.id}`);
      return updatedAnnouncement;
    } catch (error: any) {
      logger.error('Error updating announcement:', error);
      throw error;
    }
  }

  /**
   * Delete an announcement (superadmin only)
   */
  async deleteAnnouncement(
    announcement_id: string,
    tenant_id: string
  ): Promise<void> {
    try {
      const announcement = await this.getAnnouncementById(announcement_id, tenant_id);

      if (!announcement) {
        throw new Error('Announcement not found');
      }

      await this.announcementRepository.remove(announcement);
      logger.info(`Announcement deleted: ${announcement_id}`);
    } catch (error: any) {
      logger.error('Error deleting announcement:', error);
      throw error;
    }
  }
}

