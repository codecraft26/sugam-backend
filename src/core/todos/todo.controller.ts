// Todo controller
import { Request, Response } from 'express';
import { TodoService } from './todo.service';
import { logger } from '../../config/logger';
import { ApiResponseUtil } from '../../utils/apiResponse';

const todoService = new TodoService();

export class TodoController {
  /**
   * Create a new todo
   * POST /api/v1/auth/todos
   */
  async createTodo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can create todos
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { title, description, due_date, priority } = req.body;

      if (!title || !title.trim()) {
        return ApiResponseUtil.validationError(res, ['Title is required']);
      }

      const todo = await todoService.createTodo({
        user_id: req.user.id,
        tenant_id,
        title,
        description,
        due_date,
        priority,
      });

      ApiResponseUtil.created(res, {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        is_completed: todo.is_completed,
        due_date: todo.due_date,
        priority: todo.priority,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
      }, 'Todo created successfully');
    } catch (error: any) {
      logger.error('Error in createTodo:', error);
      ApiResponseUtil.error(res, error, 400, 'Failed to create todo');
    }
  }

  /**
   * Get all todos for the current user
   * GET /api/v1/auth/todos
   */
  async getTodos(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can view their todos
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const is_completed = req.query.is_completed === 'true' ? true : req.query.is_completed === 'false' ? false : undefined;
      const priority = req.query.priority ? parseInt(req.query.priority as string, 10) : undefined;

      const todos = await todoService.getUserTodos(req.user.id, tenant_id, {
        is_completed,
        priority,
      });

      ApiResponseUtil.success(res, {
        count: todos.length,
        todos: todos.map((todo) => ({
          id: todo.id,
          title: todo.title,
          description: todo.description,
          is_completed: todo.is_completed,
          due_date: todo.due_date,
          priority: todo.priority,
          created_at: todo.created_at,
          updated_at: todo.updated_at,
        })),
      }, 'Todos retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getTodos:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch todos');
    }
  }

  /**
   * Get a single todo by ID
   * GET /api/v1/auth/todos/:id
   */
  async getTodoById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can view their todos
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      const todo = await todoService.getTodoById(id, req.user.id, tenant_id);

      if (!todo) {
        return ApiResponseUtil.notFound(res, 'Todo not found');
      }

      ApiResponseUtil.success(res, {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        is_completed: todo.is_completed,
        due_date: todo.due_date,
        priority: todo.priority,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
      }, 'Todo retrieved successfully');
    } catch (error: any) {
      logger.error('Error in getTodoById:', error);
      ApiResponseUtil.error(res, error, 500, 'Failed to fetch todo');
    }
  }

  /**
   * Update a todo
   * PUT /api/v1/auth/todos/:id
   */
  async updateTodo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can update their todos
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      const { title, description, is_completed, due_date, priority } = req.body;

      const todo = await todoService.updateTodo(id, req.user.id, tenant_id, {
        title,
        description,
        is_completed,
        due_date,
        priority,
      });

      ApiResponseUtil.success(res, {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        is_completed: todo.is_completed,
        due_date: todo.due_date,
        priority: todo.priority,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
      }, 'Todo updated successfully');
    } catch (error: any) {
      logger.error('Error in updateTodo:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to update todo');
    }
  }

  /**
   * Delete a todo
   * DELETE /api/v1/auth/todos/:id
   */
  async deleteTodo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return ApiResponseUtil.unauthorized(res, 'Authentication required');
      }

      // Only regular users can delete their todos
      if (req.user.type !== 'user') {
        return ApiResponseUtil.forbidden(res, 'This endpoint is for regular users only');
      }

      const tenant_id = req.user.tenant_id;
      if (!tenant_id) {
        return ApiResponseUtil.error(
          res,
          new Error('User must be associated with a tenant'),
          400
        );
      }

      const { id } = req.params;
      await todoService.deleteTodo(id, req.user.id, tenant_id);

      ApiResponseUtil.success(res, null, 'Todo deleted successfully');
    } catch (error: any) {
      logger.error('Error in deleteTodo:', error);
      
      if (error.message && error.message.includes('not found')) {
        return ApiResponseUtil.notFound(res, error.message);
      }

      ApiResponseUtil.error(res, error, 400, 'Failed to delete todo');
    }
  }
}

