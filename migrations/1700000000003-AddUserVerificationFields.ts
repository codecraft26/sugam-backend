import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddUserVerificationFields1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if users table exists
    const usersTable = await queryRunner.getTable('users');
    
    if (!usersTable) {
      console.log('Users table does not exist. Skipping migration.');
      return;
    }

    // Add is_verified column if it doesn't exist
    const isVerifiedColumn = usersTable.findColumnByName('is_verified');
    if (!isVerifiedColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'is_verified',
          type: 'boolean',
          default: false,
          isNullable: false,
        })
      );
    }

    // Add approved_by column if it doesn't exist
    const approvedByColumn = usersTable.findColumnByName('approved_by');
    if (!approvedByColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'approved_by',
          type: 'uuid',
          isNullable: true,
        })
      );
    }

    // Check if admins table exists before creating foreign key
    const adminsTable = await queryRunner.getTable('admins');
    if (adminsTable && !approvedByColumn) {
      // Check if foreign key already exists
      const usersTableForFK = await queryRunner.getTable('users');
      const foreignKeys = usersTableForFK?.foreignKeys || [];
      const fkExists = foreignKeys.some((fk: any) => fk.columnNames.includes('approved_by'));
      
      if (!fkExists) {
        await queryRunner.createForeignKey(
          'users',
          new TableForeignKey({
            columnNames: ['approved_by'],
            referencedColumnNames: ['id'],
            referencedTableName: 'admins',
            onDelete: 'SET NULL',
          })
        );
      }
    }

    // Update existing users: set is_verified to false if not already set
    // (This handles existing users that were created before this migration)
    await queryRunner.query(`
      UPDATE users 
      SET is_verified = false 
      WHERE is_verified IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await queryRunner.getTable('users');
    
    if (!usersTable) {
      return;
    }

    // Remove foreign key if it exists
    const usersTableForFK = await queryRunner.getTable('users');
    const foreignKeys = usersTableForFK?.foreignKeys || [];
    const fk = foreignKeys.find((fk: any) => fk.columnNames.includes('approved_by'));
    if (fk) {
      await queryRunner.dropForeignKey('users', fk);
    }

    // Remove columns
    const approvedByColumn = usersTable.findColumnByName('approved_by');
    if (approvedByColumn) {
      await queryRunner.dropColumn('users', 'approved_by');
    }

    const isVerifiedColumn = usersTable.findColumnByName('is_verified');
    if (isVerifiedColumn) {
      await queryRunner.dropColumn('users', 'is_verified');
    }
  }
}

