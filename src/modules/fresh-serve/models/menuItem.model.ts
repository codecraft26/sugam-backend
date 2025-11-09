// Menu item model (TypeORM entity)
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
import { FoodOrder } from './foodOrder.model';
import { MenuCategory } from './menuCategory.model';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id!: string | null;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50 })
  category!: string; // Breakfast, Lunch, Snacks, Dinner

  @Column({ type: 'uuid', nullable: true })
  menu_category_id!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price!: number | null;

  @Column({ type: 'varchar', length: 20, default: 'AVAILABLE' })
  status!: string; // AVAILABLE, OUT_OF_STOCK

  @Column({ type: 'time', nullable: true })
  menu_timing_start!: string | null;

  @Column({ type: 'time', nullable: true })
  menu_timing_end!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  item_photo_url!: string | null;

  @Column({ type: 'boolean', default: false })
  requires_acknowledgment!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'BOTH' })
  acknowledgment_type!: string; // CHECK_IN, DIGITAL_SIGNATURE, BOTH

  @Column({ type: 'boolean', default: false })
  recurring_order_enabled!: boolean;

  @Column({ type: 'int', nullable: true })
  max_recurring_orders!: number | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at!: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant | null;

  @ManyToOne(() => MenuCategory, (category) => category.menuItems, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'menu_category_id' })
  menuCategory!: MenuCategory | null;

  @OneToMany(() => FoodOrder, (order) => order.menuItem)
  orders!: FoodOrder[];
}

