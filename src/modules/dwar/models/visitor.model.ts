// Visitor model (TypeORM entity)
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../../core/tenancy/tenant.model';
import { User } from '../../../core/users/user.model';
import { Building } from '../../../core/orgs/building.model';
import { Floor } from '../../../core/orgs/floor.model';

@Entity('visitors')
@Index(['tenant_id'])
export class Visitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contact_no: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  visitor_type!: string | null; // Guest, Vendor, Delivery, VIP, VVIP

  @Column({ type: 'text', nullable: true })
  purpose: string;

  @Column({ type: 'text', nullable: true })
  access_areas!: string | null; // JSON array for VIP/VVIP

  @Column({ type: 'text', nullable: true })
  custom_fields!: string | null; // JSON for custom fields

  @Column({ type: 'text', nullable: true })
  additional_comments!: string | null;

  @Column({ type: 'uuid', nullable: true })
  visiting_user: string;

  @Column({ type: 'uuid', nullable: true })
  admin_id: string;

  @Column({ type: 'text', nullable: true })
  admin_notes: string;

  @Column({ type: 'timestamp', nullable: true })
  check_in: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out: Date;

  @Column({ type: 'uuid', nullable: true })
  building_id: string;

  @Column({ type: 'uuid', nullable: true })
  floor_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  registration_mode!: string | null; // walk-in, pre-registration, self-checkin, bulk

  @Column({ type: 'uuid', nullable: true })
  receptionist_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  kiosk_id!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  visitor_photo_url!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  visitor_id_photo_url!: string | null;

  @Column({ type: 'text', nullable: true })
  digital_signature!: string | null; // Base64 encoded signature

  @Column({ type: 'text', nullable: true })
  device_object_carrying!: string | null; // Laptop, Arms, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  qr_code!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  wifi_password!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  qr_code_type!: string | null; // Single Entry/Exit, Multiple Entry/Exit (for VIP)

  @Column({ type: 'int', nullable: true })
  max_visits_allowed!: number | null;

  @Column({ type: 'int', default: 0 })
  visit_count!: number;

  @Column({ type: 'timestamp', nullable: true })
  expected_date_time!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  assigned_room_id!: string | null; // Connected to SAMMILAN

  @Column({ type: 'boolean', default: false })
  food_arrangements!: boolean;

  @Column({ type: 'text', nullable: true })
  escort_bouquet_options!: string | null; // JSON array

  @Column({ type: 'text', nullable: true })
  airport_cab_pickup!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vehicle_number!: string | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: string; // PENDING, APPROVED, REJECTED, CHECKED_IN, CHECKED_OUT, ARCHIVED

  @Column({ type: 'text', nullable: true })
  group_visitors!: string | null; // JSON array for bulk registration

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'visiting_user' })
  visitingUser: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @ManyToOne(() => Building, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @ManyToOne(() => Floor, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;
}

