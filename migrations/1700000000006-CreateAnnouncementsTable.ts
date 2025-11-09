import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAnnouncementsTable1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if announcements table exists
    const announcementsTableExists = await queryRunner.hasTable('announcements');
    
    if (announcementsTableExists) {
      console.log('Announcements table already exists. Skipping migration.');
      return;
    }

    // Create announcements table
    await queryRunner.createTable(
      new Table({
        name: 'announcements',
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
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'department',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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

    // Create foreign key from announcements to tenants
    const tenantsTableExists = await queryRunner.hasTable('tenants');
    if (tenantsTableExists) {
      await queryRunner.createForeignKey(
        'announcements',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'tenants',
          onDelete: 'CASCADE',
        })
      );
    }

    // Create foreign key from announcements to admins (created_by)
    const adminsTableExists = await queryRunner.hasTable('admins');
    if (adminsTableExists) {
      await queryRunner.createForeignKey(
        'announcements',
        new TableForeignKey({
          columnNames: ['created_by'],
          referencedColumnNames: ['id'],
          referencedTableName: 'admins',
          onDelete: 'SET NULL',
        })
      );
    }

    // Create indexes
    await queryRunner.createIndex(
      'announcements',
      new TableIndex({
        name: 'IDX_announcements_tenant_id',
        columnNames: ['tenant_id'],
      })
    );

    await queryRunner.createIndex(
      'announcements',
      new TableIndex({
        name: 'IDX_announcements_department',
        columnNames: ['department'],
      })
    );

    await queryRunner.createIndex(
      'announcements',
      new TableIndex({
        name: 'IDX_announcements_is_active',
        columnNames: ['is_active'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const announcementsTable = await queryRunner.getTable('announcements');
    
    if (!announcementsTable) {
      return;
    }

    // Drop foreign keys
    const foreignKeys = announcementsTable.foreignKeys;
    for (const fk of foreignKeys) {
      await queryRunner.dropForeignKey('announcements', fk);
    }

    // Drop indexes
    const indexes = announcementsTable.indices;
    for (const index of indexes) {
      await queryRunner.dropIndex('announcements', index);
    }

    // Drop table
    await queryRunner.dropTable('announcements');
  }
}

