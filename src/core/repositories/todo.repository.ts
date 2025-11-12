// Todo Repository - Single Responsibility: Data Access
import { AppDataSource } from '../../config/data-source';
import { Todo } from '../todos/todo.model';
import { BaseRepository } from './base.repository';
import { ITodoRepository } from '../interfaces/repository.interface';

export class TodoRepository extends BaseRepository<Todo> implements ITodoRepository {
  constructor() {
    super(AppDataSource.getRepository(Todo));
  }

  async findByUser(user_id: string, tenant_id: string, options?: {
    is_completed?: boolean;
    priority?: number;
  }): Promise<Todo[]> {
    const where: any = {
      user_id,
      tenant_id,
    };

    if (options?.is_completed !== undefined) {
      where.is_completed = options.is_completed;
    }

    if (options?.priority !== undefined) {
      where.priority = options.priority;
    }

    return this.repository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findByUserAndId(todo_id: string, user_id: string, tenant_id: string): Promise<Todo | null> {
    return this.repository.findOne({
      where: {
        id: todo_id,
        user_id,
        tenant_id,
      } as any,
    });
  }
}

