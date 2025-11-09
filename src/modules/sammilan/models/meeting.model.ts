// Meeting model (TypeORM entity)
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
import { MeetingRoom } from './meetingRoom.model';

@Entity('meetings')
@Index(['tenant_id'])
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  organizer_id: string;

  @Column({ type: 'uuid', nullable: true })
  admin_id: string;

  @Column({ type: 'uuid', nullable: true })
  room_id: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  agenda: string;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'MEDIUM' })
  priority!: string; // LOW, MEDIUM, HIGH

  @Column({ type: 'text', nullable: true })
  purpose!: string | null;

  @Column({ type: 'text', nullable: true })
  amenities_requested!: string | null; // JSON array

  @Column({ type: 'int', default: 0 })
  participant_count!: number;

  @Column({ type: 'text', nullable: true })
  participants!: string | null; // JSON array of user IDs

  @Column({ type: 'boolean', default: false })
  is_recurring!: boolean;

  @Column({ type: 'text', nullable: true })
  recurring_pattern!: string | null; // JSON: frequency, days, end_date

  @Column({ type: 'boolean', default: false })
  requires_admin_approval!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  approval_status!: string | null; // PENDING, APPROVED, REJECTED

  @Column({ type: 'boolean', default: false })
  host_acknowledged!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  host_acknowledged_at!: Date | null;

  @Column({ type: 'int', default: 0 })
  buffer_time_minutes!: number;

  @Column({ type: 'boolean', default: false })
  auto_release_enabled!: boolean;

  @Column({ type: 'int', default: 0 })
  auto_release_minutes!: number;

  @Column({ type: 'boolean', default: false })
  extended!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employee_band!: string | null; // For band-based booking rules

  @Column({ type: 'text', nullable: true })
  admin_comments!: string | null; // Admin comments on booking

  @Column({ type: 'text', nullable: true })
  host_response!: string | null; // Host response to admin comments

  @Column({ type: 'boolean', default: false })
  is_guest_meeting!: boolean; // For guest/visitor meetings

  @Column({ type: 'uuid', nullable: true })
  guest_visitor_id!: string | null; // Link to visitor if guest meeting

  @Column({ type: 'boolean', default: false })
  qr_code_generated!: boolean; // QR code generation status

  @Column({ type: 'varchar', length: 255, nullable: true })
  qr_code_link!: string | null; // QR code link

  @Column({ type: 'varchar', length: 100, nullable: true })
  wifi_password!: string | null; // Temporary WiFi password

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @ManyToOne(() => MeetingRoom, (room) => room.meetings, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'room_id' })
  room: MeetingRoom;
}

