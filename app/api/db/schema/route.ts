import { NextRequest, NextResponse } from 'next/server';
import { connections } from '../connect/route';
import { DatabaseIntrospector } from '@/lib/db/introspector';
import { PIIDetector } from '@/lib/db/pii-detector';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const dbType = request.headers.get('x-db-type') as 'postgres' | 'mysql';
    
    const connection = connections.get(sessionId);

    if (!connection || !connection.isConnected()) {
      return NextResponse.json(
        { error: 'No active database connection' },
        { status: 400 }
      );
    }

    const knex = connection.getKnex();
    const introspector = new DatabaseIntrospector(knex, dbType);
    const schema = await introspector.getSchema();

    const schemaWithPII = {
      tables: schema.tables.map(table => {
        const piiDetection = PIIDetector.detectPII(table.columns);
        return {
          ...table,
          piiDetection,
        };
      }),
    };

    return NextResponse.json(schemaWithPII);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
