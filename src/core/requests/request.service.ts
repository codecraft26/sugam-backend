// Request service
import { AppDataSource } from '../../config/data-source';
import { Request } from './request.model';
import { User } from '../users/user.model';
import { logger } from '../../config/logger';

export class RequestService {
  private requestRepository = AppDataSource.getRepository(Request);
  private userRepository = AppDataSource.getRepository(User);

  /**
   * Create a new request (by user)
   */
  async createRequest(data: {
    user_id: string;
    tenant_id: string;
    employee_name?: string;
    employee_id?: string;
    module_scope?: string;
    description: string;
    company?: string;
    department?: string;
  }): Promise<Request> {
    try {
      // Validate required fields
      if (!data.description || !data.description.trim()) {
        throw new Error('Description is required');
      }

      // Fetch user to get their details if not provided
      const user = await this.userRepository.findOne({
        where: { id: data.user_id },
        select: ['id', 'first_name', 'last_name', 'employee_id', 'department'],
      });

      // Auto-populate employee_name and employee_id from user if not provided
      const employeeName = data.employee_name || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : null);
      const employeeId = data.employee_id || user?.employee_id || null;
      const department = data.department || user?.department || null;

      const request = this.requestRepository.create({
        user_id: data.user_id,
        tenant_id: data.tenant_id,
        employee_name: employeeName,
        employee_id: employeeId,
        module_scope: data.module_scope?.trim() || null,
        description: data.description.trim(),
        company: data.company?.trim() || null,
        department: department,
        status: 'PENDING',
        admin_comments: null,
        reviewed_by: null,
      });

      const savedRequest = await this.requestRepository.save(request);
      logger.info(`Request created: ${savedRequest.id} by user ${data.user_id}`);
      return savedRequest;
    } catch (error: any) {
      logger.error('Error creating request:', error);
      throw error;
    }
  }

  /**
   * Get all requests for a user
   */
  async getUserRequests(user_id: string, tenant_id: string): Promise<Request[]> {
    try {
      return await this.requestRepository.find({
        where: {
          user_id,
          tenant_id,
        },
        order: {
          created_at: 'DESC',
        },
      });
    } catch (error: any) {
      logger.error('Error fetching user requests:', error);
      throw error;
    }
  }

  /**
   * Get all requests for a tenant (for superadmin)
   * Tenant-isolated: Only returns requests from the specified tenant
   */
  async getTenantRequests(
    tenant_id: string,
    options?: {
      status?: string;
      module_scope?: string;
      department?: string;
    }
  ): Promise<Request[]> {
    try {
      // Filter by tenant_id to ensure tenant isolation
      const where: any = {
        tenant_id,
      };

      if (options?.status) {
        where.status = options.status;
      }

      if (options?.module_scope) {
        where.module_scope = options.module_scope;
      }

      if (options?.department) {
        where.department = options.department;
      }

      return await this.requestRepository.find({
        where,
        order: {
          created_at: 'DESC',
        },
      });
    } catch (error: any) {
      logger.error('Error fetching tenant requests:', error);
      throw error;
    }
  }

  /**
   * Get a single request by ID
   * Tenant-isolated: Only returns request if it belongs to the specified tenant
   */
  async getRequestById(request_id: string, tenant_id: string, user_id?: string): Promise<Request | null> {
    try {
      // Filter by both id and tenant_id to ensure tenant isolation
      const where: any = {
        id: request_id,
        tenant_id, // Ensures request belongs to the tenant
      };

      // If user_id is provided, ensure the request belongs to that user
      if (user_id) {
        where.user_id = user_id;
      }

      return await this.requestRepository.findOne({
        where,
      });
    } catch (error: any) {
      logger.error('Error fetching request:', error);
      throw error;
    }
  }

  /**
   * Approve a request (superadmin only)
   * Tenant-isolated: Only requests from the specified tenant can be approved
   */
  async approveRequest(
    request_id: string,
    tenant_id: string,
    admin_id: string,
    admin_comments?: string
  ): Promise<Request> {
    try {
      // Get request - this ensures tenant isolation (request must belong to the tenant)
      const request = await this.getRequestById(request_id, tenant_id);

      if (!request) {
        throw new Error('Request not found or does not belong to your tenant');
      }

      if (request.status !== 'PENDING') {
        throw new Error(`Request is already ${request.status}`);
      }

      request.status = 'APPROVED';
      request.reviewed_by = admin_id;
      request.admin_comments = admin_comments?.trim() || null;

      const updatedRequest = await this.requestRepository.save(request);
      logger.info(`Request approved: ${request_id} by admin ${admin_id} (Tenant: ${tenant_id})`);
      return updatedRequest;
    } catch (error: any) {
      logger.error('Error approving request:', error);
      throw error;
    }
  }

  /**
   * Reject a request (superadmin only)
   * Tenant-isolated: Only requests from the specified tenant can be rejected
   */
  async rejectRequest(
    request_id: string,
    tenant_id: string,
    admin_id: string,
    admin_comments?: string
  ): Promise<Request> {
    try {
      // Get request - this ensures tenant isolation (request must belong to the tenant)
      const request = await this.getRequestById(request_id, tenant_id);

      if (!request) {
        throw new Error('Request not found or does not belong to your tenant');
      }

      if (request.status !== 'PENDING') {
        throw new Error(`Request is already ${request.status}`);
      }

      request.status = 'REJECTED';
      request.reviewed_by = admin_id;
      request.admin_comments = admin_comments?.trim() || null;

      const updatedRequest = await this.requestRepository.save(request);
      logger.info(`Request rejected: ${request_id} by admin ${admin_id} (Tenant: ${tenant_id})`);
      return updatedRequest;
    } catch (error: any) {
      logger.error('Error rejecting request:', error);
      throw error;
    }
  }
}

