// Fresh Serve controller
import { Request, Response } from 'express';
import { freshServeService } from '../services/freshServe.service';
import { ApiResponseUtil } from '../../../utils/apiResponse';
import { logger } from '../../../config/logger';

export class FreshServeController {
  // ============================================
  // 3.3.1 MENU MANAGEMENT (Cafeteria/Admin)
  // ============================================

  /**
   * Add menu item
   * POST /api/v1/fresh-serve/menu/items
   * Role: Admin
   */
  async addMenuItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can add menu items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const {
        name,
        description,
        category,
        menu_category_id,
        price,
        menu_timing_start,
        menu_timing_end,
        item_photo_url,
        requires_acknowledgment,
        acknowledgment_type,
        recurring_order_enabled,
        max_recurring_orders,
      } = req.body;

      if (!name || !category) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: name, category'), 400);
      }

      const item = await freshServeService.addMenuItem(tenant_id, {
        name,
        description,
        category,
        menu_category_id,
        price,
        menu_timing_start,
        menu_timing_end,
        item_photo_url,
        requires_acknowledgment,
        acknowledgment_type,
        recurring_order_enabled,
        max_recurring_orders,
      });

      ApiResponseUtil.success(res, item, 'Menu item added successfully');
    } catch (error: any) {
      logger.error('Error in addMenuItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to add menu item');
    }
  }

  /**
   * Update menu item
   * PUT /api/v1/fresh-serve/menu/items/:id
   * Role: Admin
   */
  async updateMenuItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update menu items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const {
        name,
        description,
        category,
        menu_category_id,
        price,
        menu_timing_start,
        menu_timing_end,
        item_photo_url,
        status,
        requires_acknowledgment,
        acknowledgment_type,
        recurring_order_enabled,
        max_recurring_orders,
      } = req.body;

      const item = await freshServeService.updateMenuItem(id, tenant_id, {
        name,
        description,
        category,
        menu_category_id,
        price,
        menu_timing_start,
        menu_timing_end,
        item_photo_url,
        status,
        requires_acknowledgment,
        acknowledgment_type,
        recurring_order_enabled,
        max_recurring_orders,
      });

      ApiResponseUtil.success(res, item, 'Menu item updated successfully');
    } catch (error: any) {
      logger.error('Error in updateMenuItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update menu item');
    }
  }

  /**
   * Delete menu item
   * DELETE /api/v1/fresh-serve/menu/items/:id
   * Role: Admin
   */
  async deleteMenuItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can delete menu items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      await freshServeService.deleteMenuItem(id, tenant_id);

      ApiResponseUtil.success(res, null, 'Menu item deleted successfully');
    } catch (error: any) {
      logger.error('Error in deleteMenuItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to delete menu item');
    }
  }

  /**
   * Get all menu items
   * GET /api/v1/fresh-serve/menu/items
   * Role: All authenticated users
   */
  async getMenuItems(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { category, status, menu_category_id, search } = req.query;

      const items = await freshServeService.getMenuItems(tenant_id, {
        category: category as string,
        status: status as string,
        menu_category_id: menu_category_id as string,
        search: search as string,
      });

      ApiResponseUtil.success(res, items, 'Menu items retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getMenuItems:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch menu items');
    }
  }

  /**
   * Get menu item by ID
   * GET /api/v1/fresh-serve/menu/items/:id
   * Role: All authenticated users
   */
  async getMenuItemById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const item = await freshServeService.getMenuItemById(id, tenant_id);

      if (!item) {
        return ApiResponseUtil.notFound(res, 'Menu item not found');
      }

      ApiResponseUtil.success(res, item, 'Menu item retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getMenuItemById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch menu item');
    }
  }

  /**
   * Create menu category
   * POST /api/v1/fresh-serve/menu/categories
   * Role: Admin
   */
  async createMenuCategory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can create menu categories');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { name, description } = req.body;

      if (!name) {
        return ApiResponseUtil.error(res, new Error('Missing required field: name'), 400);
      }

      const category = await freshServeService.createMenuCategory(tenant_id, {
        name,
        description,
      });

      ApiResponseUtil.success(res, category, 'Menu category created successfully');
    } catch (error: any) {
      logger.error('Error in createMenuCategory:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to create menu category');
    }
  }

  /**
   * Get menu categories
   * GET /api/v1/fresh-serve/menu/categories
   * Role: All authenticated users
   */
  async getMenuCategories(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const categories = await freshServeService.getMenuCategories(tenant_id);

      ApiResponseUtil.success(res, categories, 'Menu categories retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getMenuCategories:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch menu categories');
    }
  }

  // ============================================
  // 3.3.2 FOOD ORDERING (User)
  // ============================================

  /**
   * Place food order
   * POST /api/v1/fresh-serve/orders
   * Role: User
   */
  async placeOrder(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can place orders');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const {
        menu_item_id,
        quantity,
        order_time,
        comments,
        room_name,
        table_name,
        cabin_name,
        qr_code_link,
        is_recurring,
        recurring_pattern,
      } = req.body;

      if (!menu_item_id || !quantity) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: menu_item_id, quantity'), 400);
      }

      const order = await freshServeService.placeOrder(tenant_id, req.user.id, {
        menu_item_id,
        quantity: parseInt(quantity, 10),
        order_time,
        comments,
        room_name,
        table_name,
        cabin_name,
        qr_code_link,
        is_recurring,
        recurring_pattern,
      });

      ApiResponseUtil.success(res, order, 'Order placed successfully');
    } catch (error: any) {
      logger.error('Error in placeOrder:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to place order');
    }
  }

  /**
   * Cancel food order
   * PUT /api/v1/fresh-serve/orders/:id/cancel
   * Role: User
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can cancel their orders');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const order = await freshServeService.cancelOrder(id, tenant_id, req.user.id);

      ApiResponseUtil.success(res, order, 'Order canceled successfully');
    } catch (error: any) {
      logger.error('Error in cancelOrder:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to cancel order');
    }
  }

  /**
   * Get user's orders
   * GET /api/v1/fresh-serve/orders
   * Role: User
   */
  async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can view their orders');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { status, date_from, date_to } = req.query;

      const orders = await freshServeService.getUserOrders(tenant_id, req.user.id, {
        status: status as string,
        date_from: date_from ? new Date(date_from as string) : undefined,
        date_to: date_to ? new Date(date_to as string) : undefined,
      });

      ApiResponseUtil.success(res, orders, 'Orders retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUserOrders:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch orders');
    }
  }

  /**
   * Acknowledge order
   * POST /api/v1/fresh-serve/orders/:id/acknowledge
   * Role: User
   */
  async acknowledgeOrder(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can acknowledge orders');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { check_in_popup, digital_signature } = req.body;

      const acknowledgment = await freshServeService.acknowledgeOrder(id, tenant_id, req.user.id, {
        check_in_popup,
        digital_signature,
      });

      ApiResponseUtil.success(res, acknowledgment, 'Order acknowledged successfully');
    } catch (error: any) {
      logger.error('Error in acknowledgeOrder:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to acknowledge order');
    }
  }

  // ============================================
  // 3.3.3 ORDER MANAGEMENT (Admin)
  // ============================================

  /**
   * Get all orders
   * GET /api/v1/fresh-serve/orders/all
   * Role: Admin
   */
  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view all orders');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { status, date_from, date_to, employee_id } = req.query;

      const orders = await freshServeService.getOrders(tenant_id, {
        status: status as string,
        date_from: date_from ? new Date(date_from as string) : undefined,
        date_to: date_to ? new Date(date_to as string) : undefined,
        employee_id: employee_id as string,
      });

      ApiResponseUtil.success(res, orders, 'Orders retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getOrders:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch orders');
    }
  }

  /**
   * Update order status
   * PUT /api/v1/fresh-serve/orders/:id/status
   * Role: Admin
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update order status');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { status, admin_notes } = req.body;

      if (!status) {
        return ApiResponseUtil.error(res, new Error('Missing required field: status'), 400);
      }

      const order = await freshServeService.updateOrderStatus(id, tenant_id, req.user.id, status, admin_notes);

      ApiResponseUtil.success(res, order, 'Order status updated successfully');
    } catch (error: any) {
      logger.error('Error in updateOrderStatus:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update order status');
    }
  }

  /**
   * Place order for employee
   * POST /api/v1/fresh-serve/orders/for-employee
   * Role: Admin
   */
  async placeOrderForEmployee(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can place orders for employees');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const {
        user_id,
        menu_item_id,
        quantity,
        order_time,
        comments,
        room_name,
        table_name,
        cabin_name,
      } = req.body;

      if (!user_id || !menu_item_id || !quantity) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: user_id, menu_item_id, quantity'), 400);
      }

      const order = await freshServeService.placeOrderForEmployee(tenant_id, req.user.id, user_id, {
        menu_item_id,
        quantity: parseInt(quantity, 10),
        order_time,
        comments,
        room_name,
        table_name,
        cabin_name,
      });

      ApiResponseUtil.success(res, order, 'Order placed for employee successfully');
    } catch (error: any) {
      logger.error('Error in placeOrderForEmployee:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to place order for employee');
    }
  }

  // ============================================
  // SYSTEM CONFIG (Super Admin)
  // ============================================

  /**
   * Get system config
   * GET /api/v1/fresh-serve/config/:key
   * Role: Super Admin
   */
  async getSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'super_admin' && req.user.type !== 'platform_admin') {
        return ApiResponseUtil.forbidden(res, 'Only super admins can view system config');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { key } = req.params;

      const value = await freshServeService.getSystemConfig(tenant_id, key);

      ApiResponseUtil.success(res, { key, value }, 'System config retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getSystemConfig:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch system config');
    }
  }

  /**
   * Set system config
   * POST /api/v1/fresh-serve/config
   * Role: Super Admin
   */
  async setSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'super_admin' && req.user.type !== 'platform_admin') {
        return ApiResponseUtil.forbidden(res, 'Only super admins can set system config');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { config_key, config_value, config_type } = req.body;

      if (!config_key || config_value === undefined) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: config_key, config_value'), 400);
      }

      const config = await freshServeService.setSystemConfig(
        tenant_id,
        config_key,
        config_value,
        config_type || 'STRING'
      );

      ApiResponseUtil.success(res, config, 'System config set successfully');
    } catch (error: any) {
      logger.error('Error in setSystemConfig:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to set system config');
    }
  }

  // ============================================
  // INVENTORY MANAGEMENT (Admin)
  // ============================================

  /**
   * Add inventory item
   * POST /api/v1/fresh-serve/inventory/items
   * Role: Admin
   */
  async addInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can add inventory items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const {
        item_name,
        category,
        unit,
        quantity,
        threshold_limit,
        vendor_name,
        purchase_date,
        expiry_date,
      } = req.body;

      if (!item_name || !category || !unit || quantity === undefined) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: item_name, category, unit, quantity'), 400);
      }

      const item = await freshServeService.addInventoryItem(tenant_id, {
        item_name,
        category,
        unit,
        quantity: parseInt(quantity, 10),
        threshold_limit: threshold_limit ? parseInt(threshold_limit, 10) : undefined,
        vendor_name,
        purchase_date: purchase_date ? new Date(purchase_date) : undefined,
        expiry_date: expiry_date ? new Date(expiry_date) : undefined,
      });

      ApiResponseUtil.success(res, item, 'Inventory item added successfully');
    } catch (error: any) {
      logger.error('Error in addInventoryItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to add inventory item');
    }
  }

  /**
   * Update inventory item
   * PUT /api/v1/fresh-serve/inventory/items/:id
   * Role: Admin
   */
  async updateInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update inventory items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const {
        item_name,
        category,
        unit,
        quantity,
        threshold_limit,
        vendor_name,
        purchase_date,
        expiry_date,
        status,
      } = req.body;

      const item = await freshServeService.updateInventoryItem(id, tenant_id, {
        item_name,
        category,
        unit,
        quantity: quantity ? parseInt(quantity, 10) : undefined,
        threshold_limit: threshold_limit ? parseInt(threshold_limit, 10) : undefined,
        vendor_name,
        purchase_date: purchase_date ? new Date(purchase_date) : undefined,
        expiry_date: expiry_date ? new Date(expiry_date) : undefined,
        status,
      });

      ApiResponseUtil.success(res, item, 'Inventory item updated successfully');
    } catch (error: any) {
      logger.error('Error in updateInventoryItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update inventory item');
    }
  }

  /**
   * Delete inventory item
   * DELETE /api/v1/fresh-serve/inventory/items/:id
   * Role: Admin
   */
  async deleteInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can delete inventory items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      await freshServeService.deleteInventoryItem(id, tenant_id);

      ApiResponseUtil.success(res, null, 'Inventory item deleted successfully');
    } catch (error: any) {
      logger.error('Error in deleteInventoryItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to delete inventory item');
    }
  }

  /**
   * Get all inventory items
   * GET /api/v1/fresh-serve/inventory/items
   * Role: Admin
   */
  async getInventoryItems(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view inventory items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { category, status, search } = req.query;

      const items = await freshServeService.getInventoryItems(tenant_id, {
        category: category as string,
        status: status as string,
        search: search as string,
      });

      ApiResponseUtil.success(res, items, 'Inventory items retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getInventoryItems:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch inventory items');
    }
  }

  /**
   * Get inventory item by ID
   * GET /api/v1/fresh-serve/inventory/items/:id
   * Role: Admin
   */
  async getInventoryItemById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view inventory items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const item = await freshServeService.getInventoryItemById(id, tenant_id);

      if (!item) {
        return ApiResponseUtil.notFound(res, 'Inventory item not found');
      }

      ApiResponseUtil.success(res, item, 'Inventory item retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getInventoryItemById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch inventory item');
    }
  }

  /**
   * Adjust stock
   * PUT /api/v1/fresh-serve/inventory/items/:id/adjust-stock
   * Role: Admin
   */
  async adjustStock(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can adjust stock');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { adjustment, reason } = req.body;

      if (adjustment === undefined || !reason) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: adjustment, reason'), 400);
      }

      const item = await freshServeService.adjustStock(id, tenant_id, req.user.id, {
        adjustment: parseInt(adjustment, 10),
        reason,
      });

      ApiResponseUtil.success(res, item, 'Stock adjusted successfully');
    } catch (error: any) {
      logger.error('Error in adjustStock:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to adjust stock');
    }
  }

  /**
   * Allocate inventory to employee
   * POST /api/v1/fresh-serve/inventory/allocate
   * Role: Admin
   */
  async allocateInventoryToEmployee(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can allocate inventory');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { inventory_item_id, user_id, quantity, purpose, requires_acknowledgment } = req.body;

      if (!inventory_item_id || !user_id || !quantity) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: inventory_item_id, user_id, quantity'), 400);
      }

      const allocation = await freshServeService.allocateInventoryToEmployee(tenant_id, req.user.id, user_id, {
        item_id: inventory_item_id,
        quantity: parseInt(quantity, 10),
        purpose,
        requires_acknowledgment,
      });

      ApiResponseUtil.success(res, allocation, 'Inventory allocated successfully');
    } catch (error: any) {
      logger.error('Error in allocateInventoryToEmployee:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to allocate inventory');
    }
  }

  // ============================================
  // REPORTS (Admin)
  // ============================================

  /**
   * Get daily usage report
   * GET /api/v1/fresh-serve/reports/daily-usage
   * Role: Admin
   */
  async getDailyUsageReport(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view reports');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { date } = req.query;

      if (!date) {
        return ApiResponseUtil.error(res, new Error('Missing required query parameter: date'), 400);
      }

      const report = await freshServeService.getDailyUsageReport(tenant_id, new Date(date as string));

      ApiResponseUtil.success(res, report, 'Daily usage report retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getDailyUsageReport:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch daily usage report');
    }
  }

  /**
   * Get low stock report
   * GET /api/v1/fresh-serve/reports/low-stock
   * Role: Admin
   */
  async getLowStockReport(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view reports');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const items = await freshServeService.getLowStockReport(tenant_id);

      ApiResponseUtil.success(res, items, 'Low stock report retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getLowStockReport:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch low stock report');
    }
  }

  /**
   * Get expiry report
   * GET /api/v1/fresh-serve/reports/expiry
   * Role: Admin
   */
  async getExpiryReport(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view reports');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const items = await freshServeService.getExpiryReport(tenant_id);

      ApiResponseUtil.success(res, items, 'Expiry report retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getExpiryReport:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch expiry report');
    }
  }

  /**
   * Get wastage report
   * GET /api/v1/fresh-serve/reports/wastage
   * Role: Admin
   */
  async getWastageReport(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view reports');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { date_from, date_to, category } = req.query;

      const report = await freshServeService.getWastageReport(tenant_id, {
        date_from: date_from ? new Date(date_from as string) : undefined,
        date_to: date_to ? new Date(date_to as string) : undefined,
        category: category as string,
      });

      ApiResponseUtil.success(res, report, 'Wastage report retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getWastageReport:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch wastage report');
    }
  }

  /**
   * Get master report
   * GET /api/v1/fresh-serve/reports/master
   * Role: Admin
   */
  async getMasterReport(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view reports');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { date_from, date_to, reconciliation_type, department } = req.query;

      const report = await freshServeService.getMasterReport(tenant_id, {
        date_from: date_from ? new Date(date_from as string) : undefined,
        date_to: date_to ? new Date(date_to as string) : undefined,
        reconciliation_type: reconciliation_type as string,
        department: department as string,
      });

      ApiResponseUtil.success(res, report, 'Master report retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getMasterReport:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch master report');
    }
  }
}

// Export singleton instance
export const freshServeController = new FreshServeController();

