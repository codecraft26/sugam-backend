// Fresh Serve service - comprehensive food ordering and management
import { AppDataSource } from '../../../config/data-source';
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { FoodOrder } from '../models/foodOrder.model';
import { FoodOrderAcknowledgment } from '../models/foodOrderAcknowledgment.model';
import { Reconciliation } from '../models/reconciliation.model';
import { InventoryItem } from '../models/inventoryItem.model';
import { SystemConfig } from '../../../core/system/systemConfig.model';
import { User } from '../../../core/users/user.model';
import { Admin } from '../../../core/admin/admin.model';
import { logger } from '../../../config/logger';
import { emailService } from '../../../core/email';

export class FreshServeService {
  private menuItemRepository = AppDataSource.getRepository(MenuItem);
  private menuCategoryRepository = AppDataSource.getRepository(MenuCategory);
  private foodOrderRepository = AppDataSource.getRepository(FoodOrder);
  private acknowledgmentRepository = AppDataSource.getRepository(FoodOrderAcknowledgment);
  private reconciliationRepository = AppDataSource.getRepository(Reconciliation);
  private inventoryRepository = AppDataSource.getRepository(InventoryItem);
  private systemConfigRepository = AppDataSource.getRepository(SystemConfig);
  private userRepository = AppDataSource.getRepository(User);
  private adminRepository = AppDataSource.getRepository(Admin);

  // ============================================
  // 3.3.1 MENU MANAGEMENT (Cafeteria/Admin)
  // ============================================

  /**
   * Add menu item
   */
  async addMenuItem(
    tenant_id: string,
    data: {
      name: string;
      description?: string;
      category: string; // Breakfast, Lunch, Snacks, Dinner
      menu_category_id?: string; // Prestige, Silver, Platinum menu
      price?: number;
      menu_timing_start?: string; // Time format: "HH:MM"
      menu_timing_end?: string;
      item_photo_url?: string;
      requires_acknowledgment?: boolean;
      acknowledgment_type?: 'CHECK_IN' | 'DIGITAL_SIGNATURE' | 'BOTH';
      recurring_order_enabled?: boolean;
      max_recurring_orders?: number;
    }
  ): Promise<MenuItem> {
    try {
      // Validate name length
      if (data.name.length < 1 || data.name.length > 100) {
        throw new Error('Item name must be between 1 and 100 characters');
      }

      // Validate description length
      if (data.description && data.description.length > 200) {
        throw new Error('Description must be less than 200 characters');
      }

      const item = this.menuItemRepository.create({
        tenant_id,
        name: data.name.trim(),
        description: data.description?.trim() || (null as any),
        category: data.category,
        menu_category_id: data.menu_category_id || (null as any),
        price: data.price || (null as any),
        menu_timing_start: data.menu_timing_start || (null as any),
        menu_timing_end: data.menu_timing_end || (null as any),
        item_photo_url: data.item_photo_url || (null as any),
        requires_acknowledgment: data.requires_acknowledgment || false,
        acknowledgment_type: data.acknowledgment_type || 'BOTH',
        recurring_order_enabled: data.recurring_order_enabled || false,
        max_recurring_orders: data.max_recurring_orders || (null as any),
        status: 'AVAILABLE',
      });

      const savedItem = await this.menuItemRepository.save(item);
      logger.info(`Menu item added: ${savedItem.id} - ${savedItem.name} (Tenant: ${tenant_id})`);

      return savedItem;
    } catch (error: any) {
      logger.error('Error adding menu item:', error);
      throw error;
    }
  }

