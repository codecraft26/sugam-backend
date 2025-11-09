// Visitor Management routes
import { Router } from 'express';
import { visitorController } from '../controllers/visitor.controller';
import { authenticate } from '../../../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// 2.1 VISITOR REGISTRATION
// ============================================

/**
 * @route   POST /api/v1/dwar/visitors
 * @desc    Register visitor (walk-in, pre-registration, self-checkin, bulk)
 * @access  User, Admin, Receptionist
 */
router.post('/visitors', visitorController.registerVisitor.bind(visitorController));

/**
 * @route   GET /api/v1/dwar/visitors
 * @desc    Get all visitors with search and filters
 * @access  Admin, Super Admin
 */
router.get('/visitors', visitorController.getVisitors.bind(visitorController));

/**
 * @route   GET /api/v1/dwar/visitors/my-visitors
 * @desc    Get user's visitors (Employee Journey)
 * @access  User
 */
router.get('/visitors/my-visitors', visitorController.getUserVisitors.bind(visitorController));

/**
 * @route   GET /api/v1/dwar/visitors/:id
 * @desc    Get visitor by ID
 * @access  All authenticated users (receiver or admin)
 */
router.get('/visitors/:id', visitorController.getVisitorById.bind(visitorController));

/**
 * @route   GET /api/v1/dwar/visitors/:id/activity-log
 * @desc    Get visitor activity log
 * @access  Admin, User (own visitors)
 */
router.get('/visitors/:id/activity-log', visitorController.getVisitorActivityLog.bind(visitorController));

// ============================================
// 2.4 ADMIN JOURNEY - VISITOR MANAGEMENT
// ============================================

/**
 * @route   PUT /api/v1/dwar/visitors/:id/approve
 * @desc    Approve visitor request
 * @access  Admin, Super Admin
 */
router.put('/visitors/:id/approve', visitorController.approveVisitor.bind(visitorController));

/**
 * @route   PUT /api/v1/dwar/visitors/:id/reject
 * @desc    Reject visitor request
 * @access  Admin, Super Admin
 */
router.put('/visitors/:id/reject', visitorController.rejectVisitor.bind(visitorController));

/**
 * @route   PUT /api/v1/dwar/visitors/:id/host
 * @desc    Update visitor host
 * @access  Admin, Super Admin
 */
router.put('/visitors/:id/host', visitorController.updateVisitorHost.bind(visitorController));

/**
 * @route   POST /api/v1/dwar/visitors/:id/check-in
 * @desc    Check-in visitor
 * @access  Admin, Receptionist
 */
router.post('/visitors/:id/check-in', visitorController.checkInVisitor.bind(visitorController));

/**
 * @route   POST /api/v1/dwar/visitors/:id/check-out
 * @desc    Check-out visitor
 * @access  Admin, Receptionist
 */
router.post('/visitors/:id/check-out', visitorController.checkOutVisitor.bind(visitorController));

/**
 * @route   PUT /api/v1/dwar/visitors/:id/archive
 * @desc    Archive visitor
 * @access  Admin, Super Admin
 */
router.put('/visitors/:id/archive', visitorController.archiveVisitor.bind(visitorController));

// ============================================
// 2.4.3 KIOSK MANAGEMENT
// ============================================

/**
 * @route   POST /api/v1/dwar/kiosks
 * @desc    Add kiosk device
 * @access  Admin, Super Admin
 */
router.post('/kiosks', visitorController.addKiosk.bind(visitorController));

/**
 * @route   GET /api/v1/dwar/kiosks
 * @desc    Get all kiosks
 * @access  Admin, Super Admin
 */
router.get('/kiosks', visitorController.getKiosks.bind(visitorController));

/**
 * @route   PUT /api/v1/dwar/kiosks/:id/status
 * @desc    Update kiosk status
 * @access  Admin, Super Admin
 */
router.put('/kiosks/:id/status', visitorController.updateKioskStatus.bind(visitorController));

/**
 * @route   PUT /api/v1/dwar/kiosks/:id/config
 * @desc    Update kiosk registration form config
 * @access  Admin, Super Admin
 */
router.put('/kiosks/:id/config', visitorController.updateKioskConfig.bind(visitorController));

// ============================================
// 2.4.4 STAFF MANAGEMENT
// ============================================

/**
 * @route   POST /api/v1/dwar/staff
 * @desc    Add building staff
 * @access  Admin, Super Admin
 */
router.post('/staff', visitorController.addBuildingStaff.bind(visitorController));

/**
 * @route   GET /api/v1/dwar/staff
 * @desc    Get building staff
 * @access  Admin, Super Admin
 */
router.get('/staff', visitorController.getBuildingStaff.bind(visitorController));

/**
 * @route   PUT /api/v1/dwar/staff/:id
 * @desc    Update building staff
 * @access  Admin, Super Admin
 */
router.put('/staff/:id', visitorController.updateBuildingStaff.bind(visitorController));

/**
 * @route   DELETE /api/v1/dwar/staff/:id
 * @desc    Delete building staff
 * @access  Admin, Super Admin
 */
router.delete('/staff/:id', visitorController.deleteBuildingStaff.bind(visitorController));

// ============================================
// 2.4.5 RECEPTIONIST APPROVAL
// ============================================

/**
 * @route   GET /api/v1/dwar/receptionists
 * @desc    Get receptionists
 * @access  Admin, Super Admin
 */
router.get('/receptionists', visitorController.getReceptionists.bind(visitorController));

/**
 * @route   PUT /api/v1/dwar/receptionists/:id/approve
 * @desc    Approve receptionist
 * @access  Admin, Super Admin
 */
router.put('/receptionists/:id/approve', visitorController.approveReceptionist.bind(visitorController));

/**
 * @route   PUT /api/v1/dwar/receptionists/:id/reject
 * @desc    Reject receptionist
 * @access  Admin, Super Admin
 */
router.put('/receptionists/:id/reject', visitorController.rejectReceptionist.bind(visitorController));

export default router;

