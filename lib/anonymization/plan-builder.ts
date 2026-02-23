import { Knex } from 'knex';
import { DatabaseSchema, TableInfo } from '@/lib/api';
import { AnonymizationPlan, TableAnonymizationPlan, ColumnAnonymizationRule, AnonymizationStrategy } from './types';
import { EnhancedPIIDetector, PIIType } from '@/lib/db/pii-detector-enhanced';
import { DataReader } from './data-reader';

export class AnonymizationPlanBuilder {
  /**
   * Build anonymization plan based on detected PII
   */
  static async buildPlan(
    db: Knex,
    schema: DatabaseSchema,
    options?: {
      autoSelectStrategies?: boolean;
      includeSamples?: boolean;
    }
  ): Promise<AnonymizationPlan> {
    const tablePlans: TableAnonymizationPlan[] = [];
    let totalRows = 0;

    for (const table of schema.tables) {
      const piiColumns = table.columns.filter(col => {
        const detection = EnhancedPIIDetector.detectPIISync([col])[0];
        return detection.detectedType !== 'none';
      });

      if (piiColumns.length === 0) continue;

      const rowCount = await DataReader.getRowCount(db, table.name);
      totalRows += rowCount;

      const rules: ColumnAnonymizationRule[] = piiColumns.map(col => {
        const detection = EnhancedPIIDetector.detectPIISync([col])[0];
        const strategies = EnhancedPIIDetector.getAnonymizationStrategy(detection.detectedType);
        
        return {
          columnName: col.name,
          piiType: detection.detectedType,
          strategy: (options?.autoSelectStrategies ? strategies[0] : 'mask') as AnonymizationStrategy,
        };
      });

      const tablePlan: TableAnonymizationPlan = {
        tableName: table.name,
        rules,
        rowsToProcess: rowCount,
      };

      if (options?.includeSamples) {
        tablePlan.sampleBefore = await DataReader.readSampleRows(db, table.name, 3);
      }

      tablePlans.push(tablePlan);
    }

    return {
      tables: tablePlans,
      totalRows,
      description: `Anonymize ${tablePlans.length} tables with ${totalRows} total rows`,
    };
  }

  /**
   * Build plan from user's natural language request using LLM
   */
  static async buildPlanFromPrompt(
    prompt: string,
    schema: DatabaseSchema,
    db: Knex,
    apiKey: string
  ): Promise<AnonymizationPlan> {
    const systemPrompt = this.buildSystemPrompt(schema);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'MockData App',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from LLM');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    // Enrich with row counts
    for (const tablePlan of parsed.tables) {
      const rowCount = await DataReader.getRowCount(db, tablePlan.tableName);
      tablePlan.rowsToProcess = rowCount;
    }

    parsed.totalRows = parsed.tables.reduce((sum: number, t: any) => sum + t.rowsToProcess, 0);

    return parsed;
  }

  private static buildSystemPrompt(schema: DatabaseSchema): string {
    return `You are a data anonymization planner. Convert user requests into structured anonymization plans.

DATABASE SCHEMA:
${JSON.stringify(schema, null, 2)}

Your task is to create an AnonymizationPlan with this structure:

{
  "description": "Brief summary of anonymization",
  "tables": [
    {
      "tableName": "users",
      "rules": [
        {
          "columnName": "email",
          "piiType": "email",
          "strategy": "mask",
          "options": {
            "maskChar": "*",
            "visibleChars": 2
          }
        },
        {
          "columnName": "ssn",
          "piiType": "ssn",
          "strategy": "tokenize"
        },
        {
          "columnName": "salary",
          "piiType": "salary",
          "strategy": "noise",
          "options": {
            "noisePercentage": 0.1
          }
        }
      ]
    }
  ]
}

AVAILABLE STRATEGIES:
- "mask": Partial masking (john@email.com → j***@email.com)
- "tokenize": Consistent token (john@email.com → TOKEN_A123)
- "fake": Replace with realistic fake data
- "hash": One-way hash (for passwords)
- "remove": Set to NULL
- "generalize": Reduce precision (1990-05-15 → 1990-01-01)
- "noise": Add random noise (45.123 → 45.456)
- "shuffle": Shuffle values between rows
- "pseudonymize": Consistent fake identity per record
- "keep": Keep original

RULES:
1. Choose appropriate strategy based on PII type and use case
2. Use "mask" for emails/phones when format matters
3. Use "tokenize" for IDs that need consistency
4. Use "fake" for names/addresses when realism matters
5. Use "remove" for highly sensitive data (biometrics, passwords)
6. Use "generalize" for dates/locations to reduce precision
7. Use "noise" for numeric data (salary, coordinates)

Output ONLY valid JSON matching the AnonymizationPlan structure.`;
  }
}