  /**
   * Update menu item
   */
  async updateMenuItem(
    item_id: string,
    tenant_id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      menu_category_id?: string;
      price?: number;
      status?: 'AVAILABLE' | 'OUT_OF_STOCK';
      menu_timing_start?: string;
      menu_timing_end?: string;
      item_photo_url?: string;
      requires_acknowledgment?: boolean;
      acknowledgment_type?: 'CHECK_IN' | 'DIGITAL_SIGNATURE' | 'BOTH';
      recurring_order_enabled?: boolean;
      max_recurring_orders?: number;
    }
  ): Promise<MenuItem> {
    try {
      const item = await this.menuItemRepository.findOne({
        where: { id: item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Menu item not found');
      }

      if (data.name !== undefined) {
        if (data.name.length < 1 || data.name.length > 100) {
          throw new Error('Item name must be between 1 and 100 characters');
        }
        item.name = data.name.trim();
      }

      if (data.description !== undefined) {
        if (data.description.length > 200) {
          throw new Error('Description must be less than 200 characters');
        }
        item.description = data.description.trim() || (null as any);
      }

      if (data.category !== undefined) item.category = data.category;
      if (data.menu_category_id !== undefined) item.menu_category_id = data.menu_category_id || (null as any);
      if (data.price !== undefined) item.price = data.price || (null as any);
      if (data.status !== undefined) item.status = data.status;
      if (data.menu_timing_start !== undefined) item.menu_timing_start = data.menu_timing_start || (null as any);
      if (data.menu_timing_end !== undefined) item.menu_timing_end = data.menu_timing_end || (null as any);
      if (data.item_photo_url !== undefined) item.item_photo_url = data.item_photo_url || (null as any);
      if (data.requires_acknowledgment !== undefined) item.requires_acknowledgment = data.requires_acknowledgment;
      if (data.acknowledgment_type !== undefined) item.acknowledgment_type = data.acknowledgment_type;
      if (data.recurring_order_enabled !== undefined) item.recurring_order_enabled = data.recurring_order_enabled;
      if (data.max_recurring_orders !== undefined) item.max_recurring_orders = data.max_recurring_orders || (null as any);

      const updatedItem = await this.menuItemRepository.save(item);
      logger.info(`Menu item updated: ${updatedItem.id} - ${updatedItem.name} (Tenant: ${tenant_id})`);

      return updatedItem;
    } catch (error: any) {
      logger.error('Error updating menu item:', error);
      throw error;
    }
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(item_id: string, tenant_id: string): Promise<void> {
    try {
      const item = await this.menuItemRepository.findOne({
        where: { id: item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Menu item not found');
      }

      await this.menuItemRepository.remove(item);
      logger.info(`Menu item deleted: ${item_id} (Tenant: ${tenant_id})`);
    } catch (error: any) {
      logger.error('Error deleting menu item:', error);
      throw error;
    }
  }

  /**
   * Get menu items (filtered by user grade/menu category)
   */
  async getMenuItems(
    tenant_id: string,
    options?: {
      category?: string;
      menu_category_id?: string;
      status?: string;
      employee_grade?: string; // Filter by user grade
      search?: string;
    }
  ): Promise<MenuItem[]> {
    try {
      const queryBuilder = this.menuItemRepository
        .createQueryBuilder('item')
        .where('item.tenant_id = :tenant_id', { tenant_id })
        .andWhere('item.status = :status', { status: 'AVAILABLE' });

      if (options?.category) {
        queryBuilder.andWhere('item.category = :category', { category: options.category });
      }

      if (options?.menu_category_id) {
        queryBuilder.andWhere('item.menu_category_id = :menu_category_id', { menu_category_id: options.menu_category_id });
      }

      if (options?.status) {
        queryBuilder.andWhere('item.status = :status', { status: options.status });
      }

      if (options?.search) {
        queryBuilder.andWhere(
          '(item.name ILIKE :search OR item.description ILIKE :search)',
          { search: `%${options.search}%` }
        );
      }

      // Filter by employee grade if provided (menu category assignment)
      if (options?.employee_grade) {
        queryBuilder
          .leftJoin('item.menuCategory', 'menuCategory')
          .andWhere('(menuCategory.user_category = :grade OR menuCategory.user_category IS NULL)', {
            grade: options.employee_grade,
          });
      }

      return await queryBuilder.orderBy('item.name', 'ASC').getMany();
    } catch (error: any) {
      logger.error('Error fetching menu items:', error);
      throw error;
    }
  }

  /**
   * Get menu item by ID
   */
  async getMenuItemById(item_id: string, tenant_id: string): Promise<MenuItem | null> {
    try {
      return await this.menuItemRepository.findOne({
        where: { id: item_id, tenant_id },
        relations: ['menuCategory'],
      });
    } catch (error: any) {
      logger.error('Error fetching menu item:', error);
      throw error;
    }
  }

  /**
   * Create menu category (Prestige, Silver, Platinum, etc.)
   */
  async createMenuCategory(
    tenant_id: string,
    data: {
      name: string;
      code?: string;
      description?: string;
      user_category?: string; // EMPLOYEE, DIRECTOR, HOST, etc.
    }
  ): Promise<MenuCategory> {
    try {
      const category = this.menuCategoryRepository.create({
        tenant_id,
        name: data.name.trim(),
        code: data.code?.trim() || (null as any),
        description: data.description?.trim() || (null as any),
        user_category: data.user_category || (null as any),
      });

      const savedCategory = await this.menuCategoryRepository.save(category);
      logger.info(`Menu category created: ${savedCategory.id} - ${savedCategory.name} (Tenant: ${tenant_id})`);

      return savedCategory;
    } catch (error: any) {
      logger.error('Error creating menu category:', error);
      throw error;
    }
  }

  /**
   * Get menu categories
   */
  async getMenuCategories(tenant_id: string): Promise<MenuCategory[]> {
    try {
      return await this.menuCategoryRepository.find({
        where: { tenant_id, is_active: true },
        order: { name: 'ASC' },
      });
    } catch (error: any) {
      logger.error('Error fetching menu categories:', error);
      throw error;
    }
  }

  // ============================================
  // 3.3.2 FOOD ORDERING FORM (Employee)
  // ============================================

  /**
   * Place food order
   */
  async placeOrder(
    tenant_id: string,
    user_id: string,
    data: {
      menu_item_id: string;
      quantity: number;
      order_time?: string; // Time format: "HH:MM"
      comments?: string;
      room_name?: string;
      table_name?: string;
      cabin_name?: string;
      qr_code_link?: string;
      is_recurring?: boolean;
      recurring_pattern?: any; // JSON pattern
    }
  ): Promise<FoodOrder> {
    try {
      // Validate quantity
      if (data.quantity <= 0) {
        throw new Error('Quantity must be a positive integer');
      }

      // Validate comments length
      if (data.comments && data.comments.length > 200) {
        throw new Error('Comments must be less than 200 characters');
      }

      // Get menu item
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: data.menu_item_id, tenant_id },
      });

      if (!menuItem) {
        throw new Error('Menu item not found');
      }

      if (menuItem.status !== 'AVAILABLE') {
        throw new Error('Menu item is not available');
      }

      // Validate order time is within menu timing
      if (data.order_time && menuItem.menu_timing_start && menuItem.menu_timing_end) {
        const orderTime = data.order_time;
        if (orderTime < menuItem.menu_timing_start || orderTime > menuItem.menu_timing_end) {
          throw new Error(`Order time must be within menu timing: ${menuItem.menu_timing_start} - ${menuItem.menu_timing_end}`);
        }
      }

      // Get user details
      const user = await this.userRepository.findOne({
        where: { id: user_id, tenant_id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check recurring order limits
      if (data.is_recurring && menuItem.recurring_order_enabled) {
        const existingRecurringOrders = await this.foodOrderRepository.count({
          where: {
            tenant_id,
            user_id,
            menu_item_id: data.menu_item_id,
            is_recurring: true,
          },
        });

        if (menuItem.max_recurring_orders && existingRecurringOrders >= menuItem.max_recurring_orders) {
          throw new Error(`Maximum recurring orders (${menuItem.max_recurring_orders}) reached for this item`);
        }
      }

      // Get organization charge from system config
      const orgChargeConfig = await this.systemConfigRepository.findOne({
        where: { tenant_id, config_key: 'FRESH_SERVE_ORG_CHARGE' },
      });

      const organizationCharge = orgChargeConfig
        ? parseFloat(orgChargeConfig.config_value || '0')
        : 0;

      // Calculate total amount
      const totalAmount = (menuItem.price || 0) * data.quantity + organizationCharge;

      // Create order
      const order = this.foodOrderRepository.create({
        tenant_id,
        user_id,
        menu_item_id: data.menu_item_id,
        quantity: data.quantity,
        total_amount: totalAmount,
        status: 'PENDING',
        comments: data.comments?.trim() || (null as any),
        order_time: data.order_time || (null as any),
        room_name: data.room_name || (null as any),
        table_name: data.table_name || (null as any),
        cabin_name: data.cabin_name || (null as any),
        qr_code_link: data.qr_code_link || (null as any),
        is_recurring: data.is_recurring || false,
        recurring_pattern: data.recurring_pattern ? JSON.stringify(data.recurring_pattern) : (null as any),
        requisitioner_name: `${user.first_name} ${user.last_name}`,
        requisitioner_employee_id: user.employee_id || (null as any),
        employee_grade: user.employee_grade || (null as any),
        organization_charge: organizationCharge,
      });

      const savedOrder = await this.foodOrderRepository.save(order);

      logger.info(`Food order placed: ${savedOrder.id} by user ${user_id} (Tenant: ${tenant_id})`);

      // Notify cafeteria
      await this.notifyCafeteriaOrder(savedOrder, menuItem);

      // Start acknowledgment timer if required
      if (menuItem.requires_acknowledgment) {
        await this.startAcknowledgmentTimer(savedOrder.id, tenant_id);
      }

      return savedOrder;
    } catch (error: any) {
      logger.error('Error placing food order:', error);
      throw error;
    }
  }

  /**
   * Cancel food order (within cancellation window)
   */
  async cancelOrder(
    order_id: string,
    tenant_id: string,
    user_id: string
  ): Promise<FoodOrder> {
    try {
      const order = await this.foodOrderRepository.findOne({
        where: { id: order_id, tenant_id, user_id },
        relations: ['menuItem'],
      });

      if (!order) {
        throw new Error('Order not found or you do not have permission to cancel it');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Only pending orders can be cancelled');
      }

      // Check cancellation window
      const cancelWindowConfig = await this.systemConfigRepository.findOne({
        where: { tenant_id, config_key: 'FRESH_SERVE_CANCEL_WINDOW_SECONDS' },
      });

      const cancelWindowSeconds = cancelWindowConfig
        ? parseInt(cancelWindowConfig.config_value || '0', 10)
        : 0;

      if (cancelWindowSeconds > 0) {
        const orderAge = (Date.now() - order.created_at.getTime()) / 1000;
        if (orderAge > cancelWindowSeconds) {
          throw new Error(`Cancellation window (${cancelWindowSeconds} seconds) has expired`);
        }
      }

      order.status = 'CANCELED';
      const updatedOrder = await this.foodOrderRepository.save(order);

      logger.info(`Food order canceled: ${order_id} by user ${user_id}`);

      // Notify cafeteria
      await this.notifyCafeteriaCancel(updatedOrder);

      return updatedOrder;
    } catch (error: any) {
      logger.error('Error canceling food order:', error);
      throw error;
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(
    tenant_id: string,
    user_id: string,
    options?: {
      status?: string;
      date_from?: Date;
      date_to?: Date;
    }
  ): Promise<FoodOrder[]> {
    try {
      const queryBuilder = this.foodOrderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.menuItem', 'menuItem')
        .where('order.tenant_id = :tenant_id', { tenant_id })
        .andWhere('order.user_id = :user_id', { user_id });

      if (options?.status) {
        queryBuilder.andWhere('order.status = :status', { status: options.status });
      }

      if (options?.date_from) {
        queryBuilder.andWhere('order.created_at >= :date_from', { date_from: options.date_from });
      }

      if (options?.date_to) {
        queryBuilder.andWhere('order.created_at <= :date_to', { date_to: options.date_to });
      }

      return await queryBuilder.orderBy('order.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching user orders:', error);
      throw error;
    }
  }

  // ============================================
  // 3.3.3 FOOD ORDER MANAGEMENT (Cafeteria/Admin)
  // ============================================

  /**
   * Get orders with filters
   */
  async getOrders(
    tenant_id: string,
    options?: {
      date?: Date;
      employee_id?: string;
      status?: string;
      date_from?: Date;
      date_to?: Date;
    }
  ): Promise<FoodOrder[]> {
    try {
      const queryBuilder = this.foodOrderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.menuItem', 'menuItem')
        .leftJoinAndSelect('order.user', 'user')
        .where('order.tenant_id = :tenant_id', { tenant_id });

      if (options?.employee_id) {
        queryBuilder.andWhere('order.user_id = :employee_id', { employee_id: options.employee_id });
      }

      if (options?.status) {
        queryBuilder.andWhere('order.status = :status', { status: options.status });
      }

      if (options?.date) {
        const startOfDay = new Date(options.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(options.date);
        endOfDay.setHours(23, 59, 59, 999);
        queryBuilder.andWhere('order.created_at >= :startOfDay', { startOfDay });
        queryBuilder.andWhere('order.created_at <= :endOfDay', { endOfDay });
      }

      if (options?.date_from) {
        queryBuilder.andWhere('order.created_at >= :date_from', { date_from: options.date_from });
      }

      if (options?.date_to) {
        queryBuilder.andWhere('order.created_at <= :date_to', { date_to: options.date_to });
      }

      return await queryBuilder.orderBy('order.created_at', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    order_id: string,
    tenant_id: string,
    admin_id: string,
    status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELED',
    admin_notes?: string
  ): Promise<FoodOrder> {
    try {
      const order = await this.foodOrderRepository.findOne({
        where: { id: order_id, tenant_id },
        relations: ['menuItem', 'user'],
      });

      if (!order) {
        throw new Error('Order not found');
      }

      order.status = status;
      order.admin_id = admin_id;
      if (admin_notes) {
        order.admin_notes = admin_notes.trim();
      }

      const updatedOrder = await this.foodOrderRepository.save(order);

      logger.info(`Order status updated: ${order_id} to ${status} by admin ${admin_id}`);

      // Notify employee
      if (order.user) {
        await emailService.sendNotificationEmail({
          name: `${order.user.first_name} ${order.user.last_name}`,
          email: order.user.email,
          title: 'Food Order Status Updated',
          message: `Your food order for ${order.menuItem?.name} (${order.quantity} qty) status has been updated to ${status}.${admin_notes ? ` Notes: ${admin_notes}` : ''}`,
        });
      }

      return updatedOrder;
    } catch (error: any) {
      logger.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Place order on behalf of employee (Admin)
   */
  async placeOrderForEmployee(
    tenant_id: string,
    admin_id: string,
    employee_id: string,
    data: {
      menu_item_id: string;
      quantity: number;
      order_time?: string;
      comments?: string;
      room_name?: string;
      table_name?: string;
      cabin_name?: string;
    }
  ): Promise<FoodOrder> {
    try {
      // Similar to placeOrder but with admin_id
      const menuItem = await this.menuItemRepository.findOne({
        where: { id: data.menu_item_id, tenant_id },
      });

      if (!menuItem) {
        throw new Error('Menu item not found');
      }

      const employee = await this.userRepository.findOne({
        where: { id: employee_id, tenant_id },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const orgChargeConfig = await this.systemConfigRepository.findOne({
        where: { tenant_id, config_key: 'FRESH_SERVE_ORG_CHARGE' },
      });

      const organizationCharge = orgChargeConfig
        ? parseFloat(orgChargeConfig.config_value || '0')
        : 0;

      const totalAmount = (menuItem.price || 0) * data.quantity + organizationCharge;

      const order = this.foodOrderRepository.create({
        tenant_id,
        user_id: employee_id,
        admin_id,
        menu_item_id: data.menu_item_id,
        quantity: data.quantity,
        total_amount: totalAmount,
        status: 'PENDING',
        comments: data.comments?.trim() || (null as any),
        order_time: data.order_time || (null as any),
        room_name: data.room_name || (null as any),
        table_name: data.table_name || (null as any),
        cabin_name: data.cabin_name || (null as any),
        requisitioner_name: `${employee.first_name} ${employee.last_name}`,
        requisitioner_employee_id: employee.employee_id || (null as any),
        employee_grade: employee.employee_grade || (null as any),
        organization_charge: organizationCharge,
      });

      const savedOrder = await this.foodOrderRepository.save(order);

      logger.info(`Food order placed for employee by admin: ${savedOrder.id} (Admin: ${admin_id}, Employee: ${employee_id})`);

      await this.notifyCafeteriaOrder(savedOrder, menuItem);

      return savedOrder;
    } catch (error: any) {
      logger.error('Error placing order for employee:', error);
      throw error;
    }
  }

  // ============================================
  // ACKNOWLEDGMENT
  // ============================================

  /**
   * Acknowledge order
   */
  async acknowledgeOrder(
    order_id: string,
    tenant_id: string,
    user_id: string,
    data: {
      check_in_popup?: boolean;
      digital_signature?: string; // Base64 encoded
    }
  ): Promise<FoodOrderAcknowledgment> {
    try {
      const order = await this.foodOrderRepository.findOne({
        where: { id: order_id, tenant_id, user_id },
        relations: ['menuItem'],
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const menuItem = order.menuItem;
      if (!menuItem || !menuItem.requires_acknowledgment) {
        throw new Error('This order does not require acknowledgment');
      }

      // Check if already acknowledged
      const existingAck = await this.acknowledgmentRepository.findOne({
        where: { order_id },
      });

      if (existingAck) {
        throw new Error('Order has already been acknowledged');
      }

      // Validate acknowledgment type
      if (menuItem.acknowledgment_type === 'CHECK_IN' && !data.check_in_popup) {
        throw new Error('Check-in popup acknowledgment is required');
      }

      if (menuItem.acknowledgment_type === 'DIGITAL_SIGNATURE' && !data.digital_signature) {
        throw new Error('Digital signature is required');
      }

      if (menuItem.acknowledgment_type === 'BOTH' && (!data.check_in_popup || !data.digital_signature)) {
        throw new Error('Both check-in popup and digital signature are required');
      }

      const acknowledgment = this.acknowledgmentRepository.create({
        order_id,
        acknowledged_by: user_id,
        check_in_popup: data.check_in_popup || false,
        digital_signature: data.digital_signature || (null as any),
        acknowledged_at: new Date(),
      });

      const savedAck = await this.acknowledgmentRepository.save(acknowledgment);

      // Update order
      order.is_acknowledged = true;
      order.acknowledged_at = new Date();
      await this.foodOrderRepository.save(order);

      logger.info(`Order acknowledged: ${order_id} by user ${user_id}`);

      return savedAck;
    } catch (error: any) {
      logger.error('Error acknowledging order:', error);
      throw error;
    }
  }

  // ============================================
  // SYSTEM CONFIG (Super Admin)
  // ============================================

  /**
   * Get system config value
   */
  async getSystemConfig(tenant_id: string, config_key: string): Promise<string | null> {
    try {
      const config = await this.systemConfigRepository.findOne({
        where: { tenant_id, config_key },
      });

      return config?.config_value || null;
    } catch (error: any) {
      logger.error('Error fetching system config:', error);
      return null;
    }
  }

  /**
   * Set system config value
   */
  async setSystemConfig(
    tenant_id: string,
    config_key: string,
    config_value: string,
    config_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' = 'STRING',
    description?: string
  ): Promise<SystemConfig> {
    try {
      let config = await this.systemConfigRepository.findOne({
        where: { tenant_id, config_key },
      });

      if (config) {
        config.config_value = config_value;
        config.config_type = config_type;
        if (description) config.description = description;
      } else {
        config = this.systemConfigRepository.create({
          tenant_id,
          config_key,
          config_value,
          config_type,
          description: description || (null as any),
        });
      }

      const savedConfig = await this.systemConfigRepository.save(config);
      logger.info(`System config updated: ${config_key} = ${config_value} (Tenant: ${tenant_id})`);

      return savedConfig;
    } catch (error: any) {
      logger.error('Error setting system config:', error);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Notify cafeteria of new order
   */
  private async notifyCafeteriaOrder(order: FoodOrder, menuItem: MenuItem): Promise<void> {
    try {
      // Get admins with FRESH_SERVE scope
      const admins = await this.getFreshServeAdmins(order.tenant_id!);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'New Food Order',
          message: `A new food order has been placed. Order ID: ${order.id}, Item: ${menuItem.name}, Quantity: ${order.quantity}.${order.room_name ? ` Location: ${order.room_name}` : ''}`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying cafeteria:', error);
    }
  }

  /**
   * Notify cafeteria of order cancellation
   */
  private async notifyCafeteriaCancel(order: FoodOrder): Promise<void> {
    try {
      const admins = await this.getFreshServeAdmins(order.tenant_id!);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Food Order Cancelled',
          message: `Food order ID: ${order.id} has been cancelled.`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying cafeteria of cancellation:', error);
    }
  }

  /**
   * Get admins with FRESH_SERVE scope
   */
  private async getFreshServeAdmins(tenant_id: string): Promise<Admin[]> {
    try {
      const allAdmins = await this.adminRepository.find({
        where: { tenant_id, is_active: true },
      });

      return allAdmins.filter(
        (admin) =>
          admin.is_super_admin ||
          admin.module_scope === 'FRESH_SERVE' ||
          admin.module_scope === 'ALL'
      );
    } catch (error: any) {
      logger.error('Error fetching FRESH_SERVE admins:', error);
      return [];
    }
  }

  /**
   * Start acknowledgment timer
   */
  private async startAcknowledgmentTimer(order_id: string, tenant_id: string): Promise<void> {
    try {
      // Get acknowledgment timeout from config
      const timeoutConfig = await this.getSystemConfig(tenant_id, 'FRESH_SERVE_ACK_TIMEOUT_MINUTES');
      const timeoutMinutes = timeoutConfig ? parseInt(timeoutConfig, 10) : 5; // Default 5 minutes

      // Schedule check (in a real implementation, you'd use a job queue like Bull)
      setTimeout(async () => {
        const order = await this.foodOrderRepository.findOne({
          where: { id: order_id },
        });

        if (order && !order.is_acknowledged) {
          // Notify admin of delay
          await this.notifyAcknowledgmentDelay(order);
        }
      }, timeoutMinutes * 60 * 1000);
    } catch (error: any) {
      logger.error('Error starting acknowledgment timer:', error);
    }
  }

  /**
   * Notify admin of acknowledgment delay
   */
  private async notifyAcknowledgmentDelay(order: FoodOrder): Promise<void> {
    try {
      const admins = await this.getFreshServeAdmins(order.tenant_id!);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Order Acknowledgment Delay Alert',
          message: `Order ID: ${order.id} has not been acknowledged within the required time. Please follow up.`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying acknowledgment delay:', error);
    }
  }

  // ============================================
  // 3.3.5 INVENTORY MANAGEMENT (Admin)
  // ============================================

  /**
   * Add inventory item
   */
  async addInventoryItem(
    tenant_id: string,
    data: {
      item_name: string;
      category: string; // Raw Material, Packaged, Beverage, etc.
      quantity: number;
      unit: string; // g, kg, litre, piece, etc.
      threshold_limit?: number;
      vendor_name?: string;
      purchase_date?: Date;
      expiry_date?: Date;
    }
  ): Promise<InventoryItem> {
    try {
      // Validate item name length
      if (data.item_name.length < 1 || data.item_name.length > 100) {
        throw new Error('Item name must be between 1 and 100 characters');
      }

      // Validate quantity
      if (data.quantity < 0) {
        throw new Error('Quantity must be a positive number');
      }

      // Validate threshold limit
      if (data.threshold_limit !== undefined && data.threshold_limit < 0) {
        throw new Error('Threshold limit must be a positive number');
      }

      // Validate expiry date is future if provided
      if (data.expiry_date && data.expiry_date < new Date()) {
        throw new Error('Expiry date must be a future date');
      }

      const item = this.inventoryRepository.create({
        tenant_id,
        item_name: data.item_name.trim(),
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        threshold_limit: data.threshold_limit || (null as any),
        vendor_name: data.vendor_name?.trim() || (null as any),
        purchase_date: data.purchase_date || (null as any),
        expiry_date: data.expiry_date || (null as any),
        status: data.quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      });

      const savedItem = await this.inventoryRepository.save(item);
      logger.info(`Inventory item added: ${savedItem.id} - ${savedItem.item_name} (Tenant: ${tenant_id})`);

      // Check for low stock alert
      await this.checkLowStockAlert(savedItem);

      return savedItem;
    } catch (error: any) {
      logger.error('Error adding inventory item:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(
    item_id: string,
    tenant_id: string,
    data: {
      item_name?: string;
      category?: string;
      quantity?: number;
      unit?: string;
      threshold_limit?: number;
      vendor_name?: string;
      purchase_date?: Date;
      expiry_date?: Date;
      status?: 'IN_STOCK' | 'OUT_OF_STOCK';
    }
  ): Promise<InventoryItem> {
    try {
      const item = await this.inventoryRepository.findOne({
        where: { id: item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      if (data.item_name !== undefined) {
        if (data.item_name.length < 1 || data.item_name.length > 100) {
          throw new Error('Item name must be between 1 and 100 characters');
        }
        item.item_name = data.item_name.trim();
      }

      if (data.category !== undefined) item.category = data.category;
      if (data.unit !== undefined) item.unit = data.unit;
      if (data.threshold_limit !== undefined) {
        if (data.threshold_limit < 0) {
          throw new Error('Threshold limit must be a positive number');
        }
        item.threshold_limit = data.threshold_limit || (null as any);
      }
      if (data.vendor_name !== undefined) item.vendor_name = data.vendor_name?.trim() || (null as any);
      if (data.purchase_date !== undefined) item.purchase_date = data.purchase_date || (null as any);
      if (data.expiry_date !== undefined) {
        if (data.expiry_date && data.expiry_date < new Date()) {
          throw new Error('Expiry date must be a future date');
        }
        item.expiry_date = data.expiry_date || (null as any);
      }

      if (data.quantity !== undefined) {
        if (data.quantity < 0) {
          throw new Error('Quantity must be a positive number');
        }
        item.quantity = data.quantity;
        // Update status based on quantity
        item.status = data.quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
      }

      if (data.status !== undefined) item.status = data.status;

      const updatedItem = await this.inventoryRepository.save(item);
      logger.info(`Inventory item updated: ${updatedItem.id} - ${updatedItem.item_name} (Tenant: ${tenant_id})`);

      // Check for low stock alert
      await this.checkLowStockAlert(updatedItem);

      return updatedItem;
    } catch (error: any) {
      logger.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(item_id: string, tenant_id: string): Promise<void> {
    try {
      const item = await this.inventoryRepository.findOne({
        where: { id: item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      // Check if item is linked to any active menu items (optional check)
      // For now, we'll allow deletion

      await this.inventoryRepository.remove(item);
      logger.info(`Inventory item deleted: ${item_id} (Tenant: ${tenant_id})`);
    } catch (error: any) {
      logger.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  /**
   * Get inventory items with filters
   */
  async getInventoryItems(
    tenant_id: string,
    options?: {
      category?: string;
      status?: string;
      vendor_name?: string;
      expiry_date_from?: Date;
      expiry_date_to?: Date;
      search?: string;
      sort_by?: 'quantity' | 'expiry_date' | 'item_name';
      sort_order?: 'ASC' | 'DESC';
    }
  ): Promise<InventoryItem[]> {
    try {
      const queryBuilder = this.inventoryRepository
        .createQueryBuilder('item')
        .where('item.tenant_id = :tenant_id', { tenant_id });

      if (options?.category) {
        queryBuilder.andWhere('item.category = :category', { category: options.category });
      }

      if (options?.status) {
        queryBuilder.andWhere('item.status = :status', { status: options.status });
      }

      if (options?.vendor_name) {
        queryBuilder.andWhere('item.vendor_name ILIKE :vendor_name', { vendor_name: `%${options.vendor_name}%` });
      }

      if (options?.expiry_date_from) {
        queryBuilder.andWhere('item.expiry_date >= :expiry_date_from', { expiry_date_from: options.expiry_date_from });
      }

      if (options?.expiry_date_to) {
        queryBuilder.andWhere('item.expiry_date <= :expiry_date_to', { expiry_date_to: options.expiry_date_to });
      }

      if (options?.search) {
        queryBuilder.andWhere(
          '(item.item_name ILIKE :search OR item.category ILIKE :search)',
          { search: `%${options.search}%` }
        );
      }

      // Sort
      const sortBy = options?.sort_by || 'item_name';
      const sortOrder = options?.sort_order || 'ASC';
      queryBuilder.orderBy(`item.${sortBy}`, sortOrder);

      return await queryBuilder.getMany();
    } catch (error: any) {
      logger.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(item_id: string, tenant_id: string): Promise<InventoryItem | null> {
    try {
      return await this.inventoryRepository.findOne({
        where: { id: item_id, tenant_id },
      });
    } catch (error: any) {
      logger.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  /**
   * Adjust stock (manual entry for wastage, spoilage, etc.)
   */
  async adjustStock(
    item_id: string,
    tenant_id: string,
    admin_id: string,
    data: {
      adjustment: number; // Positive to increase, negative to decrease
      reason: string; // e.g., "wastage", "spoilage", "found", "purchase"
      requisitioner_name?: string;
      requisitioner_employee_id?: string;
    }
  ): Promise<InventoryItem> {
    try {
      const item = await this.inventoryRepository.findOne({
        where: { id: item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      const newQuantity = item.quantity + data.adjustment;

      if (newQuantity < 0) {
        throw new Error('Stock adjustment would result in negative quantity');
      }

      item.quantity = newQuantity;
      item.status = newQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';

      const updatedItem = await this.inventoryRepository.save(item);

      // Log reconciliation entry if adjustment is negative (wastage)
      if (data.adjustment < 0) {
        await this.reconciliationRepository.save({
          tenant_id,
          reconciliation_type: 'INVENTORY',
          item_id: item_id,
          item_name: item.item_name,
          quantity_used: Math.abs(data.adjustment),
          quantity_wastage: Math.abs(data.adjustment),
          requisitioner_name: data.requisitioner_name || (null as any),
          requisitioner_employee_id: data.requisitioner_employee_id || (null as any),
          reconciled_by: admin_id,
          reconciliation_date: new Date(),
          notes: `Stock adjustment: ${data.adjustment > 0 ? '+' : ''}${data.adjustment}. Reason: ${data.reason}`,
        });
      }

      logger.info(`Stock adjusted for item ${item_id}: ${data.adjustment > 0 ? '+' : ''}${data.adjustment} (Reason: ${data.reason})`);

      // Check for low stock alert
      await this.checkLowStockAlert(updatedItem);

      return updatedItem;
    } catch (error: any) {
      logger.error('Error adjusting stock:', error);
      throw error;
    }
  }

  /**
   * Allocate inventory items to employee/director
   */
  async allocateInventoryToEmployee(
    tenant_id: string,
    admin_id: string,
    employee_id: string,
    data: {
      item_id: string;
      quantity: number;
      purpose: string;
      requires_acknowledgment?: boolean;
    }
  ): Promise<Reconciliation> {
    try {
      const item = await this.inventoryRepository.findOne({
        where: { id: data.item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      if (item.quantity < data.quantity) {
        throw new Error(`Insufficient stock. Available: ${item.quantity}, Requested: ${data.quantity}`);
      }

      const employee = await this.userRepository.findOne({
        where: { id: employee_id, tenant_id },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Deduct from inventory
      item.quantity -= data.quantity;
      item.status = item.quantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
      await this.inventoryRepository.save(item);

      // Create reconciliation entry
      const reconciliation = this.reconciliationRepository.create({
        tenant_id,
        reconciliation_type: 'INVENTORY',
        item_id: data.item_id,
        item_name: item.item_name,
        quantity_used: data.quantity,
        quantity_wastage: (null as any),
        requisitioner_name: `${employee.first_name} ${employee.last_name}`,
        requisitioner_employee_id: employee.employee_id || (null as any),
        reconciled_by: admin_id,
        reconciliation_date: new Date(),
        notes: `Allocated to employee. Purpose: ${data.purpose}. Requires acknowledgment: ${data.requires_acknowledgment || false}`,
      });

      const savedReconciliation = await this.reconciliationRepository.save(reconciliation);

      logger.info(`Inventory allocated to employee: ${data.item_id} (${data.quantity} ${item.unit}) to ${employee_id} (Admin: ${admin_id})`);

      // Check for low stock alert
      await this.checkLowStockAlert(item);

      return savedReconciliation;
    } catch (error: any) {
      logger.error('Error allocating inventory to employee:', error);
      throw error;
    }
  }

  /**
   * Check and send low stock alert
   */
  private async checkLowStockAlert(item: InventoryItem): Promise<void> {
    try {
      if (item.threshold_limit && item.quantity <= item.threshold_limit && item.quantity > 0) {
        // Low stock alert
        await this.sendLowStockAlert(item);
      } else if (item.quantity === 0) {
        // Out of stock alert
        await this.sendOutOfStockAlert(item);
      }
    } catch (error: any) {
      logger.error('Error checking low stock alert:', error);
      // Don't throw - alerts are non-critical
    }
  }

  /**
   * Send low stock alert
   */
  private async sendLowStockAlert(item: InventoryItem): Promise<void> {
    try {
      const admins = await this.getFreshServeAdmins(item.tenant_id);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Low Stock Alert - Inventory',
          message: `Inventory item "${item.item_name}" is running low. Current stock: ${item.quantity} ${item.unit}, Threshold: ${item.threshold_limit} ${item.unit}.`,
        });
      }

      logger.info(`Low stock alert sent for inventory item: ${item.item_name} (Tenant: ${item.tenant_id})`);
    } catch (error: any) {
      logger.error('Error sending low stock alert:', error);
    }
  }

  /**
   * Send out of stock alert
   */
  private async sendOutOfStockAlert(item: InventoryItem): Promise<void> {
    try {
      const admins = await this.getFreshServeAdmins(item.tenant_id);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Out of Stock Alert - Inventory',
          message: `Inventory item "${item.item_name}" is out of stock. Please reorder immediately.`,
        });
      }

      logger.info(`Out of stock alert sent for inventory item: ${item.item_name} (Tenant: ${item.tenant_id})`);
    } catch (error: any) {
      logger.error('Error sending out of stock alert:', error);
    }
  }

  // ============================================
  // REPORTS & DASHBOARD
  // ============================================

  /**
   * Get daily usage report
   */
  async getDailyUsageReport(
    tenant_id: string,
    date: Date
  ): Promise<{
    date: Date;
    items: Array<{
      item_id: string;
      item_name: string;
      quantity_used: number;
      quantity_remaining: number;
      unit: string;
    }>;
  }> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const reconciliations = await this.reconciliationRepository.find({
        where: {
          tenant_id,
          reconciliation_date: date,
        },
      });

      // Get current inventory levels
      const inventoryItems = await this.inventoryRepository.find({
        where: { tenant_id },
      });

      const items = inventoryItems.map((item) => {
        const usedToday = reconciliations
          .filter((rec) => rec.item_id === item.id)
          .reduce((sum, rec) => sum + parseFloat(rec.quantity_used.toString()), 0);

        return {
          item_id: item.id,
          item_name: item.item_name,
          quantity_used: usedToday,
          quantity_remaining: parseFloat(item.quantity.toString()),
          unit: item.unit,
        };
      });

      return {
        date,
        items,
      };
    } catch (error: any) {
      logger.error('Error generating daily usage report:', error);
      throw error;
    }
  }

  /**
   * Get low stock report
   */
  async getLowStockReport(tenant_id: string): Promise<InventoryItem[]> {
    try {
      return await this.inventoryRepository
        .createQueryBuilder('item')
        .where('item.tenant_id = :tenant_id', { tenant_id })
        .andWhere('item.threshold_limit IS NOT NULL')
        .andWhere('item.quantity <= item.threshold_limit')
        .andWhere('item.quantity > 0')
        .orderBy('item.quantity', 'ASC')
        .getMany();
    } catch (error: any) {
      logger.error('Error generating low stock report:', error);
      throw error;
    }
  }

  /**
   * Get expiry report (items expiring in next 7 days)
   */
  async getExpiryReport(tenant_id: string): Promise<InventoryItem[]> {
    try {
      const today = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(today.getDate() + 7);

      return await this.inventoryRepository
        .createQueryBuilder('item')
        .where('item.tenant_id = :tenant_id', { tenant_id })
        .andWhere('item.expiry_date IS NOT NULL')
        .andWhere('item.expiry_date >= :today', { today })
        .andWhere('item.expiry_date <= :sevenDaysLater', { sevenDaysLater })
        .orderBy('item.expiry_date', 'ASC')
        .getMany();
    } catch (error: any) {
      logger.error('Error generating expiry report:', error);
      throw error;
    }
  }

  /**
   * Get wastage report
   */
  async getWastageReport(
    tenant_id: string,
    options?: {
      date_from?: Date;
      date_to?: Date;
      category?: string;
    }
  ): Promise<Reconciliation[]> {
    try {
      const queryBuilder = this.reconciliationRepository
        .createQueryBuilder('rec')
        .where('rec.tenant_id = :tenant_id', { tenant_id })
        .andWhere('rec.quantity_wastage IS NOT NULL')
        .andWhere('rec.quantity_wastage > 0');

      if (options?.date_from) {
        queryBuilder.andWhere('rec.reconciliation_date >= :date_from', { date_from: options.date_from });
      }

      if (options?.date_to) {
        queryBuilder.andWhere('rec.reconciliation_date <= :date_to', { date_to: options.date_to });
      }

      return await queryBuilder.orderBy('rec.reconciliation_date', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error generating wastage report:', error);
      throw error;
    }
  }

  /**
   * Get master report (all reconciliations with filters)
   */
  async getMasterReport(
    tenant_id: string,
    options?: {
      date_from?: Date;
      date_to?: Date;
      reconciliation_type?: string;
      department?: string;
    }
  ): Promise<Reconciliation[]> {
    try {
      const queryBuilder = this.reconciliationRepository
        .createQueryBuilder('rec')
        .leftJoinAndSelect('rec.reconciler', 'reconciler')
        .where('rec.tenant_id = :tenant_id', { tenant_id });

      if (options?.date_from) {
        queryBuilder.andWhere('rec.reconciliation_date >= :date_from', { date_from: options.date_from });
      }

      if (options?.date_to) {
        queryBuilder.andWhere('rec.reconciliation_date <= :date_to', { date_to: options.date_to });
      }

      if (options?.reconciliation_type) {
        queryBuilder.andWhere('rec.reconciliation_type = :type', { type: options.reconciliation_type });
      }

      if (options?.department) {
        queryBuilder.andWhere('reconciler.department = :department', { department: options.department });
      }

      return await queryBuilder.orderBy('rec.reconciliation_date', 'DESC').getMany();
    } catch (error: any) {
      logger.error('Error generating master report:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const freshServeService = new FreshServeService();

