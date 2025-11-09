// Generic request model (TypeORM entity) - for SUGHAM portal requests
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../tenancy/tenant.model';
import { User } from '../users/user.model';
import { Admin } from '../admin/admin.model';

@Entity('requests')
@Index(['tenant_id'])
@Index(['user_id'])
@Index(['status'])
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employee_name!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employee_id!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  module_scope!: string | null; // Related module (e.g., SANGRAH, DWAR, SAMMILAN, etc.)

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: string; // PENDING, APPROVED, REJECTED

  @Column({ type: 'text', nullable: true })
  admin_comments!: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by!: string | null; // Admin ID who reviewed this request

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Admin, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer!: Admin | null;
}

