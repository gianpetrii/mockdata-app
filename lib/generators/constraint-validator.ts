import { DatabaseSchema, TableInfo, ColumnInfo } from '@/lib/api';
import { GenerationPlan, TableGenerationSpec, GenerationConstraint } from './types';

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  table?: string;
  column?: string;
}

export class ConstraintValidator {
  /**
   * Validates a generation plan against the database schema
   */
  static validate(plan: GenerationPlan, schema: DatabaseSchema): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const tableSpec of plan.tables) {
      const tableInfo = schema.tables.find(t => t.name === tableSpec.name);
      
      if (!tableInfo) {
        errors.push({
          type: 'error',
          message: `Table ${tableSpec.name} not found in schema`,
          table: tableSpec.name,
        });
        continue;
      }

      errors.push(...this.validateTableSpec(tableSpec, tableInfo, schema));
    }

    errors.push(...this.validateGenerationOrder(plan, schema));

    return errors;
  }

  private static validateTableSpec(
    tableSpec: TableGenerationSpec,
    tableInfo: TableInfo,
    schema: DatabaseSchema
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate count
    if (tableSpec.count <= 0) {
      errors.push({
        type: 'error',
        message: 'Count must be greater than 0',
        table: tableSpec.name,
      });
    }

    if (tableSpec.count > 10000) {
      errors.push({
        type: 'warning',
        message: 'Generating more than 10,000 rows may be slow',
        table: tableSpec.name,
      });
    }

    // Validate constraints
    for (const constraint of tableSpec.constraints) {
      errors.push(...this.validateConstraint(constraint, tableInfo));
    }

    // Validate relationships
    for (const relationship of tableSpec.relationships) {
      errors.push(...this.validateRelationship(relationship, tableInfo, schema));
    }

    return errors;
  }

  private static validateConstraint(
    constraint: GenerationConstraint,
    tableInfo: TableInfo
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const column = tableInfo.columns.find(c => c.name === constraint.column);

    if (!column) {
      errors.push({
        type: 'error',
        message: `Column ${constraint.column} not found in table ${tableInfo.name}`,
        table: tableInfo.name,
        column: constraint.column,
      });
      return errors;
    }

    // Validate constraint value based on rule
    switch (constraint.rule) {
      case 'range':
        if (!constraint.value.min || !constraint.value.max) {
          errors.push({
            type: 'error',
            message: 'Range constraint requires min and max values',
            table: tableInfo.name,
            column: constraint.column,
          });
        }
        break;

      case 'percentage':
        const total = Object.values(constraint.value).reduce((sum: number, val: any) => sum + val, 0);
        if (Math.abs(total - 1.0) > 0.01) {
          errors.push({
            type: 'warning',
            message: `Percentage distribution sums to ${total}, expected 1.0`,
            table: tableInfo.name,
            column: constraint.column,
          });
        }
        break;

      case 'enum':
        if (!Array.isArray(constraint.value) || constraint.value.length === 0) {
          errors.push({
            type: 'error',
            message: 'Enum constraint requires non-empty array',
            table: tableInfo.name,
            column: constraint.column,
          });
        }
        break;

      case 'null_percentage':
        if (column.nullable === false && constraint.value > 0) {
          errors.push({
            type: 'error',
            message: 'Cannot set null_percentage on non-nullable column',
            table: tableInfo.name,
            column: constraint.column,
          });
        }
        break;
    }

    return errors;
  }

  private static validateRelationship(
    relationship: any,
    tableInfo: TableInfo,
    schema: DatabaseSchema
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const foreignTable = schema.tables.find(t => t.name === relationship.foreignTable);
    if (!foreignTable) {
      errors.push({
        type: 'error',
        message: `Foreign table ${relationship.foreignTable} not found`,
        table: tableInfo.name,
      });
      return errors;
    }

    const localColumn = tableInfo.columns.find(c => c.name === relationship.localColumn);
    if (!localColumn) {
      errors.push({
        type: 'error',
        message: `Local column ${relationship.localColumn} not found`,
        table: tableInfo.name,
        column: relationship.localColumn,
      });
    }

    const foreignColumn = foreignTable.columns.find(c => c.name === relationship.foreignColumn);
    if (!foreignColumn) {
      errors.push({
        type: 'error',
        message: `Foreign column ${relationship.foreignColumn} not found in ${relationship.foreignTable}`,
        table: tableInfo.name,
      });
    }

    return errors;
  }

  private static validateGenerationOrder(
    plan: GenerationPlan,
    schema: DatabaseSchema
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const generationOrder = plan.tables.map(t => t.name);
    const generated = new Set<string>();

    for (const tableSpec of plan.tables) {
      const tableInfo = schema.tables.find(t => t.name === tableSpec.name);
      if (!tableInfo) continue;

      for (const relationship of tableSpec.relationships) {
        if (relationship.strategy === 'existing' || relationship.strategy === 'random_existing') {
          if (!generated.has(relationship.foreignTable) && 
              !generationOrder.slice(0, generationOrder.indexOf(tableSpec.name)).includes(relationship.foreignTable)) {
            errors.push({
              type: 'warning',
              message: `Table ${tableSpec.name} references ${relationship.foreignTable} which is not generated before it`,
              table: tableSpec.name,
            });
          }
        }
      }

      generated.add(tableSpec.name);
    }

    return errors;
  }
}
