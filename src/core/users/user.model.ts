// User model (TypeORM entity)
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from '../tenancy/tenant.model';
import { Organization } from '../orgs/organization.model';
import { Building } from '../orgs/building.model';
import { Floor } from '../orgs/floor.model';
import { Role } from '../roles/role.model';
import { Admin } from '../admin/admin.model';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string | null; // Nullable for platform-level super-superadmin

  @Column({ type: 'uuid', nullable: true })
  organization_id: string;

  @Column({ type: 'uuid', nullable: true })
  building_id: string;

  @Column({ type: 'uuid', nullable: true })
  floor_id: string;

  @Column({ type: 'uuid', nullable: true })
  role_id: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  first_name: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  last_name: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  employee_id!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employee_grade!: string | null; // For grade-based access

  @Column({ type: 'varchar', length: 255, nullable: true })
  office_location!: string | null; // Office location/address

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text' })
  password_hash: string;

  @Column({ type: 'varchar', length: 50, default: 'CORE' })
  module_scope: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean; // User verification status (requires superadmin approval)

  @Column({ type: 'uuid', nullable: true })
  created_by!: string | null; // Admin who created this user (regular users only, not admins)

  @Column({ type: 'uuid', nullable: true })
  approved_by!: string | null; // Admin ID who approved this user (superadmin from admins table)

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @ManyToOne(() => Organization, (org) => org.users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => Building, (building) => building.users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @ManyToOne(() => Floor, (floor) => floor.users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: Admin | null; // Admin (superadmin) who approved this user
}
