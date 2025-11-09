// Stationery routes
import { Router } from 'express';
import { stationeryController } from '../controllers/stationery.controller';
import { authenticate } from '../../../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// 3.4.1 STATIONERY INVENTORY MANAGEMENT (Admin)
// ============================================

/**
 * @route   POST /api/v1/sangrah/items
 * @desc    Add new stationery item
 * @access  Admin, Super Admin
 */
router.post('/items', stationeryController.addItem.bind(stationeryController));

/**
 * @route   GET /api/v1/sangrah/items
 * @desc    Get all stationery items
 * @access  All authenticated users
 */
router.get('/items', stationeryController.getItems.bind(stationeryController));

/**
 * @route   GET /api/v1/sangrah/items/:id
 * @desc    Get stationery item by ID
 * @access  All authenticated users
 */
router.get('/items/:id', stationeryController.getItemById.bind(stationeryController));

/**
 * @route   PUT /api/v1/sangrah/items/:id
 * @desc    Update stationery item
 * @access  Admin, Super Admin
 */
router.put('/items/:id', stationeryController.updateItem.bind(stationeryController));

/**
 * @route   DELETE /api/v1/sangrah/items/:id
 * @desc    Delete stationery item
 * @access  Admin, Super Admin
 */
router.delete('/items/:id', stationeryController.deleteItem.bind(stationeryController));

/**
 * @route   PUT /api/v1/sangrah/items/:id/adjust-stock
 * @desc    Adjust stock manually
 * @access  Admin, Super Admin
 */
router.put('/items/:id/adjust-stock', stationeryController.adjustStock.bind(stationeryController));

/**
 * @route   GET /api/v1/sangrah/items/reorder-suggestions
 * @desc    Get reorder suggestions (low stock items)
 * @access  Admin, Super Admin
 */
router.get('/items/reorder-suggestions', stationeryController.getReorderSuggestions.bind(stationeryController));

// ============================================
// 3.4.2 STATIONERY REQUEST FORM (Employee)
// ============================================

/**
 * @route   POST /api/v1/sangrah/requests
 * @desc    Create stationery request
 * @access  User
 */
router.post('/requests', stationeryController.createRequest.bind(stationeryController));

/**
 * @route   GET /api/v1/sangrah/requests
 * @desc    Get user's stationery requests
 * @access  User
 */
router.get('/requests', stationeryController.getUserRequests.bind(stationeryController));

/**
 * @route   PUT /api/v1/sangrah/requests/:id/cancel
 * @desc    Cancel stationery request
 * @access  User
 */
router.put('/requests/:id/cancel', stationeryController.cancelRequest.bind(stationeryController));

// ============================================
// 3.4.3 REQUEST APPROVAL WORKFLOW (Department Head)
// ============================================

/**
 * @route   GET /api/v1/sangrah/requests/pending-approval
 * @desc    Get pending approval requests
 * @access  Admin, Super Admin (Department Head)
 */
router.get('/requests/pending-approval', stationeryController.getPendingApprovalRequests.bind(stationeryController));

/**
 * @route   PUT /api/v1/sangrah/requests/:id/approve
 * @desc    Approve stationery request
 * @access  Admin, Super Admin (Department Head)
 */
router.put('/requests/:id/approve', stationeryController.approveRequest.bind(stationeryController));

/**
 * @route   PUT /api/v1/sangrah/requests/:id/reject
 * @desc    Reject stationery request
 * @access  Admin, Super Admin (Department Head)
 */
router.put('/requests/:id/reject', stationeryController.rejectRequest.bind(stationeryController));

// ============================================
// 3.4.4 REQUEST PROCESSING (Admin)
// ============================================

/**
 * @route   GET /api/v1/sangrah/requests/approved
 * @desc    Get approved requests for processing
 * @access  Admin, Super Admin
 */
router.get('/requests/approved', stationeryController.getApprovedRequests.bind(stationeryController));

/**
 * @route   PUT /api/v1/sangrah/requests/:id/issue
 * @desc    Issue items (fulfill request)
 * @access  Admin, Super Admin
 */
router.put('/requests/:id/issue', stationeryController.issueItems.bind(stationeryController));

/**
 * @route   PUT /api/v1/sangrah/requests/:id/backorder
 * @desc    Place request on backorder
 * @access  Admin, Super Admin
 */
router.put('/requests/:id/backorder', stationeryController.backorderRequest.bind(stationeryController));

// ============================================
// 3.4.7 ACKNOWLEDGMENT OF RECEIPT (Employee)
// ============================================

/**
 * @route   POST /api/v1/sangrah/requests/:id/acknowledge
 * @desc    Acknowledge receipt of stationery items
 * @access  User
 */
router.post('/requests/:id/acknowledge', stationeryController.acknowledgeReceipt.bind(stationeryController));

/**
 * @route   GET /api/v1/sangrah/requests/:id/acknowledgment
 * @desc    Get acknowledgment by request ID
 * @access  User, Admin
 */
router.get('/requests/:id/acknowledgment', stationeryController.getAcknowledgment.bind(stationeryController));

export default router;
