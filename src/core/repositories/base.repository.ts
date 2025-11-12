// Base repository implementation following Repository Pattern
import { Repository, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { IRepository } from '../interfaces/repository.interface';

export abstract class BaseRepository<T extends ObjectLiteral> implements IRepository<T> {
  constructor(protected repository: Repository<T>) {}

  async findOne(id: string, tenant_id?: string): Promise<T | null> {
    const where: FindOptionsWhere<T> = { id } as any;
    if (tenant_id) {
      (where as any).tenant_id = tenant_id;
    }
    return this.repository.findOne({ where });
  }

  async find(options?: any): Promise<T[]> {
    return this.repository.find(options || {});
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async delete(id: string, tenant_id?: string): Promise<void> {
    const where: FindOptionsWhere<T> = { id } as any;
    if (tenant_id) {
      (where as any).tenant_id = tenant_id;
    }
    await this.repository.delete(where);
  }

  create(data: Partial<T>): T {
    const result = this.repository.create(data as any);
    // TypeORM create can return T or T[], but we expect single entity
    return (Array.isArray(result) ? result[0] : result) as T;
  }
}

