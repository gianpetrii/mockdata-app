import { Knex } from 'knex';
import knex from 'knex';
import { AnonymizationPlan, AnonymizationResult } from './types';
import { Anonymizer } from './anonymizer';
import { DatabaseIntrospector } from '@/lib/db/introspector';

interface TargetDbConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

export class AnonymizationExecutor {
  /**
   * Execute anonymization plan on database
   */
  static async execute(
    db: Knex,
    plan: AnonymizationPlan,
    dryRun: boolean = false
  ): Promise<AnonymizationResult> {
    const errors: string[] = [];
    let rowsProcessed = 0;
    let columnsAnonymized = 0;
    let sqlStatements: string[] = [];

    try {
      if (!dryRun) {
        await db.raw('BEGIN');
      }

      for (const tablePlan of plan.tables) {
        try {
          const result = await this.anonymizeTable(db, tablePlan, dryRun);
          rowsProcessed += result.rowsProcessed;
          columnsAnonymized += result.columnsAnonymized;
          
          if (result.sql) {
            sqlStatements.push(result.sql);
          }
        } catch (error) {
          errors.push(`Error in table ${tablePlan.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (!dryRun && errors.length === 0) {
        await db.raw('COMMIT');
      } else if (!dryRun) {
        await db.raw('ROLLBACK');
      }

      return {
        success: errors.length === 0,
        tablesProcessed: plan.tables.length,
        rowsProcessed,
        columnsAnonymized,
        sql: sqlStatements.join('\n\n'),
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      if (!dryRun) {
        await db.raw('ROLLBACK');
      }
      throw error;
    }
  }

  private static async anonymizeTable(
    db: Knex,
    tablePlan: any,
    dryRun: boolean
  ): Promise<{ rowsProcessed: number; columnsAnonymized: number; sql?: string }> {
    const anonymizer = new Anonymizer();
    const batchSize = 100;
    let offset = 0;
    let rowsProcessed = 0;
    let sqlStatements: string[] = [];

    sqlStatements.push(`-- Anonymize ${tablePlan.tableName}`);

    while (true) {
      const rows = await db(tablePlan.tableName)
        .select('*')
        .limit(batchSize)
        .offset(offset);

      if (rows.length === 0) break;

      for (const row of rows) {
        const updates: Record<string, any> = {};

        for (const rule of tablePlan.rules) {
          if (rule.strategy === 'keep') continue;
          
          const originalValue = row[rule.columnName];
          const anonymizedValue = anonymizer.anonymizeValue(originalValue, rule, row.id);
          updates[rule.columnName] = anonymizedValue;
        }

        if (Object.keys(updates).length > 0) {
          if (!dryRun) {
            await db(tablePlan.tableName)
              .where('id', row.id)
              .update(updates);
          }

          const updateSQL = this.buildUpdateSQL(tablePlan.tableName, updates, row.id);
          sqlStatements.push(updateSQL);
        }
      }

      rowsProcessed += rows.length;
      offset += batchSize;

      if (rows.length < batchSize) break;
    }

    return {
      rowsProcessed,
      columnsAnonymized: tablePlan.rules.filter((r: any) => r.strategy !== 'keep').length,
      sql: sqlStatements.join('\n'),
    };
  }

  private static buildUpdateSQL(
    tableName: string,
    updates: Record<string, any>,
    id: any
  ): string {
    const setClauses = Object.entries(updates).map(([col, val]) => {
      return `${col} = ${this.formatSQLValue(val)}`;
    });

    return `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ${this.formatSQLValue(id)};`;
  }

  /**
   * Execute Safe Clone: Create new database with anonymized data
   */
  static async executeClone(
    sourceDb: Knex,
    targetConfig: TargetDbConfig,
    plan: AnonymizationPlan
  ): Promise<AnonymizationResult> {
    let targetDb: Knex | null = null;
    const errors: string[] = [];
    let rowsProcessed = 0;
    let columnsAnonymized = 0;
    let sqlStatements: string[] = [];

    try {
      targetDb = knex({
        client: 'pg',
        connection: {
          host: targetConfig.host,
          port: parseInt(targetConfig.port),
          database: targetConfig.database,
          user: targetConfig.user,
          password: targetConfig.password,
        },
      });

      await targetDb.raw('SELECT 1');

      sqlStatements.push('-- Safe Clone: Anonymized Database Copy');
      sqlStatements.push('-- Target: ' + targetConfig.database);
      sqlStatements.push('');

      const introspector = new DatabaseIntrospector(sourceDb, 'postgres');
      const schema = await introspector.getSchema();

      await targetDb.raw('BEGIN');

      for (const table of schema.tables) {
        const ddl = await this.generateTableDDL(sourceDb, table.name);
        sqlStatements.push(ddl);
        
        await targetDb.raw(ddl);
      }

      for (const tablePlan of plan.tables) {
        try {
          const result = await this.cloneAndAnonymizeTable(sourceDb, targetDb, tablePlan);
          rowsProcessed += result.rowsProcessed;
          columnsAnonymized += result.columnsAnonymized;
          
          if (result.sql) {
            sqlStatements.push(result.sql);
          }
        } catch (error) {
          errors.push(`Error cloning table ${tablePlan.tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      for (const table of schema.tables) {
        if (!plan.tables.find(t => t.tableName === table.name)) {
          const result = await this.copyTableData(sourceDb, targetDb, table.name);
          rowsProcessed += result.rowsProcessed;
          sqlStatements.push(result.sql);
        }
      }

      if (errors.length === 0) {
        await targetDb.raw('COMMIT');
      } else {
        await targetDb.raw('ROLLBACK');
      }

      return {
        success: errors.length === 0,
        tablesProcessed: schema.tables.length,
        rowsProcessed,
        columnsAnonymized,
        sql: sqlStatements.join('\n\n'),
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      if (targetDb) {
        try {
          await targetDb.raw('ROLLBACK');
        } catch (e) {}
      }
      throw error;
    } finally {
      if (targetDb) {
        await targetDb.destroy();
      }
    }
  }

  private static async generateTableDDL(db: Knex, tableName: string): Promise<string> {
    const columnsResult = await db.raw(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = ? AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);

    const columns = columnsResult.rows.map((col: any) => {
      let def = `  ${col.column_name} ${col.data_type}`;
      
      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`;
      }
      
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      
      return def;
    });

    const pkResult = await db.raw(`
      SELECT string_agg(quote_ident(column_name), ', ') as pk_columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = ? AND tc.constraint_type = 'PRIMARY KEY'
      GROUP BY tc.constraint_name
    `, [tableName]);

    if (pkResult.rows[0]?.pk_columns) {
      columns.push(`  PRIMARY KEY (${pkResult.rows[0].pk_columns})`);
    }

    let ddl = `CREATE TABLE ${tableName} (\n${columns.join(',\n')}\n);`;

    const fkResult = await db.raw(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = ?
      AND tc.table_schema = 'public'
    `, [tableName]);

    for (const fk of fkResult.rows) {
      ddl += `\nALTER TABLE ${tableName} ADD CONSTRAINT ${fk.constraint_name} `;
      ddl += `FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.referenced_table}(${fk.referenced_column})`;
      
      if (fk.delete_rule && fk.delete_rule !== 'NO ACTION') {
        ddl += ` ON DELETE ${fk.delete_rule}`;
      }
      if (fk.update_rule && fk.update_rule !== 'NO ACTION') {
        ddl += ` ON UPDATE ${fk.update_rule}`;
      }
      
      ddl += ';';
    }

    return ddl;
  }

  private static async cloneAndAnonymizeTable(
    sourceDb: Knex,
    targetDb: Knex,
    tablePlan: any
  ): Promise<{ rowsProcessed: number; columnsAnonymized: number; sql: string }> {
    const anonymizer = new Anonymizer();
    const batchSize = 100;
    let offset = 0;
    let rowsProcessed = 0;
    let sqlStatements: string[] = [];

    sqlStatements.push(`-- Clone and anonymize ${tablePlan.tableName}`);

    while (true) {
      const rows = await sourceDb(tablePlan.tableName)
        .select('*')
        .limit(batchSize)
        .offset(offset);

      if (rows.length === 0) break;

      for (const row of rows) {
        const anonymizedRow = { ...row };

        for (const rule of tablePlan.rules) {
          if (rule.strategy === 'keep') continue;
          
          const originalValue = row[rule.columnName];
          anonymizedRow[rule.columnName] = anonymizer.anonymizeValue(originalValue, rule, row.id);
        }

        await targetDb(tablePlan.tableName).insert(anonymizedRow);

        const insertSQL = this.buildInsertSQL(tablePlan.tableName, anonymizedRow);
        sqlStatements.push(insertSQL);
      }

      rowsProcessed += rows.length;
      offset += batchSize;

      if (rows.length < batchSize) break;
    }

    return {
      rowsProcessed,
      columnsAnonymized: tablePlan.rules.filter((r: any) => r.strategy !== 'keep').length,
      sql: sqlStatements.join('\n'),
    };
  }

  private static async copyTableData(
    sourceDb: Knex,
    targetDb: Knex,
    tableName: string
  ): Promise<{ rowsProcessed: number; sql: string }> {
    const batchSize = 100;
    let offset = 0;
    let rowsProcessed = 0;
    let sqlStatements: string[] = [];

    sqlStatements.push(`-- Copy ${tableName} (no anonymization)`);

    while (true) {
      const rows = await sourceDb(tableName)
        .select('*')
        .limit(batchSize)
        .offset(offset);

      if (rows.length === 0) break;

      if (rows.length > 0) {
        await targetDb(tableName).insert(rows);

        for (const row of rows) {
          const insertSQL = this.buildInsertSQL(tableName, row);
          sqlStatements.push(insertSQL);
        }
      }

      rowsProcessed += rows.length;
      offset += batchSize;

      if (rows.length < batchSize) break;
    }

    return {
      rowsProcessed,
      sql: sqlStatements.join('\n'),
    };
  }

  private static buildInsertSQL(tableName: string, row: Record<string, any>): string {
    const columns = Object.keys(row);
    const values = Object.values(row).map(v => this.formatSQLValue(v));
    
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  }

  private static formatSQLValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    return String(value);
  }
}
