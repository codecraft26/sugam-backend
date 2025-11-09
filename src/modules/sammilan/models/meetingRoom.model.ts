// Meeting room model (TypeORM entity)
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from '../../../core/tenancy/tenant.model';
import { Building } from '../../../core/orgs/building.model';
import { Floor } from '../../../core/orgs/floor.model';
import { Meeting } from './meeting.model';

@Entity('meeting_rooms')
export class MeetingRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Column({ type: 'uuid', nullable: true })
  building_id: string;

  @Column({ type: 'uuid', nullable: true })
  floor_id: string;

  @Column({ type: 'varchar', length: 50, default: 'CONFERENCE' })
  room_type!: string; // VISITOR, CONFERENCE, MANAGER, BOARD, DIRECTOR_BOARD, LOUNGE

  @Column({ type: 'text', nullable: true })
  amenities!: string | null; // JSON array

  @Column({ type: 'varchar', length: 100, nullable: true })
  iot_device_id!: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_frozen!: boolean; // For room freezing

  @Column({ type: 'text', nullable: true })
  freeze_reason!: string | null;

  @Column({ type: 'boolean', default: false })
  is_hidden_from_employees!: boolean; // For director-only rooms

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Building, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @ManyToOne(() => Floor, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;

  @OneToMany(() => Meeting, (meeting) => meeting.room)
  meetings: Meeting[];
}

