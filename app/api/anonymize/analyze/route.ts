import { NextRequest, NextResponse } from 'next/server';
import { connections } from '@/lib/db/connection-store';
import { DatabaseSchema } from '@/lib/api';
import { DataReader } from '@/lib/anonymization/data-reader';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const { schema } = await request.json();

    if (!schema) {
      return NextResponse.json(
        { error: 'Schema is required' },
        { status: 400 }
      );
    }

    const connection = connections.get(sessionId);
    if (!connection || !connection.isConnected()) {
      return NextResponse.json(
        { error: 'No active database connection' },
        { status: 400 }
      );
    }

    const db = connection.getKnex();

    const samples = await DataReader.readSamples(
      db,
      (schema as DatabaseSchema).tables,
      10
    );

    return NextResponse.json({ samples });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze data' },
      { status: 500 }
    );
  }
}
