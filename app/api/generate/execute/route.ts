import { NextRequest, NextResponse } from 'next/server';
import { DataGenerator } from '@/lib/generators/data-generator';
import { DatabaseSchema } from '@/lib/api';
import { GenerationPlan } from '@/lib/generators/types';
import { connections } from '../../db/connect/route';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const { plan, schema, executeInDb } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: 'Generation plan is required' },
        { status: 400 }
      );
    }

    if (!schema) {
      return NextResponse.json(
        { error: 'Schema is required' },
        { status: 400 }
      );
    }

    const result = await DataGenerator.generate(
      plan as GenerationPlan,
      schema as DatabaseSchema
    );

    if (executeInDb) {
      const connection = connections.get(sessionId);

      if (!connection || !connection.isConnected()) {
        return NextResponse.json(
          { error: 'No active database connection' },
          { status: 400 }
        );
      }

      const db = connection.getKnex();

      try {
        await db.raw('BEGIN');
        await db.raw(result.sql);
        await db.raw('COMMIT');

        return NextResponse.json({
          success: true,
          result,
          executed: true,
          message: `Successfully inserted ${result.rowsGenerated} rows`,
        });
      } catch (dbError) {
        await db.raw('ROLLBACK');
        throw new Error(`Database execution failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      result,
      executed: false,
    });
  } catch (error) {
    console.error('Generate execute error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute generation' },
      { status: 500 }
    );
  }
}
