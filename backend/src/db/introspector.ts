import { Knex } from 'knex';
import { DatabaseType, TableInfo, ColumnInfo, ForeignKey, DatabaseSchema } from './types';

export class DatabaseIntrospector {
  constructor(
    private knex: Knex,
    private dbType: DatabaseType
  ) {}

  async getSchema(): Promise<DatabaseSchema> {
    const tableNames = await this.getTableNames();
    const tables: TableInfo[] = [];

    for (const tableName of tableNames) {
      const columns = await this.getColumns(tableName);
      const foreignKeys = await this.getForeignKeys(tableName);
      const primaryKeys = await this.getPrimaryKeys(tableName);
      const uniqueConstraints = await this.getUniqueConstraints(tableName);
      const checkConstraints = await this.getCheckConstraints(tableName);

      tables.push({
        name: tableName,
        columns,
        foreignKeys,
        primaryKeys,
        uniqueConstraints,
        checkConstraints,
      });
    }

    return { tables };
  }

  private async getTableNames(): Promise<string[]> {
    if (this.dbType === 'postgres') {
      const result = await this.knex.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      return result.rows.map((row: any) => row.table_name);
    } else {
      // MySQL
      const result = await this.knex.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE'
      `);
      return result[0].map((row: any) => row.table_name);
    }
  }

  private async getColumns(tableName: string): Promise<ColumnInfo[]> {
    if (this.dbType === 'postgres') {
      const result = await this.knex.raw(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = ?
        ORDER BY ordinal_position
      `, [tableName]);

      const primaryKeys = await this.getPrimaryKeys(tableName);

      return result.rows.map((row: any) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        defaultValue: row.column_default,
        isPrimaryKey: primaryKeys.includes(row.column_name),
        isUnique: false, // Will be updated later
        maxLength: row.character_maximum_length,
      }));
    } else {
      // MySQL
      const result = await this.knex.raw(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          column_key
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = ?
        ORDER BY ordinal_position
      `, [tableName]);

      return result[0].map((row: any) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        defaultValue: row.column_default,
        isPrimaryKey: row.column_key === 'PRI',
        isUnique: row.column_key === 'UNI',
        maxLength: row.character_maximum_length,
      }));
    }
  }

  private async getForeignKeys(tableName: string): Promise<ForeignKey[]> {
    if (this.dbType === 'postgres') {
      const result = await this.knex.raw(`
        SELECT
          kcu.column_name,
          ccu.table_name AS referenced_table,
          ccu.column_name AS referenced_column,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ?
        AND tc.table_schema = 'public'
      `, [tableName]);

      return result.rows.map((row: any) => ({
        columnName: row.column_name,
        referencedTable: row.referenced_table,
        referencedColumn: row.referenced_column,
        onDelete: row.delete_rule,
        onUpdate: row.update_rule,
      }));
    } else {
      // MySQL
      const result = await this.knex.raw(`
        SELECT
          column_name,
          referenced_table_name,
          referenced_column_name,
          delete_rule,
          update_rule
        FROM information_schema.key_column_usage
        WHERE table_schema = DATABASE()
        AND table_name = ?
        AND referenced_table_name IS NOT NULL
      `, [tableName]);

      return result[0].map((row: any) => ({
        columnName: row.column_name,
        referencedTable: row.referenced_table_name,
        referencedColumn: row.referenced_column_name,
        onDelete: row.delete_rule,
        onUpdate: row.update_rule,
      }));
    }
  }

  private async getPrimaryKeys(tableName: string): Promise<string[]> {
    if (this.dbType === 'postgres') {
      const result = await this.knex.raw(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = ?::regclass
        AND i.indisprimary
      `, [tableName]);

      return result.rows.map((row: any) => row.attname);
    } else {
      // MySQL
      const result = await this.knex.raw(`
        SELECT column_name
        FROM information_schema.key_column_usage
        WHERE table_schema = DATABASE()
        AND table_name = ?
        AND constraint_name = 'PRIMARY'
      `, [tableName]);

      return result[0].map((row: any) => row.column_name);
    }
  }

  private async getUniqueConstraints(tableName: string): Promise<string[][]> {
    // Simplified for MVP - returns empty array
    // Can be enhanced to return actual unique constraints
    return [];
  }

  private async getCheckConstraints(tableName: string): Promise<string[]> {
    // Simplified for MVP - returns empty array
    // Can be enhanced to return actual check constraints
    return [];
  }
}
