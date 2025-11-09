// Admin routes (for admin management by superadmin)
import { Router } from 'express';
import { AdminController } from './admin.controller';
import { announcementAdminRoutes } from '../announcements/announcement.routes';
import { requestAdminRoutes } from '../requests/request.routes';
import { authenticate, requireSuperAdmin } from '../../middleware/authMiddleware';

const router = Router();
const adminController = new AdminController();

// All admin management routes require authentication and superadmin role
router.use(authenticate);
router.use(requireSuperAdmin);

// Admin management endpoints
router.post('/admins', adminController.createAdmin.bind(adminController));
router.get('/admins', adminController.getTenantAdmins.bind(adminController));
router.get('/admins/:id', adminController.getAdminById.bind(adminController));
router.put('/admins/:id', adminController.updateAdmin.bind(adminController));
router.delete('/admins/:id', adminController.deleteAdmin.bind(adminController));

// User management endpoints (for superadmin)
router.post('/users', adminController.createUser.bind(adminController));
router.get('/users', adminController.getTenantUsers.bind(adminController));
router.get('/users/pending', adminController.getPendingUsers.bind(adminController));
router.put('/users/:id', adminController.updateUser.bind(adminController));
router.put('/users/:id/approve', adminController.approveUser.bind(adminController));
router.delete('/users/:id/reject', adminController.rejectUser.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Announcement management endpoints (for superadmin - POST, PUT, DELETE, GET by ID)
router.use('/announcements', announcementAdminRoutes);

// Request management endpoints (for superadmin - approve/reject requests)
router.use('/requests', requestAdminRoutes);

export default router;
