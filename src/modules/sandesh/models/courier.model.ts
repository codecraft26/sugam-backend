// Courier model (TypeORM entity)
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../../core/tenancy/tenant.model';
import { User } from '../../../core/users/user.model';

@Entity('couriers')
export class Courier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tracking_no: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  courier_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  courier_partner_name!: string | null; // BlueDart, DTDC, etc.

  @Column({ type: 'varchar', length: 20, default: 'INCOMING' })
  courier_type!: string; // INCOMING, OUTGOING

  @Column({ type: 'varchar', length: 150, nullable: true })
  sender: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  company_name!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  company_code!: string | null;

  @Column({ type: 'uuid', nullable: true })
  receiver_id: string;

  @Column({ type: 'uuid', nullable: true })
  admin_id: string;

  @Column({ type: 'text', nullable: true })
  admin_notes: string;

  @Column({ type: 'varchar', length: 50, default: 'IN_TRANSIT' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  received_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: User;
}

