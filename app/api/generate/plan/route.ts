import { NextRequest, NextResponse } from 'next/server';
import { PlanParser } from '@/lib/generators/plan-parser';
import { ConstraintValidator } from '@/lib/generators/constraint-validator';
import { DatabaseSchema } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 'default';
    const { prompt, schema } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!schema) {
      return NextResponse.json(
        { error: 'Schema is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Parse user request into structured plan
    const plan = await PlanParser.parseUserRequest(prompt, schema as DatabaseSchema, apiKey);

    // Validate plan against schema
    const validationErrors = ConstraintValidator.validate(plan, schema as DatabaseSchema);

    const hasErrors = validationErrors.some(e => e.type === 'error');

    return NextResponse.json({
      plan,
      validationErrors,
      valid: !hasErrors,
    });
  } catch (error) {
    console.error('Generate plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
