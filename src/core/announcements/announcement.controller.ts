// Announcement controller
import { Request, Response } from 'express';
import { announcementService } from './announcement.service';
import { AppDataSource } from '../../config/data-source';
import { User } from '../users/user.model';
import { logger } from '../../config/logger';
import { ApiResponseUtil } from '../../utils/apiResponse';

export class AnnouncementController {
  /**
   * Create a new announcement (superadmin only)
   * POST /api/v1/admin/announcements
   */
  async createAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can create announcements
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can create announcements');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { title, description, image_url, department } = req.body;

      if (!title || !title.trim()) {
        return ApiResponseUtil.validationError(res, ['Title is required']);
      }

      const announcement = await announcementService.createAnnouncement({
        tenant_id,
        created_by: req.user.id,
        title,
        description,
        image_url,
        department: department || null, // null means all departments
      });

      ApiResponseUtil.created(res, {
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        image_url: announcement.image_url,
        department: announcement.department,
        is_active: announcement.is_active,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
      }, 'Announcement created successfully');
    } catch (error: any) {
      logger.error('Error in createAnnouncement:', error);
      ApiResponseUtil.error(res, error, 400, 'Failed to create announcement');
    }
  }

  /**
   * Get all announcements for the tenant (superadmin view - can see all)
   * GET /api/v1/admin/announcements
   */
  async getAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can view all announcements
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can view all announcements');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const department = req.query.department as string | undefined;
      const is_active = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;

      const announcements = await announcementService.getTenantAnnouncements(tenant_id, {
        department: department || null,
        is_active,
      });

      ApiResponseUtil.success(res, {
        count: announcements.length,
        announcements: announcements.map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          description: announcement.description,
          image_url: announcement.image_url,
          department: announcement.department,
          is_active: announcement.is_active,
          created_at: announcement.created_at,
          updated_at: announcement.updated_at,
        })),
      }, 'Announcements retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getAnnouncements:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch announcements');
    }
  }

  /**
   * Get announcements visible to the current user (regular users)
   * GET /api/v1/auth/announcements
   * GET /api/v1/announcements (unified endpoint)
   */
  async getUserAnnouncements(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can view their announcements
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      // Fetch user department only - avoid loading relations that might not exist
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user.id, tenant_id } as any,
        select: ['id', 'department'], // Only select what we need
      });
      const userDepartment = user?.department || null;

      const announcements = await announcementService.getUserAnnouncements(
        tenant_id,
        userDepartment
      );

      ApiResponseUtil.success(res, {
        count: announcements.length,
        announcements: announcements.map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          description: announcement.description,
          image_url: announcement.image_url,
          department: announcement.department,
          created_at: announcement.created_at,
          updated_at: announcement.updated_at,
        })),
      }, 'Announcements retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUserAnnouncements:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch announcements');
    }
  }

  /**
   * Get a single announcement by ID (for users - only if visible to them)
   * GET /api/v1/auth/announcements/:id
   */
  async getUserAnnouncementById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can view announcement details
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;

      // Fetch user department only - avoid loading relations that might not exist
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: req.user.id, tenant_id } as any,
        select: ['id', 'department'], // Only select what we need
      });
      const userDepartment = user?.department || null;

      // Get the announcement
      const announcement = await announcementService.getAnnouncementById(id, tenant_id);

      if (!announcement) {
        return ApiResponseUtil.notFound(res, 'Announcement not found');
      }

      // Check if announcement is active
      if (!announcement.is_active) {
        return ApiResponseUtil.notFound(res, 'Announcement not found');
      }

      // Check if announcement is visible to user's department
      // User can see if: announcement.department is null (all departments) OR matches user's department
      if (announcement.department !== null && announcement.department !== userDepartment) {
        return ApiResponseUtil.forbidden(res, 'You do not have access to this announcement');
      }

      ApiResponseUtil.success(res, {
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        image_url: announcement.image_url,
        department: announcement.department,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
      }, 'Announcement retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUserAnnouncementById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch announcement');
    }
  }

  /**
   * Get a single announcement by ID
   * GET /api/v1/admin/announcements/:id
   */
  async getAnnouncementById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can view announcement details
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can view announcement details');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      const announcement = await announcementService.getAnnouncementById(id, tenant_id);

      if (!announcement) {
        return ApiResponseUtil.notFound(res, 'Announcement not found');
      }

      ApiResponseUtil.success(res, {
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        image_url: announcement.image_url,
        department: announcement.department,
        is_active: announcement.is_active,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
      }, 'Announcement retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getAnnouncementById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch announcement');
    }
  }

  /**
   * Update an announcement (superadmin only)
   * PUT /api/v1/admin/announcements/:id
   */
  async updateAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can update announcements
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can update announcements');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      const { title, description, image_url, department, is_active } = req.body;

      const announcement = await announcementService.updateAnnouncement(id, tenant_id, {
        title,
        description,
        image_url,
        department: department !== undefined ? (department || null) : undefined,
        is_active,
      });

      ApiResponseUtil.success(res, {
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        image_url: announcement.image_url,
        department: announcement.department,
        is_active: announcement.is_active,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
      }, 'Announcement updated successfully');
    } catch (error: any) {
      logger.error('Error in updateAnnouncement:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to update announcement');
    }
  }

  /**
   * Delete an announcement (superadmin only)
   * DELETE /api/v1/admin/announcements/:id
   */
  async deleteAnnouncement(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only superadmins can delete announcements
      if (req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only superadmins can delete announcements');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      await announcementService.deleteAnnouncement(id, tenant_id);

      ApiResponseUtil.success(res, null, 'Announcement deleted successfully');
    } catch (error: any) {
      logger.error('Error in deleteAnnouncement:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to delete announcement');
    }
  }
}

