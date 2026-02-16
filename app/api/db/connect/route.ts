import { NextRequest, NextResponse } from 'next/server';
import { DatabaseConnection } from '@/lib/db/connection';
import { ConnectionConfig } from '@/lib/db/types';

// Store connections in memory (for MVP)
const connections = new Map<string, DatabaseConnection>();

export async function POST(request: NextRequest) {
  try {
    const config: ConnectionConfig = await request.json();

    if (!config.type || !config.host || !config.database || !config.user) {
      return NextResponse.json(
        { error: 'Missing required connection parameters' },
        { status: 400 }
      );
    }

    const sessionId = request.headers.get('x-session-id') || 'default';
    
    // Disconnect existing connection
    const existingConn = connections.get(sessionId);
    if (existingConn) {
      await existingConn.disconnect();
    }

    // Create new connection
    const connection = new DatabaseConnection();
    await connection.connect(config);
    connections.set(sessionId, connection);

    return NextResponse.json({
      success: true,
      message: `Connected to ${config.type} database: ${config.database}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export { connections };
