import { NextRequest, NextResponse } from 'next/server';
import { connections } from '../connect/route';

export async function GET(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id') || 'default';
  const connection = connections.get(sessionId);

  return NextResponse.json({
    connected: connection?.isConnected() || false,
    dbType: null,
  });
}
