import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTodosTable1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if todos table exists
    const todosTableExists = await queryRunner.hasTable('todos');
    
    if (todosTableExists) {
      console.log('Todos table already exists. Skipping migration.');
      return;
    }

    // Create todos table
    await queryRunner.createTable(
      new Table({
        name: 'todos',
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
            name: 'is_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'due_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
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

    // Create foreign key from todos to tenants
    const tenantsTableExists = await queryRunner.hasTable('tenants');
    if (tenantsTableExists) {
      await queryRunner.createForeignKey(
        'todos',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'tenants',
          onDelete: 'CASCADE',
        })
      );
    }

    // Create foreign key from todos to users
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      await queryRunner.createForeignKey(
        'todos',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        })
      );
    }

    // Create indexes
    await queryRunner.createIndex(
      'todos',
      new TableIndex({
        name: 'IDX_todos_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'todos',
      new TableIndex({
        name: 'IDX_todos_tenant_id',
        columnNames: ['tenant_id'],
      })
    );

    await queryRunner.createIndex(
      'todos',
      new TableIndex({
        name: 'IDX_todos_is_completed',
        columnNames: ['is_completed'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const todosTable = await queryRunner.getTable('todos');
    
    if (!todosTable) {
      return;
    }

    // Drop foreign keys
    const foreignKeys = todosTable.foreignKeys;
    for (const fk of foreignKeys) {
      await queryRunner.dropForeignKey('todos', fk);
    }

    // Drop indexes
    const indexes = todosTable.indices;
    for (const index of indexes) {
      await queryRunner.dropIndex('todos', index);
    }

    // Drop table
    await queryRunner.dropTable('todos');
  }
}

