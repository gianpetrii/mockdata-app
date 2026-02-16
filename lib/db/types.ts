export type DatabaseType = 'postgres' | 'mysql';

export interface ConnectionConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
  maxLength: number | null;
  comment: string | null;
}

export interface ForeignKey {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string | null;
  onUpdate: string | null;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKey[];
  primaryKeys: string[];
  uniqueConstraints: string[][];
  checkConstraints: string[];
}

export interface DatabaseSchema {
  tables: TableInfo[];
}
