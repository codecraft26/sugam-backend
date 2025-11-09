// Announcement routes
import { Router, Request, Response } from 'express';
import { AnnouncementController } from './announcement.controller';
import { authenticate, requireSuperAdmin } from '../../middleware/authMiddleware';

const router = Router();
const announcementController = new AnnouncementController();

// Unified GET endpoint that works for both users and superadmins
// Superadmins see all announcements, users see filtered announcements
router.get('/', authenticate, async (req: Request, res: Response) => {
  if (req.user?.type === 'super_admin') {
    await announcementController.getAnnouncements(req, res);
  } else if (req.user?.type === 'user') {
    await announcementController.getUserAnnouncements(req, res);
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'Forbidden',
      statusCode: 403,
    });
  }
});

// Superadmin-only management routes
const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(requireSuperAdmin);

// GET / - List all announcements (must come before /:id route)
adminRouter.get('/', announcementController.getAnnouncements.bind(announcementController));
adminRouter.post('/', announcementController.createAnnouncement.bind(announcementController));
adminRouter.get('/:id', announcementController.getAnnouncementById.bind(announcementController));
adminRouter.put('/:id', announcementController.updateAnnouncement.bind(announcementController));
adminRouter.delete('/:id', announcementController.deleteAnnouncement.bind(announcementController));

export default router;
export { adminRouter as announcementAdminRoutes };
