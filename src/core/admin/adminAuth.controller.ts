// Superadmin authentication controller
import { Request, Response } from 'express';
import { adminAuthService } from './adminAuth.service';
import { logger } from '../../config/logger';
import { ApiResponseUtil } from '../../utils/apiResponse';
import { generateToken } from '../../utils/jwt';

export class AdminAuthController {
  /**
   * Admin/Superadmin Login (unified endpoint)
   * POST /api/v1/admin/auth/login
   * Works for both superadmin and regular admin
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Check if req.body exists
      if (!req.body) {
        logger.error('Request body is undefined', {
          headers: req.headers,
          method: req.method,
          url: req.url,
        });
        return ApiResponseUtil.validationError(
          res,
          ['Request body is required. Please ensure Content-Type: application/json header is set.']
        );
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponseUtil.validationError(
          res,
          ['Email and password are required']
        );
      }

      const admin = await adminAuthService.login(email, password);

      // Determine token type based on admin level
      const tokenType = admin.is_super_admin ? 'super_admin' : 'admin';

      // Generate JWT token
      const token = generateToken({
        id: admin.id,
        email: admin.email,
        type: tokenType,
        tenant_id: admin.tenant_id, // Admin belongs to a tenant
      });

      const responseData: any = {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        tenant_id: admin.tenant_id,
        tenant_name: admin.tenant?.name || null,
        is_super_admin: admin.is_super_admin,
        admin_level: admin.admin_level,
        token,
        token_type: 'Bearer',
        expires_in: process.env.JWT_EXPIRES_IN || '24h',
      };

      // Add module_scope for regular admins
      if (!admin.is_super_admin && admin.module_scope) {
        responseData.module_scope = admin.module_scope;
      }

      const message = admin.is_super_admin 
        ? 'Superadmin login successful' 
        : 'Admin login successful';

      ApiResponseUtil.success(res, responseData, message);
    } catch (error: any) {
      logger.error('Error in admin login:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers,
      });
      
      // Handle specific error types
      if (error.message && error.message.includes('Cannot destructure')) {
        return ApiResponseUtil.validationError(
          res,
          ['Request body is required. Please ensure Content-Type: application/json header is set and body is sent as JSON.']
        );
      }
      
      ApiResponseUtil.unauthorized(res, error.message || 'Login failed');
    }
  }
}

