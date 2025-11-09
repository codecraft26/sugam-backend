// Stationery service - comprehensive stationery management
import { AppDataSource } from '../../../config/data-source';
import { StationeryItem } from '../models/stationeryItem.model';
import { StationeryRequest } from '../models/stationeryRequest.model';
import { StationeryLog } from '../models/stationeryLog.model';
import { StationeryAcknowledgment } from '../models/stationeryAcknowledgment.model';
import { User } from '../../../core/users/user.model';
import { Admin } from '../../../core/admin/admin.model';
import { logger } from '../../../config/logger';
import { emailService } from '../../../core/email';

export class StationeryService {
  private itemRepository = AppDataSource.getRepository(StationeryItem);
  private requestRepository = AppDataSource.getRepository(StationeryRequest);
  private logRepository = AppDataSource.getRepository(StationeryLog);
  private acknowledgmentRepository = AppDataSource.getRepository(StationeryAcknowledgment);
  private userRepository = AppDataSource.getRepository(User);
  private adminRepository = AppDataSource.getRepository(Admin);

  // ============================================
  // 3.4.1 STATIONERY INVENTORY MANAGEMENT (Admin)
  // ============================================

  /**
   * Add new stationery item
   */
  async addItem(
    tenant_id: string,
    data: {
      name: string;
      description?: string;
      category: string;
      unit: string;
      quantity_in_stock: number;
      reorder_level: number;
      supplier_name?: string;
      purchase_date?: Date;
      requirement_type?: string;
    }
  ): Promise<StationeryItem> {
    try {
      // Validate name length
      if (data.name.length < 1 || data.name.length > 100) {
        throw new Error('Item name must be between 1 and 100 characters');
      }

      // Validate description length
      if (data.description && data.description.length > 200) {
        throw new Error('Description must be less than 200 characters');
      }

      // Validate quantity
      if (data.quantity_in_stock < 0) {
        throw new Error('Quantity must be a positive integer');
      }

      // Validate reorder level
      if (data.reorder_level < 0) {
        throw new Error('Reorder level must be a positive integer');
      }

      // Determine status based on quantity
      const status = data.quantity_in_stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';

      const item = this.itemRepository.create({
        tenant_id,
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        category: data.category,
        unit: data.unit,
        available_qty: data.quantity_in_stock,
        reorder_level: data.reorder_level,
        supplier_name: data.supplier_name?.trim() || undefined,
        purchase_date: data.purchase_date || undefined,
        requirement_type: data.requirement_type || undefined,
        status,
      });

      const savedItem = await this.itemRepository.save(item);
      logger.info(`Stationery item added: ${savedItem.id} - ${savedItem.name} (Tenant: ${tenant_id})`);

      // Check if low stock alert needed
      await this.checkLowStockAlert(savedItem);

      return savedItem;
    } catch (error: any) {
      logger.error('Error adding stationery item:', error);
      throw error;
    }
  }

