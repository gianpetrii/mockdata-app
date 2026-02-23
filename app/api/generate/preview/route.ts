import { NextRequest, NextResponse } from 'next/server';
import { DataGenerator } from '@/lib/generators/data-generator';
import { DatabaseSchema } from '@/lib/api';
import { GenerationPlan } from '@/lib/generators/types';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const { plan, schema } = await request.json();

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

    return NextResponse.json({
      result,
      preview: {
        tables: result.tables,
        totalRows: result.rowsGenerated,
        sqlLength: result.sql.length,
      },
    });
  } catch (error) {
    console.error('Generate preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
