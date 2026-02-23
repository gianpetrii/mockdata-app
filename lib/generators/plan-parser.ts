import { DatabaseSchema } from '@/lib/api';
import { GenerationPlan, TableGenerationSpec, GenerationConstraint } from './types';

export class PlanParser {
  /**
   * Uses LLM to convert user's natural language request into a structured GenerationPlan
   */
  static async parseUserRequest(
    userPrompt: string,
    schema: DatabaseSchema,
    apiKey: string
  ): Promise<GenerationPlan> {
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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
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

    // Extract JSON from content (handle models that include thinking tags)
    const jsonContent = this.extractJSON(content);
    const parsed = JSON.parse(jsonContent);
    return this.validateAndNormalizePlan(parsed, schema);
  }

  private static buildSystemPrompt(schema: DatabaseSchema): string {
    return `You are a data generation planner. Convert user requests into structured generation plans.

DATABASE SCHEMA:
${JSON.stringify(schema, null, 2)}

Your task is to analyze the user's request and output a JSON GenerationPlan with this structure:

{
  "description": "Brief summary of what will be generated",
  "strategy": "insert" | "upsert" | "truncate_insert",
  "tables": [
    {
      "name": "table_name",
      "count": 100,
      "description": "What this table generation does",
      "constraints": [
        {
          "column": "column_name",
          "rule": "percentage",
          "value": { "active": 0.8, "inactive": 0.2 },
          "description": "80% active, 20% inactive"
        },
        {
          "column": "age",
          "rule": "range",
          "value": { "min": 25, "max": 45 }
        },
        {
          "column": "email",
          "rule": "pattern",
          "value": "@company.com"
        },
        {
          "column": "status",
          "rule": "enum",
          "value": ["pending", "active", "cancelled"]
        },
        {
          "column": "optional_field",
          "rule": "null_percentage",
          "value": 0.3
        }
      ],
      "relationships": [
        {
          "foreignTable": "users",
          "foreignColumn": "id",
          "localColumn": "user_id",
          "strategy": "random_existing",
          "distribution": { "min": 1, "max": 5 }
        }
      ]
    }
  ],
  "estimatedRows": 150
}

RULES:
1. Respect foreign key relationships - generate parent tables first
2. Use appropriate constraint rules based on user requirements
3. Default strategy is "insert" unless user mentions truncating/replacing
4. Be smart about distributions - if user says "mostly X", use percentage rule
5. For test scenarios, create specific constraints that match the test case
6. Always include relationships array even if empty
7. Calculate estimatedRows as sum of all table counts

CONSTRAINT RULES:
- "percentage": For categorical data with distribution (value: object with percentages)
- "range": For numeric/date ranges (value: {min, max})
- "pattern": For string patterns (value: string pattern)
- "enum": For specific allowed values (value: array)
- "null_percentage": For nullable fields (value: 0.0-1.0)
- "unique": For unique values (value: true)

RELATIONSHIP STRATEGIES:
- "existing": Use only existing foreign key values
- "random_existing": Randomly distribute across existing values
- "generate": Generate new foreign records if needed

Output ONLY valid JSON matching the GenerationPlan structure. No explanations outside JSON.`;
  }

  /**
   * Extract JSON from LLM response that may include thinking tags or other content
   */
  private static extractJSON(content: string): string {
    // Try to find JSON object in the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON found, assume entire content is JSON
    return content;
  }

  private static validateAndNormalizePlan(
    plan: any,
    schema: DatabaseSchema
  ): GenerationPlan {
    if (!plan.tables || !Array.isArray(plan.tables)) {
      throw new Error('Invalid plan: tables array required');
    }

    // Validate table names exist in schema
    const schemaTableNames = schema.tables.map(t => t.name);
    for (const tableSpec of plan.tables) {
      if (!schemaTableNames.includes(tableSpec.name)) {
        throw new Error(`Table ${tableSpec.name} not found in schema`);
      }
    }

    // Ensure required fields
    return {
      description: plan.description || 'Data generation',
      strategy: plan.strategy || 'insert',
      tables: plan.tables.map((t: any) => ({
        name: t.name,
        count: t.count || 10,
        description: t.description || '',
        constraints: t.constraints || [],
        relationships: t.relationships || [],
      })),
      estimatedRows: plan.estimatedRows || plan.tables.reduce((sum: number, t: any) => sum + (t.count || 10), 0),
    };
  }
}
