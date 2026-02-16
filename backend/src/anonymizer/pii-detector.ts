import { ColumnInfo } from '../db/types';

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
    email: [
      /^email$/i,
      /^e_?mail$/i,
      /^user_?email$/i,
      /^contact_?email$/i,
      /_email$/i,
    ],
    phone: [
      /^phone$/i,
      /^telephone$/i,
      /^mobile$/i,
      /^cell$/i,
      /^tel$/i,
      /_phone$/i,
      /_tel$/i,
    ],
    name: [
      /^name$/i,
      /^full_?name$/i,
      /^first_?name$/i,
      /^last_?name$/i,
      /^given_?name$/i,
      /^surname$/i,
      /^family_?name$/i,
    ],
    address: [
      /^address$/i,
      /^street$/i,
      /^city$/i,
      /^state$/i,
      /^zip$/i,
      /^postal_?code$/i,
      /^country$/i,
      /_address$/i,
    ],
    ssn: [
      /^ssn$/i,
      /^social_?security$/i,
      /^tax_?id$/i,
      /^national_?id$/i,
      /^dni$/i,
      /^cuit$/i,
      /^cuil$/i,
    ],
    credit_card: [
      /^card_?number$/i,
      /^credit_?card$/i,
      /^cc_?number$/i,
      /^payment_?card$/i,
    ],
    date_of_birth: [
      /^dob$/i,
      /^birth_?date$/i,
      /^date_?of_?birth$/i,
      /^birthday$/i,
    ],
    ip_address: [
      /^ip$/i,
      /^ip_?address$/i,
      /^ipv4$/i,
      /^ipv6$/i,
    ],
    none: [],
  };

  static detectPII(columns: ColumnInfo[]): PIIDetectionResult[] {
    return columns.map(column => this.detectColumnPII(column));
  }

  private static detectColumnPII(column: ColumnInfo): PIIDetectionResult {
    // Check column name patterns
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

    // Check data type hints
    const typeHint = this.detectByDataType(column);
    if (typeHint) {
      return typeHint;
    }

    // No PII detected
    return {
      columnName: column.name,
      detectedType: 'none',
      confidence: 'high',
      reason: 'No PII patterns detected',
    };
  }

  private static detectByDataType(column: ColumnInfo): PIIDetectionResult | null {
    const type = column.type.toLowerCase();

    // Email hint from varchar with specific length
    if ((type.includes('varchar') || type.includes('text')) && column.maxLength && column.maxLength >= 50) {
      if (column.name.toLowerCase().includes('mail')) {
        return {
          columnName: column.name,
          detectedType: 'email',
          confidence: 'medium',
          reason: 'Text field with email-like name',
        };
      }
    }

    // Date of birth hint
    if (type.includes('date') && column.name.toLowerCase().includes('birth')) {
      return {
        columnName: column.name,
        detectedType: 'date_of_birth',
        confidence: 'high',
        reason: 'Date field with birth-related name',
      };
    }

    return null;
  }
}
