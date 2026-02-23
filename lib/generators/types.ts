// Types for data generation system

export type ConstraintRule = 
  | 'unique'
  | 'range'
  | 'pattern'
  | 'enum'
  | 'percentage'
  | 'custom'
  | 'null_percentage';

export interface GenerationConstraint {
  column: string;
  rule: ConstraintRule;
  value: any;
  description?: string;
}

export interface RelationshipRule {
  foreignTable: string;
  foreignColumn: string;
  localColumn: string;
  strategy: 'existing' | 'generate' | 'random_existing';
  distribution?: {
    min: number;
    max: number;
  };
}

export interface TableGenerationSpec {
  name: string;
  count: number;
  constraints: GenerationConstraint[];
  relationships: RelationshipRule[];
  description?: string;
}

export interface GenerationPlan {
  tables: TableGenerationSpec[];
  strategy: 'insert' | 'upsert' | 'truncate_insert';
  description: string;
  estimatedRows: number;
}

export interface GenerationResult {
  sql: string;
  rowsGenerated: number;
  tables: {
    name: string;
    rows: number;
  }[];
  warnings?: string[];
}

export interface GenerationPreview {
  plan: GenerationPlan;
  sampleData: {
    tableName: string;
    rows: Record<string, any>[];
  }[];
  sqlPreview: string;
}
