import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOfficeLocationToUsers1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if users table exists
    const usersTable = await queryRunner.getTable('users');
    
    if (!usersTable) {
      console.log('Users table does not exist. Skipping migration.');
      return;
    }

    // Add office_location column if it doesn't exist
    const officeLocationColumn = usersTable.findColumnByName('office_location');
    if (!officeLocationColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'office_location',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    
    if (!usersTable) {
      return;
    }

    // Remove office_location column if it exists
    const officeLocationColumn = usersTable.findColumnByName('office_location');
    if (officeLocationColumn) {
      await queryRunner.dropColumn('users', 'office_location');
    }
  }
}

