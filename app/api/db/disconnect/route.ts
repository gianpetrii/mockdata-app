import { NextRequest, NextResponse } from 'next/server';
import { connections } from '../connect/route';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const connection = connections.get(sessionId);

    if (connection) {
      await connection.disconnect();
      connections.delete(sessionId);
    }

    return NextResponse.json({
      success: true,
      message: 'Disconnected from database',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
