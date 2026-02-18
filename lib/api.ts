const API_BASE_URL = '/api';

// Generate session ID for connection management
const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let sessionId = sessionStorage.getItem('db-session-id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(7);
    sessionStorage.setItem('db-session-id', sessionId);
  }
  return sessionId;
};

let currentDbType: 'postgres' | 'mysql' | null = null;

export interface ConnectionConfig {
  type: 'postgres' | 'mysql';
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

export interface PIIDetectionResult {
  columnName: string;
  detectedType: string;
  classification: 'direct_identifier' | 'indirect_identifier' | 'sensitive_data' | 'non_sensitive';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKey[];
  primaryKeys: string[];
  uniqueConstraints: string[][];
  checkConstraints: string[];
  piiDetection: PIIDetectionResult[];
}

export interface DatabaseSchema {
  tables: TableInfo[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async connect(config: ConnectionConfig): Promise<{ success: boolean; message: string }> {
    currentDbType = config.type;
    const response = await fetch(`${this.baseUrl}/db/connect`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-session-id': getSessionId(),
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to connect');
    }

    return response.json();
  }

  async disconnect(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/db/disconnect`, {
      method: 'POST',
      headers: {
        'x-session-id': getSessionId(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect');
    }

    currentDbType = null;
    return response.json();
  }

  async getSchema(): Promise<DatabaseSchema> {
    const response = await fetch(`${this.baseUrl}/db/schema`, {
      headers: {
        'x-session-id': getSessionId(),
        'x-db-type': currentDbType || 'postgres',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch schema');
    }

    return response.json();
  }

  async getConnectionStatus(): Promise<{ connected: boolean; dbType: string | null }> {
    const response = await fetch(`${this.baseUrl}/db/status`, {
      headers: {
        'x-session-id': getSessionId(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check connection status');
    }

    return response.json();
  }
}

export const api = new ApiClient();
