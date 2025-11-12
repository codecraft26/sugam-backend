// Todo service - Following SOLID Principles
import { Todo } from './todo.model';
import { ITodoRepository } from '../interfaces/repository.interface';
import { ILoggerService, ITodoService } from '../interfaces/service.interface';

// Todo Service - Single Responsibility: Business Logic
export class TodoService implements ITodoService {
  constructor(
    private todoRepository: ITodoRepository,
    private logger: ILoggerService
  ) {}

  /**
   * Create a new todo for a user
   */
  async createTodo(data: {
    user_id: string;
    tenant_id: string;
    title: string;
    description?: string;
    due_date?: Date | string;
    priority?: number; // 0: Low, 1: Medium, 2: High
  }): Promise<Todo> {
    try {
      // Validate required fields
      if (!data.title || !data.title.trim()) {
        throw new Error('Title is required');
      }

      // Parse due_date if it's a string
      let dueDate: Date | null = null;
      if (data.due_date) {
        dueDate = typeof data.due_date === 'string' ? new Date(data.due_date) : data.due_date;
      }

      // Validate priority (0-2)
      const priority = data.priority !== undefined ? Math.max(0, Math.min(2, data.priority)) : 0;

      const todo = this.todoRepository.create({
        user_id: data.user_id,
        tenant_id: data.tenant_id,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        due_date: dueDate,
        priority,
        is_completed: false,
      });

      const savedTodo = await this.todoRepository.save(todo);
      this.logger.info(`Todo created: ${savedTodo.id} by user ${data.user_id}`);
      return savedTodo;
    } catch (error: any) {
      this.logger.error('Error creating todo:', error);
      throw error;
    }
  }

  /**
   * Get all todos for a user
   */
  async getUserTodos(user_id: string, tenant_id: string, options?: {
    is_completed?: boolean;
    priority?: number;
  }): Promise<Todo[]> {
    try {
      return await this.todoRepository.findByUser(user_id, tenant_id, options);
    } catch (error: any) {
      this.logger.error('Error fetching user todos:', error);
      throw error;
    }
  }

  /**
   * Get a single todo by ID (ensures it belongs to the user)
   */
  async getTodoById(todo_id: string, user_id: string, tenant_id: string): Promise<Todo | null> {
    try {
      return await this.todoRepository.findByUserAndId(todo_id, user_id, tenant_id);
    } catch (error: any) {
      this.logger.error('Error fetching todo:', error);
      throw error;
    }
  }

  /**
   * Update a todo (only by the owner)
   */
  async updateTodo(
    todo_id: string,
    user_id: string,
    tenant_id: string,
    data: {
      title?: string;
      description?: string;
      is_completed?: boolean;
      due_date?: Date | string | null;
      priority?: number;
    }
  ): Promise<Todo> {
    try {
      const todo = await this.getTodoById(todo_id, user_id, tenant_id);

      if (!todo) {
        throw new Error('Todo not found');
      }

      if (data.title !== undefined) {
        todo.title = data.title.trim();
      }

      if (data.description !== undefined) {
        todo.description = data.description?.trim() || null;
      }

      if (data.is_completed !== undefined) {
        todo.is_completed = data.is_completed;
      }

      if (data.due_date !== undefined) {
        if (data.due_date === null) {
          todo.due_date = null;
        } else {
          todo.due_date = typeof data.due_date === 'string' ? new Date(data.due_date) : data.due_date;
        }
      }

      if (data.priority !== undefined) {
        todo.priority = Math.max(0, Math.min(2, data.priority));
      }

      const updatedTodo = await this.todoRepository.save(todo);
      this.logger.info(`Todo updated: ${updatedTodo.id} by user ${user_id}`);
      return updatedTodo;
    } catch (error: any) {
      this.logger.error('Error updating todo:', error);
      throw error;
    }
  }

  /**
   * Delete a todo (only by the owner)
   */
  async deleteTodo(todo_id: string, user_id: string, tenant_id: string): Promise<void> {
    try {
      const todo = await this.getTodoById(todo_id, user_id, tenant_id);

      if (!todo) {
        throw new Error('Todo not found');
      }

      await this.todoRepository.delete(todo_id, tenant_id);
      this.logger.info(`Todo deleted: ${todo_id} by user ${user_id}`);
    } catch (error: any) {
      this.logger.error('Error deleting todo:', error);
      throw error;
    }
  }
}

// Export singleton instance - will be set by bootstrap
// Using a getter function to avoid circular dependencies
let _todoService: TodoService | null = null;

export function setTodoService(service: TodoService): void {
  _todoService = service;
}

export function getTodoService(): TodoService {
  if (!_todoService) {
    throw new Error('TodoService not initialized. Make sure bootstrapDI() is called before using todoService.');
  }
  return _todoService;
}

// Proxy for backward compatibility
export const todoService = new Proxy({} as TodoService, {
  get(_target, prop) {
    return getTodoService()[prop as keyof TodoService];
  }
});

