import { ColumnInfo } from './types';

export type PIIType = 
  | 'email'
  | 'phone'
  | 'name'
  | 'address'
  | 'ssn'
  | 'credit_card'
  | 'date_of_birth'
  | 'ip_address'
  | 'none';

export interface PIIDetectionResult {
  columnName: string;
  detectedType: PIIType;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export class PIIDetector {
  private static readonly COLUMN_NAME_PATTERNS: Record<PIIType, RegExp[]> = {
    email: [/^email$/i, /^e_?mail$/i, /^user_?email$/i, /_email$/i],
    phone: [/^phone$/i, /^telephone$/i, /^mobile$/i, /_phone$/i],
    name: [/^name$/i, /^full_?name$/i, /^first_?name$/i, /^last_?name$/i],
    address: [/^address$/i, /^street$/i, /^city$/i, /_address$/i],
    ssn: [/^ssn$/i, /^social_?security$/i, /^dni$/i, /^cuit$/i],
    credit_card: [/^card_?number$/i, /^credit_?card$/i],
    date_of_birth: [/^dob$/i, /^birth_?date$/i, /^date_?of_?birth$/i],
    ip_address: [/^ip$/i, /^ip_?address$/i],
    none: [],
  };

  static detectPII(columns: ColumnInfo[]): PIIDetectionResult[] {
    return columns.map(column => this.detectColumnPII(column));
  }

  private static detectColumnPII(column: ColumnInfo): PIIDetectionResult {
    for (const [piiType, patterns] of Object.entries(this.COLUMN_NAME_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(column.name)) {
          return {
            columnName: column.name,
            detectedType: piiType as PIIType,
            confidence: 'high',
            reason: `Column name matches ${piiType} pattern`,
          };
        }
      }
    }

    return {
      columnName: column.name,
      detectedType: 'none',
      confidence: 'high',
      reason: 'No PII patterns detected',
    };
  }
}
