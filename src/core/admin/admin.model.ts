// Admin model (TypeORM entity) - For both Admin and Superadmin
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
import { AdminAssignment } from './adminAssignment.model';
import { AdminOnboardingRequest } from './adminOnboardingRequest.model';
import { AdminPermission } from './adminPermission.model';
import { User } from '../users/user.model';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string; // Required - admins belong to a tenant

  @Column({ type: 'uuid', nullable: true })
  user_id!: string | null; // Optional link to user account (if admin is also a regular user)

  @Column({ type: 'varchar', length: 120, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  first_name!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  last_name!: string | null;

  @Column({ type: 'text' })
  password_hash!: string;

  @Column({ type: 'varchar', length: 20, default: 'ADMIN' })
  admin_level!: string; // 'ADMIN' or 'SUPER_ADMIN'

  @Column({ type: 'boolean', default: false })
  is_super_admin!: boolean; // true for superadmin, false for regular admin

  @Column({ type: 'varchar', length: 50, nullable: true })
  module_scope!: string | null; // Module scope for regular admins (null for superadmin)

  @Column({ type: 'uuid', nullable: true })
  created_by!: string | null; // Platform admin (for superadmin) or Superadmin (for admin)

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.admins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null; // Optional link to user account

  @ManyToOne(() => Admin, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator!: Admin | null; // Self-referential for admin creation

  @OneToMany(() => AdminAssignment, (assignment) => assignment.admin)
  adminAssignments!: AdminAssignment[];

  @OneToMany(() => AdminOnboardingRequest, (request) => request.admin)
  adminOnboardingRequests!: AdminOnboardingRequest[];

  @OneToMany(() => AdminPermission, (permission) => permission.admin)
  adminPermissions!: AdminPermission[];

  @OneToMany(() => User, (user) => user.approver)
  approvedUsers!: User[]; // Users approved by this admin
}

