// Courier routes
import { Router } from 'express';
import { courierController } from '../controllers/courier.controller';
import { authenticate } from '../../../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// 4.1 COURIER MANAGEMENT (Receptionist/Admin)
// ============================================

/**
 * @route   POST /api/v1/sandesh/couriers
 * @desc    Add new courier
 * @access  Admin, Super Admin
 */
router.post('/couriers', courierController.addCourier.bind(courierController));

/**
 * @route   GET /api/v1/sandesh/couriers
 * @desc    Get all couriers with search and filters
 * @access  Admin, Super Admin
 */
router.get('/couriers', courierController.getCouriers.bind(courierController));

/**
 * @route   GET /api/v1/sandesh/couriers/unclaimed
 * @desc    Get unclaimed couriers
 * @access  Admin, Super Admin
 */
router.get('/couriers/unclaimed', courierController.getUnclaimedCouriers.bind(courierController));

/**
 * @route   GET /api/v1/sandesh/couriers/:id
 * @desc    Get courier by ID
 * @access  All authenticated users (receiver or admin)
 */
router.get('/couriers/:id', courierController.getCourierById.bind(courierController));

/**
 * @route   PUT /api/v1/sandesh/couriers/:id/status
 * @desc    Update courier status
 * @access  Admin, Super Admin
 */
router.put('/couriers/:id/status', courierController.updateCourierStatus.bind(courierController));

/**
 * @route   PUT /api/v1/sandesh/couriers/:id/claim
 * @desc    Mark courier as claimed
 * @access  Admin, Super Admin
 */
router.put('/couriers/:id/claim', courierController.markAsClaimed.bind(courierController));

// ============================================
// 4.2 COURIER REQUEST (Employee)
// ============================================

/**
 * @route   POST /api/v1/sandesh/requests
 * @desc    Create courier request
 * @access  User
 */
router.post('/requests', courierController.createRequest.bind(courierController));

/**
 * @route   GET /api/v1/sandesh/requests
 * @desc    Get user's courier requests
 * @access  User
 */
router.get('/requests', courierController.getUserRequests.bind(courierController));

/**
 * @route   PUT /api/v1/sandesh/requests/:id/cancel
 * @desc    Cancel courier request
 * @access  User
 */
router.put('/requests/:id/cancel', courierController.cancelRequest.bind(courierController));

// ============================================
// 4.3 REQUEST HANDLING (Receptionist/Admin)
// ============================================

/**
 * @route   GET /api/v1/sandesh/requests/pending
 * @desc    Get pending courier requests
 * @access  Admin, Super Admin
 */
router.get('/requests/pending', courierController.getPendingRequests.bind(courierController));

/**
 * @route   PUT /api/v1/sandesh/requests/:id/approve
 * @desc    Approve courier request and create courier
 * @access  Admin, Super Admin
 */
router.put('/requests/:id/approve', courierController.approveRequest.bind(courierController));

/**
 * @route   PUT /api/v1/sandesh/requests/:id/reject
 * @desc    Reject courier request
 * @access  Admin, Super Admin
 */
router.put('/requests/:id/reject', courierController.rejectRequest.bind(courierController));

// ============================================
// 4.4 ACKNOWLEDGMENT (Employee)
// ============================================

/**
 * @route   POST /api/v1/sandesh/couriers/:id/acknowledge
 * @desc    Acknowledge courier receipt
 * @access  User
 */
router.post('/couriers/:id/acknowledge', courierController.acknowledgeCourier.bind(courierController));

/**
 * @route   GET /api/v1/sandesh/couriers/:id/acknowledgment
 * @desc    Get acknowledgment by courier ID
 * @access  User, Admin
 */
router.get('/couriers/:id/acknowledgment', courierController.getAcknowledgment.bind(courierController));

// ============================================
// SYSTEM CONFIG (Super Admin)
// ============================================

/**
 * @route   GET /api/v1/sandesh/config/:key
 * @desc    Get system config value
 * @access  Super Admin, Platform Admin
 */
router.get('/config/:key', courierController.getSystemConfig.bind(courierController));

/**
 * @route   POST /api/v1/sandesh/config
 * @desc    Set system config value
 * @access  Super Admin, Platform Admin
 */
router.post('/config', courierController.setSystemConfig.bind(courierController));

export default router;

