// Fresh Serve routes
import { Router } from 'express';
import { freshServeController } from '../controllers/freshServe.controller';
import { authenticate } from '../../../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// 3.3.1 MENU MANAGEMENT (Cafeteria/Admin)
// ============================================

/**
 * @route   POST /api/v1/fresh-serve/menu/items
 * @desc    Add new menu item
 * @access  Admin, Super Admin
 */
router.post('/menu/items', freshServeController.addMenuItem.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/menu/items
 * @desc    Get all menu items
 * @access  All authenticated users
 */
router.get('/menu/items', freshServeController.getMenuItems.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/menu/items/:id
 * @desc    Get menu item by ID
 * @access  All authenticated users
 */
router.get('/menu/items/:id', freshServeController.getMenuItemById.bind(freshServeController));

/**
 * @route   PUT /api/v1/fresh-serve/menu/items/:id
 * @desc    Update menu item
 * @access  Admin, Super Admin
 */
router.put('/menu/items/:id', freshServeController.updateMenuItem.bind(freshServeController));

/**
 * @route   DELETE /api/v1/fresh-serve/menu/items/:id
 * @desc    Delete menu item
 * @access  Admin, Super Admin
 */
router.delete('/menu/items/:id', freshServeController.deleteMenuItem.bind(freshServeController));

/**
 * @route   POST /api/v1/fresh-serve/menu/categories
 * @desc    Create menu category
 * @access  Admin, Super Admin
 */
router.post('/menu/categories', freshServeController.createMenuCategory.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/menu/categories
 * @desc    Get all menu categories
 * @access  All authenticated users
 */
router.get('/menu/categories', freshServeController.getMenuCategories.bind(freshServeController));

// ============================================
// 3.3.2 FOOD ORDERING (User)
// ============================================

/**
 * @route   POST /api/v1/fresh-serve/orders
 * @desc    Place food order
 * @access  User
 */
router.post('/orders', freshServeController.placeOrder.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/orders
 * @desc    Get user's orders
 * @access  User
 */
router.get('/orders', freshServeController.getUserOrders.bind(freshServeController));

/**
 * @route   PUT /api/v1/fresh-serve/orders/:id/cancel
 * @desc    Cancel food order
 * @access  User
 */
router.put('/orders/:id/cancel', freshServeController.cancelOrder.bind(freshServeController));

/**
 * @route   POST /api/v1/fresh-serve/orders/:id/acknowledge
 * @desc    Acknowledge order
 * @access  User
 */
router.post('/orders/:id/acknowledge', freshServeController.acknowledgeOrder.bind(freshServeController));

// ============================================
// 3.3.3 ORDER MANAGEMENT (Admin)
// ============================================

/**
 * @route   GET /api/v1/fresh-serve/orders/all
 * @desc    Get all orders
 * @access  Admin, Super Admin
 */
router.get('/orders/all', freshServeController.getOrders.bind(freshServeController));

/**
 * @route   PUT /api/v1/fresh-serve/orders/:id/status
 * @desc    Update order status
 * @access  Admin, Super Admin
 */
router.put('/orders/:id/status', freshServeController.updateOrderStatus.bind(freshServeController));

/**
 * @route   POST /api/v1/fresh-serve/orders/for-employee
 * @desc    Place order for employee
 * @access  Admin, Super Admin
 */
router.post('/orders/for-employee', freshServeController.placeOrderForEmployee.bind(freshServeController));

// ============================================
// SYSTEM CONFIG (Super Admin)
// ============================================

/**
 * @route   GET /api/v1/fresh-serve/config/:key
 * @desc    Get system config value
 * @access  Super Admin, Platform Admin
 */
router.get('/config/:key', freshServeController.getSystemConfig.bind(freshServeController));

/**
 * @route   POST /api/v1/fresh-serve/config
 * @desc    Set system config value
 * @access  Super Admin, Platform Admin
 */
router.post('/config', freshServeController.setSystemConfig.bind(freshServeController));

// ============================================
// INVENTORY MANAGEMENT (Admin)
// ============================================

/**
 * @route   POST /api/v1/fresh-serve/inventory/items
 * @desc    Add inventory item
 * @access  Admin, Super Admin
 */
router.post('/inventory/items', freshServeController.addInventoryItem.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/inventory/items
 * @desc    Get all inventory items
 * @access  Admin, Super Admin
 */
router.get('/inventory/items', freshServeController.getInventoryItems.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/inventory/items/:id
 * @desc    Get inventory item by ID
 * @access  Admin, Super Admin
 */
router.get('/inventory/items/:id', freshServeController.getInventoryItemById.bind(freshServeController));

/**
 * @route   PUT /api/v1/fresh-serve/inventory/items/:id
 * @desc    Update inventory item
 * @access  Admin, Super Admin
 */
router.put('/inventory/items/:id', freshServeController.updateInventoryItem.bind(freshServeController));

/**
 * @route   DELETE /api/v1/fresh-serve/inventory/items/:id
 * @desc    Delete inventory item
 * @access  Admin, Super Admin
 */
router.delete('/inventory/items/:id', freshServeController.deleteInventoryItem.bind(freshServeController));

/**
 * @route   PUT /api/v1/fresh-serve/inventory/items/:id/adjust-stock
 * @desc    Adjust stock manually
 * @access  Admin, Super Admin
 */
router.put('/inventory/items/:id/adjust-stock', freshServeController.adjustStock.bind(freshServeController));

/**
 * @route   POST /api/v1/fresh-serve/inventory/allocate
 * @desc    Allocate inventory to employee
 * @access  Admin, Super Admin
 */
router.post('/inventory/allocate', freshServeController.allocateInventoryToEmployee.bind(freshServeController));

// ============================================
// REPORTS (Admin)
// ============================================

/**
 * @route   GET /api/v1/fresh-serve/reports/daily-usage
 * @desc    Get daily usage report
 * @access  Admin, Super Admin
 */
router.get('/reports/daily-usage', freshServeController.getDailyUsageReport.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/reports/low-stock
 * @desc    Get low stock report
 * @access  Admin, Super Admin
 */
router.get('/reports/low-stock', freshServeController.getLowStockReport.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/reports/expiry
 * @desc    Get expiry report
 * @access  Admin, Super Admin
 */
router.get('/reports/expiry', freshServeController.getExpiryReport.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/reports/wastage
 * @desc    Get wastage report
 * @access  Admin, Super Admin
 */
router.get('/reports/wastage', freshServeController.getWastageReport.bind(freshServeController));

/**
 * @route   GET /api/v1/fresh-serve/reports/master
 * @desc    Get master report
 * @access  Admin, Super Admin
 */
router.get('/reports/master', freshServeController.getMasterReport.bind(freshServeController));

export default router;

