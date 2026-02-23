import { Knex } from 'knex';
import { AnonymizationPlan, AnonymizationResult } from './types';
import { Anonymizer } from './anonymizer';

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
