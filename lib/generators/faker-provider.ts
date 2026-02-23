import { faker } from '@faker-js/faker';
import { PIIType } from '@/lib/db/pii-detector';

export class FakerProvider {
  /**
   * Generate realistic data based on column type and PII classification
   */
  static generateValue(
    columnName: string,
    dataType: string,
    piiType: PIIType = 'none',
    constraint?: any
  ): any {
    // Handle constraints first
    if (constraint) {
      return this.generateWithConstraint(columnName, dataType, constraint);
    }

    // Generate based on PII type
    switch (piiType) {
      case 'email':
        return faker.internet.email();
      case 'phone':
        return faker.phone.number();
      case 'name':
        if (columnName.toLowerCase().includes('first')) return faker.person.firstName();
        if (columnName.toLowerCase().includes('last')) return faker.person.lastName();
        return faker.person.fullName();
      case 'address':
        if (columnName.toLowerCase().includes('street')) return faker.location.streetAddress();
        if (columnName.toLowerCase().includes('city')) return faker.location.city();
        if (columnName.toLowerCase().includes('country')) return faker.location.country();
        return faker.location.streetAddress();
      case 'date_of_birth':
        return faker.date.birthdate({ min: 18, max: 80, mode: 'age' });
      case 'ip_address':
        return faker.internet.ip();
      case 'credit_card':
        return faker.finance.creditCardNumber();
      case 'ssn':
        return faker.string.numeric(9);
      default:
        return this.generateByDataType(columnName, dataType);
    }
  }

  private static generateWithConstraint(
    columnName: string,
    dataType: string,
    constraint: any
  ): any {
    const rule = constraint.rule;
    const value = constraint.value;

    switch (rule) {
      case 'range':
        if (dataType.includes('int') || dataType.includes('numeric')) {
          return faker.number.int({ min: value.min, max: value.max });
        }
        if (dataType.includes('date') || dataType.includes('timestamp')) {
          return faker.date.between({ from: value.min, to: value.max });
        }
        return value.min;

      case 'enum':
        return faker.helpers.arrayElement(value);

      case 'pattern':
        if (columnName.toLowerCase().includes('email')) {
          const username = faker.internet.username().toLowerCase();
          return `${username}${value}`;
        }
        return `${faker.string.alphanumeric(8)}${value}`;

      case 'percentage':
        return this.generateFromPercentageDistribution(value);

      default:
        return this.generateByDataType(columnName, dataType);
    }
  }

  private static generateFromPercentageDistribution(distribution: Record<string, number>): any {
    const rand = Math.random();
    let cumulative = 0;

    for (const [key, percentage] of Object.entries(distribution)) {
      cumulative += percentage;
      if (rand <= cumulative) {
        return key;
      }
    }

    return Object.keys(distribution)[0];
  }

  private static generateByDataType(columnName: string, dataType: string): any {
    const lowerName = columnName.toLowerCase();

    // Common column name patterns
    if (lowerName.includes('email')) return faker.internet.email();
    if (lowerName.includes('phone')) return faker.phone.number();
    if (lowerName.includes('url') || lowerName.includes('website')) return faker.internet.url();
    if (lowerName.includes('company')) return faker.company.name();
    if (lowerName.includes('title') || lowerName.includes('position')) return faker.person.jobTitle();
    if (lowerName.includes('description')) return faker.lorem.paragraph();
    if (lowerName.includes('price') || lowerName.includes('amount')) return faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
    if (lowerName.includes('quantity') || lowerName.includes('count')) return faker.number.int({ min: 1, max: 100 });
    if (lowerName.includes('status')) return faker.helpers.arrayElement(['active', 'inactive', 'pending']);

    // Fallback to data type
    if (dataType.includes('int') || dataType.includes('serial')) {
      return faker.number.int({ min: 1, max: 100000 });
    }
    if (dataType.includes('numeric') || dataType.includes('decimal') || dataType.includes('float')) {
      return faker.number.float({ min: 0, max: 10000, fractionDigits: 2 });
    }
    if (dataType.includes('bool')) {
      return faker.datatype.boolean();
    }
    if (dataType.includes('date') || dataType.includes('timestamp')) {
      return faker.date.recent({ days: 365 });
    }
    if (dataType.includes('json') || dataType.includes('jsonb')) {
      return { data: faker.lorem.word() };
    }
    if (dataType.includes('uuid')) {
      return faker.string.uuid();
    }
    if (dataType.includes('text') || dataType.includes('varchar') || dataType.includes('char')) {
      if (lowerName.includes('name')) return faker.person.fullName();
      if (lowerName.includes('city')) return faker.location.city();
      if (lowerName.includes('country')) return faker.location.country();
      return faker.lorem.sentence();
    }

    return faker.lorem.word();
  }

  /**
   * Generate a batch of unique values
   */
  static generateUniqueValues(
    columnName: string,
    dataType: string,
    count: number,
    piiType: PIIType = 'none'
  ): any[] {
    const values = new Set<any>();
    let attempts = 0;
    const maxAttempts = count * 10;

    while (values.size < count && attempts < maxAttempts) {
      const value = this.generateValue(columnName, dataType, piiType);
      values.add(typeof value === 'object' ? JSON.stringify(value) : value);
      attempts++;
    }

    if (values.size < count) {
      throw new Error(`Could not generate ${count} unique values for ${columnName}`);
    }

    return Array.from(values).map(v => 
      typeof v === 'string' && v.startsWith('{') ? JSON.parse(v) : v
    );
  }
}
