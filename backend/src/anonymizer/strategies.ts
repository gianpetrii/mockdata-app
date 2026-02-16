import { faker } from '@faker-js/faker';
import crypto from 'crypto';

export type AnonymizationStrategy =
  | 'synthetic_realistic'
  | 'deterministic_hash'
  | 'randomized_format'
  | 'nullification'
  | 'keep_original';

export interface StrategyConfig {
  strategy: AnonymizationStrategy;
  columnName: string;
  dataType: string;
  options?: Record<string, any>;
}

export class AnonymizationStrategies {
  /**
   * A. Synthetic realistic replacement
   * Generates realistic fake data using faker
   */
  static syntheticRealistic(value: any, config: StrategyConfig): any {
    if (value === null) return null;

    const columnName = config.columnName.toLowerCase();
    const dataType = config.dataType.toLowerCase();

    // Email
    if (columnName.includes('email') || columnName.includes('mail')) {
      return faker.internet.email();
    }

    // Phone
    if (columnName.includes('phone') || columnName.includes('tel')) {
      return faker.phone.number();
    }

    // Name variations
    if (columnName.includes('first') && columnName.includes('name')) {
      return faker.person.firstName();
    }
    if (columnName.includes('last') && columnName.includes('name')) {
      return faker.person.lastName();
    }
    if (columnName.includes('name')) {
      return faker.person.fullName();
    }

    // Address
    if (columnName.includes('address') || columnName.includes('street')) {
      return faker.location.streetAddress();
    }
    if (columnName.includes('city')) {
      return faker.location.city();
    }
    if (columnName.includes('state')) {
      return faker.location.state();
    }
    if (columnName.includes('zip') || columnName.includes('postal')) {
      return faker.location.zipCode();
    }
    if (columnName.includes('country')) {
      return faker.location.country();
    }

    // Date of birth
    if (columnName.includes('birth') || columnName.includes('dob')) {
      return faker.date.birthdate();
    }

    // Generic fallbacks based on data type
    if (dataType.includes('varchar') || dataType.includes('text')) {
      return faker.lorem.words(3);
    }
    if (dataType.includes('int')) {
      return faker.number.int({ min: 1, max: 100000 });
    }
    if (dataType.includes('date')) {
      return faker.date.past();
    }

    return value; // Keep original if no pattern matches
  }

  /**
   * B. Deterministic hash
   * Creates consistent hash for maintaining relationships
   */
  static deterministicHash(value: any, config: StrategyConfig): string {
    if (value === null) return null as any;

    const stringValue = String(value);
    return crypto
      .createHash('sha256')
      .update(stringValue)
      .digest('hex')
      .substring(0, 32); // Truncate to reasonable length
  }

  /**
   * C. Randomized replacement preserving format
   * Maintains format but randomizes content
   */
  static randomizedFormat(value: any, config: StrategyConfig): any {
    if (value === null) return null;

    const stringValue = String(value);
    const columnName = config.columnName.toLowerCase();

    // Email: keep domain structure
    if (columnName.includes('email') && stringValue.includes('@')) {
      const [, domain] = stringValue.split('@');
      return `${faker.string.alphanumeric(8)}@${domain}`;
    }

    // Phone: preserve format (digits only)
    if (columnName.includes('phone') || columnName.includes('tel')) {
      return stringValue.replace(/\d/g, () => faker.string.numeric(1));
    }

    // DNI/SSN: preserve numeric format
    if (columnName.includes('dni') || columnName.includes('ssn') || columnName.includes('tax')) {
      return stringValue.replace(/\d/g, () => faker.string.numeric(1));
    }

    // Generic: preserve length and type
    if (typeof value === 'string') {
      return faker.string.alphanumeric(stringValue.length);
    }
    if (typeof value === 'number') {
      const digits = stringValue.length;
      return parseInt(faker.string.numeric(digits), 10);
    }

    return value;
  }

  /**
   * D. Nullification
   * Sets value to null
   */
  static nullification(_value: any, _config: StrategyConfig): null {
    return null;
  }

  /**
   * E. Keep original
   * No transformation
   */
  static keepOriginal(value: any, _config: StrategyConfig): any {
    return value;
  }

  /**
   * Apply strategy to a value
   */
  static apply(value: any, config: StrategyConfig): any {
    switch (config.strategy) {
      case 'synthetic_realistic':
        return this.syntheticRealistic(value, config);
      case 'deterministic_hash':
        return this.deterministicHash(value, config);
      case 'randomized_format':
        return this.randomizedFormat(value, config);
      case 'nullification':
        return this.nullification(value, config);
      case 'keep_original':
        return this.keepOriginal(value, config);
      default:
        throw new Error(`Unknown strategy: ${config.strategy}`);
    }
  }
}
