import { PIIType } from '@/lib/db/pii-detector-enhanced';

export type AnonymizationStrategy =
  | 'mask'              // Partial masking: john@email.com → j***@email.com
  | 'tokenize'          // Replace with consistent token: john@email.com → TOKEN_A123
  | 'fake'              // Replace with realistic fake data
  | 'hash'              // One-way hash (for passwords, tokens)
  | 'remove'            // Set to NULL or empty
  | 'generalize'        // Reduce precision: 1990-05-15 → 1990-01-01
  | 'noise'             // Add random noise: 45.123 → 45.456
  | 'shuffle'           // Shuffle values between rows
  | 'pseudonymize'      // Consistent fake identity per record
  | 'keep';             // Keep original value

export interface ColumnAnonymizationRule {
  columnName: string;
  piiType: PIIType;
  strategy: AnonymizationStrategy;
  options?: {
    maskChar?: string;
    visibleChars?: number;
    noisePercentage?: number;
    generalizeToYear?: boolean;
    generalizeToMonth?: boolean;
  };
}

export interface TableAnonymizationPlan {
  tableName: string;
  rules: ColumnAnonymizationRule[];
  rowsToProcess: number;
  sampleBefore?: Record<string, any>[];
  sampleAfter?: Record<string, any>[];
}

export interface AnonymizationPlan {
  tables: TableAnonymizationPlan[];
  totalRows: number;
  description: string;
}

export interface AnonymizationResult {
  success: boolean;
  tablesProcessed: number;
  rowsProcessed: number;
  columnsAnonymized: number;
  sql?: string;
  errors?: string[];
}

export interface DataSample {
  tableName: string;
  columnName: string;
  sampleValues: any[];
  detectedPII: PIIType;
  suggestedStrategy: AnonymizationStrategy;
}
