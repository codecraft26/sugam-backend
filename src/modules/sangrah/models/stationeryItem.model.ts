// Stationery item model (TypeORM entity)
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Tenant } from '../../../core/tenancy/tenant.model';
import { StationeryRequest } from './stationeryRequest.model';

@Entity('stationery_items')
@Index(['tenant_id'])
export class StationeryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // Writing, Paper, Accessories, etc.

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string;

  @Column({ type: 'int', default: 0 })
  available_qty: number;

  @Column({ type: 'int', default: 0 })
  reorder_level!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  supplier_name!: string | null;

  @Column({ type: 'date', nullable: true })
  purchase_date!: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  requirement_type!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'IN_STOCK' })
  status: string; // IN_STOCK, OUT_OF_STOCK

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => StationeryRequest, (request) => request.item)
  requests: StationeryRequest[];
}
