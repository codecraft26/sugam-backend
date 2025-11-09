// Request routes
import { Router, Request, Response } from 'express';
import { RequestController } from './request.controller';
import { authenticate, requireSuperAdmin } from '../../middleware/authMiddleware';

const router = Router();
const requestController = new RequestController();

// Unified GET endpoint that works for both users and superadmins
// Superadmins see all tenant requests, users see their own requests
router.get('/', authenticate, async (req: Request, res: Response) => {
  if (req.user?.type === 'super_admin') {
    await requestController.getTenantRequests(req, res);
  } else if (req.user?.type === 'user') {
    await requestController.getUserRequests(req, res);
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'Forbidden',
      statusCode: 403,
    });
  }
});

// User routes (for creating requests and viewing their own requests by ID)
const userRouter = Router();
userRouter.use(authenticate);

userRouter.post('/', requestController.createRequest.bind(requestController));
userRouter.get('/', requestController.getUserRequests.bind(requestController));
userRouter.get('/:id', requestController.getUserRequestById.bind(requestController));

// Superadmin routes (for managing all requests)
const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(requireSuperAdmin);

adminRouter.get('/', requestController.getTenantRequests.bind(requestController));
adminRouter.get('/:id', requestController.getRequestById.bind(requestController));
adminRouter.put('/:id/approve', requestController.approveRequest.bind(requestController));
adminRouter.put('/:id/reject', requestController.rejectRequest.bind(requestController));

// Export unified router for /api/v1/requests
export default router;
// Export user router for /api/v1/auth/requests
export { userRouter as requestUserRoutes };
// Export admin router for /api/v1/admin/requests
export { adminRouter as requestAdminRoutes };

