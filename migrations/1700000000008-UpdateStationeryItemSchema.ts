// Migration: Update StationeryItem schema - Add category and status fields
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateStationeryItemSchema1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if stationery_items table exists
    const table = await queryRunner.getTable('stationery_items');
    if (!table) {
      console.log('stationery_items table does not exist, skipping migration');
      return;
    }

    // Add category column if it doesn't exist
    const categoryColumn = table.findColumnByName('category');
    if (!categoryColumn) {
      await queryRunner.addColumn(
        'stationery_items',
        new TableColumn({
          name: 'category',
          type: 'varchar',
          length: '50',
          isNullable: false,
          default: "'Writing'", // Default category
        })
      );
    }

    // Add status column if it doesn't exist
    const statusColumn = table.findColumnByName('status');
    if (!statusColumn) {
      await queryRunner.addColumn(
        'stationery_items',
        new TableColumn({
          name: 'status',
          type: 'varchar',
          length: '20',
          isNullable: false,
          default: "'IN_STOCK'",
        })
      );

      // Update existing records: set status based on available_qty
      await queryRunner.query(`
        UPDATE stationery_items
        SET status = CASE
          WHEN available_qty > 0 THEN 'IN_STOCK'
          ELSE 'OUT_OF_STOCK'
        END
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stationery_items');
    if (!table) {
      return;
    }

    // Remove status column if it exists
    const statusColumn = table.findColumnByName('status');
    if (statusColumn) {
      await queryRunner.dropColumn('stationery_items', 'status');
    }

    // Remove category column if it exists
    const categoryColumn = table.findColumnByName('category');
    if (categoryColumn) {
      await queryRunner.dropColumn('stationery_items', 'category');
    }
  }
}

