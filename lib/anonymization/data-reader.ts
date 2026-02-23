import { Knex } from 'knex';
import { TableInfo } from '@/lib/api';
import { DataSample } from './types';
import { EnhancedPIIDetector, PIIType } from '@/lib/db/pii-detector-enhanced';

export class DataReader {
  /**
   * Read sample data from tables to analyze PII in actual values
   */
  static async readSamples(
    db: Knex,
    tables: TableInfo[],
    sampleSize: number = 10
  ): Promise<DataSample[]> {
    const samples: DataSample[] = [];

    for (const table of tables) {
      const piiColumns = table.columns.filter(col => {
        const detection = EnhancedPIIDetector.detectPIISync([col])[0];
        return detection.detectedType !== 'none';
      });

      for (const column of piiColumns) {
        try {
          const rows = await db(table.name)
            .select(column.name)
            .whereNotNull(column.name)
            .limit(sampleSize);

          const values = rows.map(row => row[column.name]);
          
          if (values.length > 0) {
            const detection = EnhancedPIIDetector.detectPIISync([column])[0];
            const suggestedStrategy = this.suggestStrategy(detection.detectedType, values);

            samples.push({
              tableName: table.name,
              columnName: column.name,
              sampleValues: values,
              detectedPII: detection.detectedType,
              suggestedStrategy,
            });
          }
        } catch (error) {
          console.error(`Error reading samples from ${table.name}.${column.name}:`, error);
        }
      }
    }

    return samples;
  }

  /**
   * Suggest anonymization strategy based on actual data values
   */
  private static suggestStrategy(piiType: PIIType, sampleValues: any[]): any {
    const strategies = EnhancedPIIDetector.getAnonymizationStrategy(piiType);
    
    // Analyze actual values to refine suggestion
    if (piiType === 'email') {
      const hasCompanyEmails = sampleValues.some(v => 
        typeof v === 'string' && v.includes('@company')
      );
      return hasCompanyEmails ? 'mask' : 'fake';
    }

    if (piiType === 'phone') {
      const hasInternational = sampleValues.some(v =>
        typeof v === 'string' && v.startsWith('+')
      );
      return hasInternational ? 'mask' : 'fake';
    }

    // Default to first suggested strategy
    return strategies[0];
  }

  /**
   * Get row count for a table
   */
  static async getRowCount(db: Knex, tableName: string): Promise<number> {
    const result = await db(tableName).count('* as count').first();
    return parseInt(result?.count as string) || 0;
  }

  /**
   * Read sample rows from a table (for preview)
   */
  static async readSampleRows(
    db: Knex,
    tableName: string,
    limit: number = 5
  ): Promise<Record<string, any>[]> {
    return await db(tableName).select('*').limit(limit);
  }
}
