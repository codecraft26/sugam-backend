// User authentication routes
import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AnnouncementController } from '../announcements/announcement.controller';
import todoRoutes from '../todos/todo.routes';
import { requestUserRoutes } from '../requests/request.routes';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();
const announcementController = new AnnouncementController();

// Public routes (no authentication required)
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController)); // Public - no auth needed

// Protected routes (require authentication)
router.use(authenticate);
router.get('/me', authController.getCurrentUser.bind(authController));
router.put('/profile', authController.updateProfile.bind(authController));
router.get('/organization/users', authController.getOrganizationUsers.bind(authController));

// Todo routes (for regular users only)
router.use('/todos', todoRoutes);

// Announcement routes (for regular users to view their announcements)
router.get('/announcements', announcementController.getUserAnnouncements.bind(announcementController));
router.get('/announcements/:id', announcementController.getUserAnnouncementById.bind(announcementController));

// Request routes (for regular users to create and view their requests)
router.use('/requests', requestUserRoutes);

export default router;
