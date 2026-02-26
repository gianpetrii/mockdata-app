import { NextRequest, NextResponse } from 'next/server';
import { connections } from '@/lib/db/connection-store';
import { AnonymizationPlan } from '@/lib/anonymization/types';
import { AnonymizationExecutor } from '@/lib/anonymization/executor';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const { plan, executeInDb } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: 'Anonymization plan is required' },
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

    const result = await AnonymizationExecutor.execute(
      db,
      plan as AnonymizationPlan,
      !executeInDb
    );

    return NextResponse.json({
      result,
      executed: executeInDb === true,
    });
  } catch (error) {
    console.error('Anonymization execute error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute anonymization' },
      { status: 500 }
    );
  }
}