  /**
   * Update stationery item
   */
  async updateItem(
    item_id: string,
    tenant_id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
      unit?: string;
      quantity_in_stock?: number;
      reorder_level?: number;
      supplier_name?: string;
      purchase_date?: Date;
      requirement_type?: string;
    }
  ): Promise<StationeryItem> {
    try {
      const item = await this.itemRepository.findOne({
        where: { id: item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Stationery item not found');
      }

      // Validate name length if provided
      if (data.name !== undefined) {
        if (data.name.length < 1 || data.name.length > 100) {
          throw new Error('Item name must be between 1 and 100 characters');
        }
        item.name = data.name.trim();
      }

      // Validate description length if provided
      if (data.description !== undefined) {
        if (data.description.length > 200) {
          throw new Error('Description must be less than 200 characters');
        }
        item.description = data.description.trim() || (null as any);
      }

      if (data.category !== undefined) item.category = data.category;
      if (data.unit !== undefined) item.unit = data.unit;
      if (data.reorder_level !== undefined) {
        if (data.reorder_level < 0) {
          throw new Error('Reorder level must be a positive integer');
        }
        item.reorder_level = data.reorder_level;
      }
      if (data.supplier_name !== undefined) item.supplier_name = data.supplier_name?.trim() || null;
      if (data.purchase_date !== undefined) item.purchase_date = data.purchase_date || null;
      if (data.requirement_type !== undefined) item.requirement_type = data.requirement_type || null;

      // Update quantity if provided
      if (data.quantity_in_stock !== undefined) {
        if (data.quantity_in_stock < 0) {
          throw new Error('Quantity must be a positive integer');
        }
        item.available_qty = data.quantity_in_stock;
        // Update status based on quantity
        item.status = data.quantity_in_stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
      }

      const updatedItem = await this.itemRepository.save(item);
      logger.info(`Stationery item updated: ${updatedItem.id} - ${updatedItem.name} (Tenant: ${tenant_id})`);

      // Check if low stock alert needed
      await this.checkLowStockAlert(updatedItem);

      return updatedItem;
    } catch (error: any) {
      logger.error('Error updating stationery item:', error);
      throw error;
    }
  }

  /**
   * Delete stationery item
   */
  async deleteItem(item_id: string, tenant_id: string): Promise<void> {
    try {
      const item = await this.itemRepository.findOne({
        where: { id: item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Stationery item not found');
      }

      await this.itemRepository.remove(item);
      logger.info(`Stationery item deleted: ${item_id} (Tenant: ${tenant_id})`);
    } catch (error: any) {
      logger.error('Error deleting stationery item:', error);
      throw error;
    }
  }

  /**
   * Get all stationery items for a tenant
   */
  async getItems(
    tenant_id: string,
    options?: {
      category?: string;
      status?: string;
      search?: string;
    }
  ): Promise<StationeryItem[]> {
    try {
      const queryBuilder = this.itemRepository
        .createQueryBuilder('item')
        .where('item.tenant_id = :tenant_id', { tenant_id });

      if (options?.category) {
        queryBuilder.andWhere('item.category = :category', { category: options.category });
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

      return await queryBuilder.orderBy('item.name', 'ASC').getMany();
    } catch (error: any) {
      logger.error('Error fetching stationery items:', error);
      throw error;
    }
  }

  /**
   * Get stationery item by ID
   */
  async getItemById(item_id: string, tenant_id: string): Promise<StationeryItem | null> {
    try {
      return await this.itemRepository.findOne({
        where: { id: item_id, tenant_id },
        relations: ['requests'],
      });
    } catch (error: any) {
      logger.error('Error fetching stationery item:', error);
      throw error;
    }
  }

  /**
   * Adjust stock manually (increase or decrease)
   */
  async adjustStock(
    item_id: string,
    tenant_id: string,
    admin_id: string,
    data: {
      adjustment: number; // Positive to increase, negative to decrease
      reason: string; // e.g., "damaged", "lost", "found", "purchase"
    }
  ): Promise<StationeryItem> {
    try {
      const item = await this.itemRepository.findOne({
        where: { id: item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Stationery item not found');
      }

      const newQuantity = item.available_qty + data.adjustment;

      if (newQuantity < 0) {
        throw new Error('Stock adjustment would result in negative quantity');
      }

      item.available_qty = newQuantity;
      item.status = newQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';

      const updatedItem = await this.itemRepository.save(item);

      // Log the adjustment
      await this.logRepository.save({
        request_id: null as any, // Stock adjustment doesn't have a request
        action_by: admin_id,
        action: 'STOCK_ADJUSTMENT',
        notes: `Stock adjusted by ${data.adjustment > 0 ? '+' : ''}${data.adjustment}. Reason: ${data.reason}`,
      });

      logger.info(`Stock adjusted for item ${item_id}: ${data.adjustment > 0 ? '+' : ''}${data.adjustment} (Reason: ${data.reason})`);

      // Check if low stock alert needed
      await this.checkLowStockAlert(updatedItem);

      return updatedItem;
    } catch (error: any) {
      logger.error('Error adjusting stock:', error);
      throw error;
    }
  }

  // ============================================
  // 3.4.2 STATIONERY REQUEST FORM (Employee)
  // ============================================

  /**
   * Create stationery request
   */
  async createRequest(
    tenant_id: string,
    user_id: string,
    data: {
      item_id: string;
      quantity: number;
      purpose?: string;
      required_by_date?: Date;
    }
  ): Promise<StationeryRequest> {
    try {
      // Validate quantity
      if (data.quantity <= 0) {
        throw new Error('Quantity must be a positive integer');
      }

      // Validate purpose length
      if (data.purpose && data.purpose.length > 200) {
        throw new Error('Purpose must be less than 200 characters');
      }

      // Check if item exists
      const item = await this.itemRepository.findOne({
        where: { id: data.item_id, tenant_id },
      });

      if (!item) {
        throw new Error('Stationery item not found');
      }

      // Get user details
      const user = await this.userRepository.findOne({
        where: { id: user_id, tenant_id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create request
      const request = this.requestRepository.create({
        tenant_id,
        user_id,
        item_id: data.item_id,
        quantity: data.quantity,
        description: data.purpose?.trim() || undefined,
        required_by_date: data.required_by_date || undefined,
        status: 'PENDING',
        department_head_approval_status: 'PENDING',
        building_id: user.building_id || undefined,
        floor_id: user.floor_id || undefined,
      });

      const savedRequest = await this.requestRepository.save(request);

      // Log the request creation
      await this.logRepository.save({
        request_id: savedRequest.id,
        action_by: user_id,
        action: 'REQUEST_CREATED',
        notes: `Request created for ${data.quantity} ${item.unit} of ${item.name}`,
      });

      logger.info(`Stationery request created: ${savedRequest.id} by user ${user_id} (Tenant: ${tenant_id})`);

      // TODO: Notify Department Head (need to identify department head)
      // For now, we'll notify admin/superadmin
      await this.notifyDepartmentHead(savedRequest, user);

      return savedRequest;
    } catch (error: any) {
      logger.error('Error creating stationery request:', error);
      throw error;
    }
  }

  /**
   * Cancel stationery request
   */
  async cancelRequest(
    request_id: string,
    tenant_id: string,
    user_id: string
  ): Promise<StationeryRequest> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id, user_id },
        relations: ['item', 'user'],
      });

      if (!request) {
        throw new Error('Request not found or you do not have permission to cancel it');
      }

      if (request.status !== 'PENDING' && request.department_head_approval_status !== 'PENDING') {
        throw new Error('Only pending requests can be cancelled');
      }

      request.status = 'CANCELED';
      request.department_head_approval_status = 'CANCELED';

      const updatedRequest = await this.requestRepository.save(request);

      // Log the cancellation
      await this.logRepository.save({
        request_id: request_id,
        action_by: user_id,
        action: 'REQUEST_CANCELED',
        notes: 'Request canceled by employee',
      });

      logger.info(`Stationery request canceled: ${request_id} by user ${user_id}`);

      // TODO: Notify Department Head
      if (request.department_head_id) {
        await this.notifyRequestCancellation(updatedRequest);
      }

      return updatedRequest;
    } catch (error: any) {
      logger.error('Error canceling stationery request:', error);
      throw error;
    }
  }

  /**
   * Get user's stationery requests
   */
  async getUserRequests(
    tenant_id: string,
    user_id: string,
    options?: {
      status?: string;
    }
  ): Promise<StationeryRequest[]> {
    try {
      const where: any = {
        tenant_id,
        user_id,
      };

      if (options?.status) {
        where.status = options.status;
      }

      return await this.requestRepository.find({
        where,
        relations: ['item'],
        order: { created_at: 'DESC' },
      });
    } catch (error: any) {
      logger.error('Error fetching user requests:', error);
      throw error;
    }
  }

  // ============================================
  // 3.4.3 REQUEST APPROVAL WORKFLOW (Department Head)
  // ============================================

  /**
   * Approve stationery request (Department Head)
   */
  async approveRequest(
    request_id: string,
    tenant_id: string,
    department_head_id: string,
    comments?: string
  ): Promise<StationeryRequest> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id },
        relations: ['item', 'user'],
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.department_head_approval_status !== 'PENDING') {
        throw new Error(`Request is already ${request.department_head_approval_status}`);
      }

      request.department_head_approval_status = 'APPROVED';
      request.department_head_id = department_head_id;
      request.department_head_comments = comments?.trim() || null;
      request.status = 'APPROVED';

      const updatedRequest = await this.requestRepository.save(request);

      // Log the approval
      await this.logRepository.save({
        request_id: request_id,
        action_by: department_head_id,
        action: 'REQUEST_APPROVED',
        notes: comments || 'Request approved by department head',
      });

      logger.info(`Stationery request approved: ${request_id} by department head ${department_head_id}`);

      // Notify employee
      if (request.user) {
        await emailService.sendNotificationEmail({
          name: `${request.user.first_name} ${request.user.last_name}`,
          email: request.user.email,
          title: 'Stationery Request Approved',
          message: `Your stationery request for ${request.item.name} (${request.quantity} ${request.item.unit}) has been approved by your department head.${comments ? ` Comments: ${comments}` : ''}`,
        });
      }

      // Notify Admin for processing
      await this.notifyAdminForProcessing(updatedRequest);

      return updatedRequest;
    } catch (error: any) {
      logger.error('Error approving stationery request:', error);
      throw error;
    }
  }

  /**
   * Reject stationery request (Department Head)
   */
  async rejectRequest(
    request_id: string,
    tenant_id: string,
    department_head_id: string,
    reason: string
  ): Promise<StationeryRequest> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id },
        relations: ['item', 'user'],
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.department_head_approval_status !== 'PENDING') {
        throw new Error(`Request is already ${request.department_head_approval_status}`);
      }

      request.department_head_approval_status = 'REJECTED';
      request.department_head_id = department_head_id;
      request.department_head_comments = reason.trim();
      request.status = 'REJECTED';

      const updatedRequest = await this.requestRepository.save(request);

      // Log the rejection
      await this.logRepository.save({
        request_id: request_id,
        action_by: department_head_id,
        action: 'REQUEST_REJECTED',
        notes: `Request rejected. Reason: ${reason}`,
      });

      logger.info(`Stationery request rejected: ${request_id} by department head ${department_head_id}`);

      // Notify employee
      if (request.user) {
        await emailService.sendNotificationEmail({
          name: `${request.user.first_name} ${request.user.last_name}`,
          email: request.user.email,
          title: 'Stationery Request Rejected',
          message: `Your stationery request for ${request.item.name} (${request.quantity} ${request.item.unit}) has been rejected. Reason: ${reason}`,
        });
      }

      return updatedRequest;
    } catch (error: any) {
      logger.error('Error rejecting stationery request:', error);
      throw error;
    }
  }

  /**
   * Get pending requests for department head approval
   */
  async getPendingApprovalRequests(
    tenant_id: string,
    department?: string
  ): Promise<StationeryRequest[]> {
    try {
      const queryBuilder = this.requestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.item', 'item')
        .leftJoinAndSelect('request.user', 'user')
        .where('request.tenant_id = :tenant_id', { tenant_id })
        .andWhere('request.department_head_approval_status = :status', { status: 'PENDING' });

      if (department) {
        queryBuilder.andWhere('user.department = :department', { department });
      }

      return await queryBuilder.orderBy('request.created_at', 'ASC').getMany();
    } catch (error: any) {
      logger.error('Error fetching pending approval requests:', error);
      throw error;
    }
  }

  // ============================================
  // 3.4.4 REQUEST PROCESSING (Admin)
  // ============================================

  /**
   * Issue items (fulfill approved request)
   */
  async issueItems(
    request_id: string,
    tenant_id: string,
    admin_id: string,
    issued_quantity?: number
  ): Promise<StationeryRequest> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id },
        relations: ['item', 'user'],
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.department_head_approval_status !== 'APPROVED') {
        throw new Error('Only approved requests can be processed');
      }

      if (request.status === 'FULFILLED') {
        throw new Error('Request is already fulfilled');
      }

      const item = request.item;
      const quantityToIssue = issued_quantity || request.quantity;

      if (quantityToIssue > request.quantity) {
        throw new Error('Cannot issue more than requested quantity');
      }

      if (item.available_qty < quantityToIssue) {
        throw new Error(`Insufficient stock. Available: ${item.available_qty}, Requested: ${quantityToIssue}`);
      }

      // Deduct from inventory
      item.available_qty -= quantityToIssue;
      item.status = item.available_qty > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
      await this.itemRepository.save(item);

      // Update request
      if (quantityToIssue === request.quantity) {
        request.status = 'FULFILLED';
        request.fulfillment_status = 'FULFILLED';
      } else {
        request.status = 'PARTIAL';
        request.fulfillment_status = 'PARTIAL';
      }

      request.admin_id = admin_id;
      const updatedRequest = await this.requestRepository.save(request);

      // Log the fulfillment
      await this.logRepository.save({
        request_id: request_id,
        action_by: admin_id,
        action: 'ITEMS_ISSUED',
        notes: `Issued ${quantityToIssue} ${item.unit} of ${item.name}`,
      });

      logger.info(`Items issued for request ${request_id}: ${quantityToIssue} ${item.unit} (Admin: ${admin_id})`);

      // Notify employee
      if (request.user) {
        await emailService.sendNotificationEmail({
          name: `${request.user.first_name} ${request.user.last_name}`,
          email: request.user.email,
          title: 'Stationery Request Fulfilled',
          message: `Your stationery request for ${item.name} has been fulfilled. ${quantityToIssue} ${item.unit} has been issued.${quantityToIssue < request.quantity ? ` Note: Partial fulfillment (${quantityToIssue} of ${request.quantity} requested).` : ''}`,
        });
      }

      // Check if low stock alert needed
      await this.checkLowStockAlert(item);

      return updatedRequest;
    } catch (error: any) {
      logger.error('Error issuing items:', error);
      throw error;
    }
  }

  /**
   * Place request on backorder
   */
  async backorderRequest(
    request_id: string,
    tenant_id: string,
    admin_id: string,
    notes?: string
  ): Promise<StationeryRequest> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id },
        relations: ['item', 'user'],
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.department_head_approval_status !== 'APPROVED') {
        throw new Error('Only approved requests can be placed on backorder');
      }

      request.status = 'PENDING_STOCK';
      request.fulfillment_status = 'BACKORDER';
      request.admin_id = admin_id;
      request.admin_notes = notes?.trim() || (null as any);

      const updatedRequest = await this.requestRepository.save(request);

      // Log the backorder
      await this.logRepository.save({
        request_id: request_id,
        action_by: admin_id,
        action: 'BACKORDERED',
        notes: notes || 'Request placed on backorder due to insufficient stock',
      });

      logger.info(`Request placed on backorder: ${request_id} (Admin: ${admin_id})`);

      // Notify employee
      if (request.user) {
        await emailService.sendNotificationEmail({
          name: `${request.user.first_name} ${request.user.last_name}`,
          email: request.user.email,
          title: 'Stationery Request - Pending Stock',
          message: `Your stationery request for ${request.item.name} (${request.quantity} ${request.item.unit}) has been placed on backorder due to insufficient stock. You will be notified when the item is back in stock.${notes ? ` Notes: ${notes}` : ''}`,
        });
      }

      return updatedRequest;
    } catch (error: any) {
      logger.error('Error placing request on backorder:', error);
      throw error;
    }
  }

  /**
   * Get approved requests for processing
   */
  async getApprovedRequests(tenant_id: string): Promise<StationeryRequest[]> {
    try {
      return await this.requestRepository.find({
        where: {
          tenant_id,
          department_head_approval_status: 'APPROVED',
          status: 'APPROVED',
        },
        relations: ['item', 'user'],
        order: { created_at: 'ASC' },
      });
    } catch (error: any) {
      logger.error('Error fetching approved requests:', error);
      throw error;
    }
  }

  // ============================================
  // 3.4.5 INVENTORY ALERTS & NOTIFICATIONS
  // ============================================

  /**
   * Check and send low stock alert
   */
  private async checkLowStockAlert(item: StationeryItem): Promise<void> {
    try {
      if (item.available_qty <= item.reorder_level && item.available_qty > 0) {
        // Low stock alert
        await this.sendLowStockAlert(item);
      } else if (item.available_qty === 0) {
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
  private async sendLowStockAlert(item: StationeryItem): Promise<void> {
    try {
      // Get admins with SANGRAH scope
      const admins = await this.getSangrahAdmins(item.tenant_id);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Low Stock Alert',
          message: `Stationery item "${item.name}" is running low. Current stock: ${item.available_qty} ${item.unit}, Reorder level: ${item.reorder_level} ${item.unit}.`,
        });
      }

      logger.info(`Low stock alert sent for item: ${item.name} (Tenant: ${item.tenant_id})`);
    } catch (error: any) {
      logger.error('Error sending low stock alert:', error);
    }
  }

  /**
   * Send out of stock alert
   */
  private async sendOutOfStockAlert(item: StationeryItem): Promise<void> {
    try {
      // Get admins with SANGRAH scope
      const admins = await this.getSangrahAdmins(item.tenant_id);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Out of Stock Alert',
          message: `Stationery item "${item.name}" is out of stock. Please reorder immediately.`,
        });
      }

      logger.info(`Out of stock alert sent for item: ${item.name} (Tenant: ${item.tenant_id})`);
    } catch (error: any) {
      logger.error('Error sending out of stock alert:', error);
    }
  }

  /**
   * Get reorder suggestions
   */
  async getReorderSuggestions(tenant_id: string): Promise<StationeryItem[]> {
    try {
      return await this.itemRepository.find({
        where: {
          tenant_id,
        },
      }).then(items =>
        items.filter(item => item.available_qty <= item.reorder_level)
      );
    } catch (error: any) {
      logger.error('Error fetching reorder suggestions:', error);
      throw error;
    }
  }

  // ============================================
  // 3.4.7 ACKNOWLEDGMENT OF RECEIPT (Employee)
  // ============================================

  /**
   * Acknowledge receipt of stationery items
   */
  async acknowledgeReceipt(
    request_id: string,
    tenant_id: string,
    user_id: string,
    data: {
      received_items: Array<{ item_id: string; quantity: number }>;
      condition: 'GOOD' | 'DAMAGED';
      remarks?: string;
    }
  ): Promise<StationeryAcknowledgment> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id, user_id },
        relations: ['item'],
      });

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'FULFILLED' && request.status !== 'PARTIAL') {
        throw new Error('Only fulfilled requests can be acknowledged');
      }

      // Check if already acknowledged
      const existingAck = await this.acknowledgmentRepository.findOne({
        where: { request_id },
      });

      if (existingAck) {
        throw new Error('Request has already been acknowledged');
      }

      // Validate remarks length
      if (data.remarks && data.remarks.length > 200) {
        throw new Error('Remarks must be less than 200 characters');
      }

      const acknowledgment = this.acknowledgmentRepository.create({
        request_id,
        acknowledged_by: user_id,
        received_items: JSON.stringify(data.received_items),
        condition: data.condition,
        remarks: data.remarks?.trim() || null,
      });

      const savedAck = await this.acknowledgmentRepository.save(acknowledgment);

      // Update request status
      request.status = 'RECEIVED';
      await this.requestRepository.save(request);

      // Log the acknowledgment
      await this.logRepository.save({
        request_id: request_id,
        action_by: user_id,
        action: 'RECEIPT_ACKNOWLEDGED',
        notes: `Receipt acknowledged. Condition: ${data.condition}`,
      });

      logger.info(`Receipt acknowledged for request ${request_id} by user ${user_id}`);

      // Notify Admin
      await this.notifyAdminAcknowledgment(savedAck, request);

      return savedAck;
    } catch (error: any) {
      logger.error('Error acknowledging receipt:', error);
      throw error;
    }
  }

  /**
   * Get acknowledgment by request ID
   */
  async getAcknowledgment(request_id: string, tenant_id: string): Promise<StationeryAcknowledgment | null> {
    try {
      const request = await this.requestRepository.findOne({
        where: { id: request_id, tenant_id },
      });

      if (!request) {
        return null;
      }

      return await this.acknowledgmentRepository.findOne({
        where: { request_id },
        relations: ['acknowledgedBy'],
      });
    } catch (error: any) {
      logger.error('Error fetching acknowledgment:', error);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get admins with SANGRAH scope (superadmins or admins with SANGRAH/ALL scope)
   */
  private async getSangrahAdmins(tenant_id: string): Promise<Admin[]> {
    try {
      // Get all active admins for the tenant
      const allAdmins = await this.adminRepository.find({
        where: { tenant_id, is_active: true },
      });

      // Filter: superadmins OR admins with module_scope = "SANGRAH" or "ALL"
      return allAdmins.filter(
        (admin) =>
          admin.is_super_admin || // Superadmins always have access
          admin.module_scope === 'SANGRAH' || // Admins with SANGRAH scope
          admin.module_scope === 'ALL' // Admins with ALL scope
      );
    } catch (error: any) {
      logger.error('Error fetching SANGRAH admins:', error);
      return [];
    }
  }

  /**
   * Notify department head of new request
   */
  private async notifyDepartmentHead(request: StationeryRequest, user: User): Promise<void> {
    try {
      // Get admins with SANGRAH scope
      const admins = await this.getSangrahAdmins(request.tenant_id);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'New Stationery Request',
          message: `A new stationery request has been submitted by ${user.first_name} ${user.last_name} (${user.department || 'N/A'}) for ${request.quantity} ${request.item?.unit || 'units'}. Please review and approve.`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying department head:', error);
      // Don't throw - notification failures shouldn't break the flow
    }
  }

  /**
   * Notify admin for processing
   */
  private async notifyAdminForProcessing(request: StationeryRequest): Promise<void> {
    try {
      // Get admins with SANGRAH scope
      const admins = await this.getSangrahAdmins(request.tenant_id);

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Approved Stationery Request - Ready for Processing',
          message: `A stationery request has been approved and is ready for processing. Request ID: ${request.id}, Item: ${request.item?.name}, Quantity: ${request.quantity} ${request.item?.unit}.`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying admin for processing:', error);
    }
  }

  /**
   * Notify admin of acknowledgment
   */
  private async notifyAdminAcknowledgment(
    acknowledgment: StationeryAcknowledgment,
    request: StationeryRequest
  ): Promise<void> {
    try {
      // Get admins with SANGRAH scope
      const admins = await this.getSangrahAdmins(request.tenant_id);

      const user = acknowledgment.acknowledged_by
        ? await this.userRepository.findOne({
            where: { id: acknowledgment.acknowledged_by },
          })
        : null;

      for (const admin of admins) {
        await emailService.sendNotificationEmail({
          name: `${admin.first_name} ${admin.last_name}`,
          email: admin.email,
          title: 'Stationery Request Acknowledged',
          message: `Stationery request ID #${request.id} has been acknowledged by ${user?.first_name} ${user?.last_name}. Condition: ${acknowledgment.condition}.`,
        });
      }
    } catch (error: any) {
      logger.error('Error notifying admin of acknowledgment:', error);
    }
  }

  /**
   * Notify request cancellation
   */
  private async notifyRequestCancellation(request: StationeryRequest): Promise<void> {
    try {
      // TODO: Notify department head
      logger.info(`Request cancellation notification (not implemented yet): ${request.id}`);
    } catch (error: any) {
      logger.error('Error notifying request cancellation:', error);
    }
  }
}

// Export singleton instance
export const stationeryService = new StationeryService();
