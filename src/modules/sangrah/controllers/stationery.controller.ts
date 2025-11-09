// Stationery controller
import { Request, Response } from 'express';
import { stationeryService } from '../services/stationery.service';
import { ApiResponseUtil } from '../../../utils/apiResponse';
import { logger } from '../../../config/logger';

export class StationeryController {
  // ============================================
  // 3.4.1 STATIONERY INVENTORY MANAGEMENT (Admin)
  // ============================================

  /**
   * Add stationery item
   * POST /api/v1/sangrah/items
   * Role: Admin
   */
  async addItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only admins and superadmins can add items
      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can add stationery items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const {
        name,
        description,
        category,
        unit,
        quantity_in_stock,
        reorder_level,
        supplier_name,
        purchase_date,
        requirement_type,
      } = req.body;

      // Validation
      if (!name || !category || !unit || quantity_in_stock === undefined || reorder_level === undefined) {
        return ApiResponseUtil.error(res, new Error('Missing required fields'), 400);
      }

      const item = await stationeryService.addItem(tenant_id, {
        name,
        description,
        category,
        unit,
        quantity_in_stock,
        reorder_level,
        supplier_name,
        purchase_date: purchase_date ? new Date(purchase_date) : undefined,
        requirement_type,
      });

      ApiResponseUtil.success(res, item, 'Item added successfully');
    } catch (error: any) {
      logger.error('Error in addItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to add item');
    }
  }

  /**
   * Update stationery item
   * PUT /api/v1/sangrah/items/:id
   * Role: Admin
   */
  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can update stationery items');
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
        unit,
        quantity_in_stock,
        reorder_level,
        supplier_name,
        purchase_date,
        requirement_type,
      } = req.body;

      const item = await stationeryService.updateItem(id, tenant_id, {
        name,
        description,
        category,
        unit,
        quantity_in_stock,
        reorder_level,
        supplier_name,
        purchase_date: purchase_date ? new Date(purchase_date) : undefined,
        requirement_type,
      });

      ApiResponseUtil.success(res, item, 'Item updated successfully');
    } catch (error: any) {
      logger.error('Error in updateItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to update item');
    }
  }

  /**
   * Delete stationery item
   * DELETE /api/v1/sangrah/items/:id
   * Role: Admin
   */
  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can delete stationery items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      await stationeryService.deleteItem(id, tenant_id);

      ApiResponseUtil.success(res, null, 'Item deleted successfully');
    } catch (error: any) {
      logger.error('Error in deleteItem:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to delete item');
    }
  }

  /**
   * Get all stationery items
   * GET /api/v1/sangrah/items
   * Role: All authenticated users
   */
  async getItems(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { category, status, search } = req.query;

      const items = await stationeryService.getItems(tenant_id, {
        category: category as string,
        status: status as string,
        search: search as string,
      });

      ApiResponseUtil.success(res, items, 'Items retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getItems:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch items');
    }
  }

  /**
   * Get stationery item by ID
   * GET /api/v1/sangrah/items/:id
   * Role: All authenticated users
   */
  async getItemById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const item = await stationeryService.getItemById(id, tenant_id);

      if (!item) {
        return ApiResponseUtil.notFound(res, 'Item not found');
      }

      ApiResponseUtil.success(res, item, 'Item retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getItemById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch item');
    }
  }

  /**
   * Adjust stock
   * PUT /api/v1/sangrah/items/:id/adjust-stock
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

      const item = await stationeryService.adjustStock(id, tenant_id, req.user.id, {
        adjustment: parseInt(adjustment, 10),
        reason,
      });

      ApiResponseUtil.success(res, item, 'Stock adjusted successfully');
    } catch (error: any) {
      logger.error('Error in adjustStock:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to adjust stock');
    }
  }

  // ============================================
  // 3.4.2 STATIONERY REQUEST FORM (Employee)
  // ============================================

  /**
   * Create stationery request
   * POST /api/v1/sangrah/requests
   * Role: User
   */
  async createRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can create requests
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can create stationery requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { item_id, quantity, purpose, required_by_date } = req.body;

      if (!item_id || !quantity) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: item_id, quantity'), 400);
      }

      const request = await stationeryService.createRequest(tenant_id, req.user.id, {
        item_id,
        quantity: parseInt(quantity, 10),
        purpose,
        required_by_date: required_by_date ? new Date(required_by_date) : undefined,
      });

      ApiResponseUtil.success(res, request, 'Request submitted successfully');
    } catch (error: any) {
      logger.error('Error in createRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to submit request');
    }
  }

  /**
   * Cancel stationery request
   * PUT /api/v1/sangrah/requests/:id/cancel
   * Role: User
   */
  async cancelRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can cancel their requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const request = await stationeryService.cancelRequest(id, tenant_id, req.user.id);

      ApiResponseUtil.success(res, request, 'Request canceled successfully');
    } catch (error: any) {
      logger.error('Error in cancelRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to cancel request');
    }
  }

  /**
   * Get user's stationery requests
   * GET /api/v1/sangrah/requests
   * Role: User
   */
  async getUserRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can view their requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { status } = req.query;

      const requests = await stationeryService.getUserRequests(tenant_id, req.user.id, {
        status: status as string,
      });

      ApiResponseUtil.success(res, requests, 'Requests retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getUserRequests:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch requests');
    }
  }

  // ============================================
  // 3.4.3 REQUEST APPROVAL WORKFLOW (Department Head)
  // ============================================

  /**
   * Approve stationery request
   * PUT /api/v1/sangrah/requests/:id/approve
   * Role: Department Head (Admin/Superadmin)
   */
  async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only admins and superadmins can approve (acting as department heads)
      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only department heads can approve requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { comments } = req.body;

      const request = await stationeryService.approveRequest(id, tenant_id, req.user.id, comments);

      ApiResponseUtil.success(res, request, 'Request approved successfully');
    } catch (error: any) {
      logger.error('Error in approveRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to approve request');
    }
  }

  /**
   * Reject stationery request
   * PUT /api/v1/sangrah/requests/:id/reject
   * Role: Department Head (Admin/Superadmin)
   */
  async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only department heads can reject requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return ApiResponseUtil.error(res, new Error('Reason is required for rejection'), 400);
      }

      const request = await stationeryService.rejectRequest(id, tenant_id, req.user.id, reason);

      ApiResponseUtil.success(res, request, 'Request rejected successfully');
    } catch (error: any) {
      logger.error('Error in rejectRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to reject request');
    }
  }

  /**
   * Get pending approval requests
   * GET /api/v1/sangrah/requests/pending-approval
   * Role: Department Head (Admin/Superadmin)
   */
  async getPendingApprovalRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only department heads can view pending requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { department } = req.query;

      const requests = await stationeryService.getPendingApprovalRequests(tenant_id, department as string);

      ApiResponseUtil.success(res, requests, 'Pending requests retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getPendingApprovalRequests:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch pending requests');
    }
  }

  // ============================================
  // 3.4.4 REQUEST PROCESSING (Admin)
  // ============================================

  /**
   * Issue items (fulfill request)
   * PUT /api/v1/sangrah/requests/:id/issue
   * Role: Admin
   */
  async issueItems(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can issue items');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { issued_quantity } = req.body;

      const request = await stationeryService.issueItems(
        id,
        tenant_id,
        req.user.id,
        issued_quantity ? parseInt(issued_quantity, 10) : undefined
      );

      ApiResponseUtil.success(res, request, 'Items issued successfully');
    } catch (error: any) {
      logger.error('Error in issueItems:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to issue items');
    }
  }

  /**
   * Place request on backorder
   * PUT /api/v1/sangrah/requests/:id/backorder
   * Role: Admin
   */
  async backorderRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can place requests on backorder');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { notes } = req.body;

      const request = await stationeryService.backorderRequest(id, tenant_id, req.user.id, notes);

      ApiResponseUtil.success(res, request, 'Request placed on backorder successfully');
    } catch (error: any) {
      logger.error('Error in backorderRequest:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to place request on backorder');
    }
  }

  /**
   * Get approved requests for processing
   * GET /api/v1/sangrah/requests/approved
   * Role: Admin
   */
  async getApprovedRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view approved requests');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const requests = await stationeryService.getApprovedRequests(tenant_id);

      ApiResponseUtil.success(res, requests, 'Approved requests retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getApprovedRequests:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch approved requests');
    }
  }

  // ============================================
  // 3.4.5 INVENTORY ALERTS & NOTIFICATIONS
  // ============================================

  /**
   * Get reorder suggestions
   * GET /api/v1/sangrah/items/reorder-suggestions
   * Role: Admin, Super Admin
   */
  async getReorderSuggestions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'admin' && req.user.type !== 'super_admin') {
        return ApiResponseUtil.forbidden(res, 'Only admins can view reorder suggestions');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const items = await stationeryService.getReorderSuggestions(tenant_id);

      ApiResponseUtil.success(res, items, 'Reorder suggestions retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getReorderSuggestions:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch reorder suggestions');
    }
  }

  // ============================================
  // 3.4.7 ACKNOWLEDGMENT OF RECEIPT (Employee)
  // ============================================

  /**
   * Acknowledge receipt of stationery items
   * POST /api/v1/sangrah/requests/:id/acknowledge
   * Role: User
   */
  async acknowledgeReceipt(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'Only regular users can acknowledge receipt');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;
      const { received_items, condition, remarks } = req.body;

      if (!received_items || !condition) {
        return ApiResponseUtil.error(res, new Error('Missing required fields: received_items, condition'), 400);
      }

      if (condition !== 'GOOD' && condition !== 'DAMAGED') {
        return ApiResponseUtil.error(res, new Error('Condition must be either GOOD or DAMAGED'), 400);
      }

      const acknowledgment = await stationeryService.acknowledgeReceipt(id, tenant_id, req.user.id, {
        received_items,
        condition,
        remarks,
      });

      ApiResponseUtil.success(res, acknowledgment, 'Receipt acknowledged successfully');
    } catch (error: any) {
      logger.error('Error in acknowledgeReceipt:', error);
      ApiResponseUtil.error(res, error, 400, error.message || 'Failed to acknowledge receipt');
    }
  }

  /**
   * Get acknowledgment by request ID
   * GET /api/v1/sangrah/requests/:id/acknowledgment
   * Role: User, Admin
   */
  async getAcknowledgment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(res, new Error('User must be associated with a tenant'), 400);
      }

      const { id } = req.params;

      const acknowledgment = await stationeryService.getAcknowledgment(id, tenant_id);

      if (!acknowledgment) {
        return ApiResponseUtil.notFound(res, 'Acknowledgment not found');
      }

      ApiResponseUtil.success(res, acknowledgment, 'Acknowledgment retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getAcknowledgment:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch acknowledgment');
    }
  }
}

// Export singleton instance
export const stationeryController = new StationeryController();
