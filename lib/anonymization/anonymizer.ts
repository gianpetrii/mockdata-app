import { faker } from '@faker-js/faker';
import { AnonymizationStrategy, ColumnAnonymizationRule } from './types';
import { PIIType } from '@/lib/db/pii-detector-enhanced';

export class Anonymizer {
  private tokenMap: Map<string, string> = new Map();
  private pseudonymMap: Map<string, any> = new Map();

  /**
   * Anonymize a single value based on strategy
   */
  anonymizeValue(
    value: any,
    rule: ColumnAnonymizationRule,
    rowId?: string
  ): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (rule.strategy) {
      case 'mask':
        return this.maskValue(value, rule.options);
      
      case 'tokenize':
        return this.tokenizeValue(value, rule.columnName);
      
      case 'fake':
        return this.generateFakeValue(rule.piiType);
      
      case 'hash':
        return this.hashValue(value);
      
      case 'remove':
        return null;
      
      case 'generalize':
        return this.generalizeValue(value, rule);
      
      case 'noise':
        return this.addNoise(value, rule.options?.noisePercentage || 0.1);
      
      case 'shuffle':
        return value;
      
      case 'pseudonymize':
        return this.pseudonymizeValue(value, rule.piiType, rowId);
      
      case 'keep':
        return value;
      
      default:
        return value;
    }
  }

  private maskValue(value: any, options?: any): string {
    const str = String(value);
    const maskChar = options?.maskChar || '*';
    const visibleChars = options?.visibleChars || 2;

    if (str.includes('@')) {
      const [local, domain] = str.split('@');
      const maskedLocal = local.substring(0, visibleChars) + maskChar.repeat(Math.max(0, local.length - visibleChars));
      return `${maskedLocal}@${domain}`;
    }

    if (str.length <= visibleChars * 2) {
      return maskChar.repeat(str.length);
    }

    return str.substring(0, visibleChars) + 
           maskChar.repeat(str.length - visibleChars * 2) + 
           str.substring(str.length - visibleChars);
  }

  private tokenizeValue(value: any, columnName: string): string {
    const key = `${columnName}:${value}`;
    
    if (!this.tokenMap.has(key)) {
      this.tokenMap.set(key, `TOKEN_${faker.string.alphanumeric(8).toUpperCase()}`);
    }
    
    return this.tokenMap.get(key)!;
  }

  private generateFakeValue(piiType: PIIType): any {
    switch (piiType) {
      case 'email': return faker.internet.email();
      case 'phone': return faker.phone.number();
      case 'name': return faker.person.fullName();
      case 'address': return faker.location.streetAddress();
      case 'ssn': return faker.string.numeric(9);
      case 'credit_card': return faker.finance.creditCardNumber();
      case 'bank_account': return faker.finance.accountNumber();
      case 'date_of_birth': return faker.date.birthdate({ min: 18, max: 80, mode: 'age' });
      case 'ip_address': return faker.internet.ip();
      case 'username': return faker.internet.username();
      default: return faker.lorem.word();
    }
  }

  private hashValue(value: any): string {
    const str = String(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `HASH_${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  }

  private generalizeValue(value: any, rule: ColumnAnonymizationRule): any {
    if (value instanceof Date || typeof value === 'string') {
      const date = new Date(value);
      
      if (rule.options?.generalizeToYear) {
        return new Date(date.getFullYear(), 0, 1);
      }
      
      if (rule.options?.generalizeToMonth) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
      }
      
      return new Date(date.getFullYear(), 0, 1);
    }

    if (typeof value === 'number') {
      return Math.floor(value / 10) * 10;
    }

    return value;
  }

  private addNoise(value: any, percentage: number): any {
    if (typeof value !== 'number') {
      return value;
    }

    const noise = value * percentage * (Math.random() * 2 - 1);
    return value + noise;
  }

  private pseudonymizeValue(value: any, piiType: PIIType, rowId?: string): any {
    const key = rowId || String(value);
    
    if (!this.pseudonymMap.has(key)) {
      this.pseudonymMap.set(key, this.generateFakeValue(piiType));
    }
    
    return this.pseudonymMap.get(key);
  }

  /**
   * Generate SQL UPDATE statements for anonymization
   */
  static generateAnonymizationSQL(
    tableName: string,
    rules: ColumnAnonymizationRule[],
    rows: Record<string, any>[]
  ): string {
    const anonymizer = new Anonymizer();
    let sql = `-- Anonymize ${tableName}\n`;

    for (const row of rows) {
      const updates: string[] = [];
      const pkColumn = 'id';
      const pkValue = row[pkColumn];

      for (const rule of rules) {
        if (rule.strategy === 'keep') continue;
        
        const originalValue = row[rule.columnName];
        const anonymizedValue = anonymizer.anonymizeValue(originalValue, rule);
        
        updates.push(`${rule.columnName} = ${this.formatSQLValue(anonymizedValue)}`);
      }

      if (updates.length > 0) {
        sql += `UPDATE ${tableName} SET ${updates.join(', ')} WHERE ${pkColumn} = ${this.formatSQLValue(pkValue)};\n`;
      }
    }

    return sql;
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
