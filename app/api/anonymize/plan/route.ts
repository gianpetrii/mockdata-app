import { NextRequest, NextResponse } from 'next/server';
import { connections } from '../../db/connect/route';
import { DatabaseSchema } from '@/lib/api';
import { AnonymizationPlanBuilder } from '@/lib/anonymization/plan-builder';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const { schema, prompt, autoSelect } = await request.json();

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

    let plan;

    if (prompt) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OpenRouter API key not configured' },
          { status: 500 }
        );
      }

      plan = await AnonymizationPlanBuilder.buildPlanFromPrompt(
        prompt,
        schema as DatabaseSchema,
        db,
        apiKey
      );
    } else {
      plan = await AnonymizationPlanBuilder.buildPlan(
        db,
        schema as DatabaseSchema,
        {
          autoSelectStrategies: autoSelect !== false,
          includeSamples: true,
        }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Anonymization plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create anonymization plan' },
      { status: 500 }
    );
  }
}
