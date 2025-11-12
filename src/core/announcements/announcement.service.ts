// Announcement service - Following SOLID Principles
import { Announcement } from './announcement.model';
import { IAnnouncementRepository } from '../interfaces/repository.interface';
import { ILoggerService } from '../interfaces/service.interface';
import { IAnnouncementService } from '../interfaces/service.interface';

// Announcement Service - Single Responsibility: Business Logic
export class AnnouncementService implements IAnnouncementService {
  constructor(
    private announcementRepository: IAnnouncementRepository,
    private logger: ILoggerService
  ) {}

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
      this.logger.info(`Announcement created: ${savedAnnouncement.id} by admin ${data.created_by} (Department: ${data.department || 'ALL'})`);
      return savedAnnouncement;
    } catch (error: any) {
      this.logger.error('Error creating announcement:', error);
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
      return await this.announcementRepository.findByTenant(tenant_id, {
        department: options?.department,
        is_active: options?.is_active,
      });
    } catch (error: any) {
      this.logger.error('Error fetching tenant announcements:', error);
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
      return await this.announcementRepository.findActiveByDepartment(tenant_id, user_department);
    } catch (error: any) {
      this.logger.error('Error fetching user announcements:', error);
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
      return await this.announcementRepository.findOne(announcement_id, tenant_id);
    } catch (error: any) {
      this.logger.error('Error fetching announcement:', error);
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
      this.logger.info(`Announcement updated: ${updatedAnnouncement.id}`);
      return updatedAnnouncement;
    } catch (error: any) {
      this.logger.error('Error updating announcement:', error);
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

      await this.announcementRepository.delete(announcement_id, tenant_id);
      this.logger.info(`Announcement deleted: ${announcement_id}`);
    } catch (error: any) {
      this.logger.error('Error deleting announcement:', error);
      throw error;
    }
  }
}

// Export singleton instance - will be set by bootstrap
// Using a getter function to avoid circular dependencies
let _announcementService: AnnouncementService | null = null;

export function setAnnouncementService(service: AnnouncementService): void {
  _announcementService = service;
}

export function getAnnouncementService(): AnnouncementService {
  if (!_announcementService) {
    throw new Error('AnnouncementService not initialized. Make sure bootstrapDI() is called before using announcementService.');
  }
  return _announcementService;
}

// Proxy for backward compatibility
export const announcementService = new Proxy({} as AnnouncementService, {
  get(_target, prop) {
    return getAnnouncementService()[prop as keyof AnnouncementService];
  }
});

