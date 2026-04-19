import { NextRequest, NextResponse } from 'next/server';
import { connections } from '@/lib/db/connection-store';
import { DatabaseConnection } from '@/lib/db/connection';
import { AnonymizationPlan } from '@/lib/anonymization/types';
import { AnonymizationExecutor } from '@/lib/anonymization/executor';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const { plan, executeInDb, mode, targetDb } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: 'Anonymization plan is required' },
        { status: 400 }
      );
    }

    const sourceConnection = connections.get(sessionId);
    if (!sourceConnection || !sourceConnection.isConnected()) {
      return NextResponse.json(
        { error: 'No active database connection' },
        { status: 400 }
      );
    }

    const sourceDb = sourceConnection.getKnex();

    if (mode === 'clone' && executeInDb) {
      if (!targetDb || !targetDb.host || !targetDb.database || !targetDb.user) {
        return NextResponse.json(
          { error: 'Target database credentials required for clone mode' },
          { status: 400 }
        );
      }

      const result = await AnonymizationExecutor.executeClone(
        sourceDb,
        targetDb,
        plan as AnonymizationPlan
      );

      return NextResponse.json({
        result,
        executed: true,
      });
    } else {
      const result = await AnonymizationExecutor.execute(
        sourceDb,
        plan as AnonymizationPlan,
        !executeInDb
      );

      return NextResponse.json({
        result,
        executed: executeInDb === true,
      });
    }
  } catch (error) {
    console.error('Anonymization execute error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute anonymization' },
      { status: 500 }
    );
  }
}
