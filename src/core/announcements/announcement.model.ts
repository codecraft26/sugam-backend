// Announcement model (TypeORM entity)
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
import { Admin } from '../admin/admin.model';

@Entity('announcements')
@Index(['tenant_id'])
@Index(['department'])
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string;

  @Column({ type: 'uuid', nullable: true })
  created_by!: string | null; // Admin ID who created this announcement

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url!: string | null; // URL or path to announcement image

  @Column({ type: 'varchar', length: 100, nullable: true })
  department!: string | null; // For department-specific announcements (null = all departments)

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Admin, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator!: Admin | null;
}

