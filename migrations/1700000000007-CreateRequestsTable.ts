import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRequestsTable1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if requests table exists
    const requestsTableExists = await queryRunner.hasTable('requests');
    
    if (requestsTableExists) {
      console.log('Requests table already exists. Skipping migration.');
      return;
    }

    // Create requests table
    await queryRunner.createTable(
      new Table({
        name: 'requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'employee_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'employee_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'module_scope',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'company',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'department',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          {
            name: 'admin_comments',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
      }),
      true
    );

    // Create foreign key from requests to tenants
    const tenantsTableExists = await queryRunner.hasTable('tenants');
    if (tenantsTableExists) {
      await queryRunner.createForeignKey(
        'requests',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'tenants',
          onDelete: 'CASCADE',
        })
      );
    }

    // Create foreign key from requests to users
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      await queryRunner.createForeignKey(
        'requests',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        })
      );
    }

    // Create foreign key from requests to admins (reviewed_by)
    const adminsTableExists = await queryRunner.hasTable('admins');
    if (adminsTableExists) {
      await queryRunner.createForeignKey(
        'requests',
        new TableForeignKey({
          columnNames: ['reviewed_by'],
          referencedColumnNames: ['id'],
          referencedTableName: 'admins',
          onDelete: 'SET NULL',
        })
      );
    }

    // Create indexes
    await queryRunner.createIndex(
      'requests',
      new TableIndex({
        name: 'IDX_requests_tenant_id',
        columnNames: ['tenant_id'],
      })
    );

    await queryRunner.createIndex(
      'requests',
      new TableIndex({
        name: 'IDX_requests_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'requests',
      new TableIndex({
        name: 'IDX_requests_status',
        columnNames: ['status'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const requestsTable = await queryRunner.getTable('requests');
    
    if (!requestsTable) {
      return;
    }

    // Drop foreign keys
    const foreignKeys = requestsTable.foreignKeys;
    for (const fk of foreignKeys) {
      await queryRunner.dropForeignKey('requests', fk);
    }

    // Drop indexes
    const indexes = requestsTable.indices;
    for (const index of indexes) {
      await queryRunner.dropIndex('requests', index);
    }

    // Drop table
    await queryRunner.dropTable('requests');
  }
}

