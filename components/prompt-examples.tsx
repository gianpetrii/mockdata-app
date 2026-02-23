'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatabaseSchema } from '@/lib/api';
import { ExampleGenerator, SmartExample } from '@/lib/generators/example-generator';

const GENERIC_EXAMPLES: SmartExample[] = [
  {
    title: 'Distribution Testing',
    description: 'Test status distributions',
    prompt: `Generate 100 records where:
- 70% have status 'completed'
- 20% have status 'pending'
- 10% have status 'cancelled'`,
    category: 'qa',
    relevance: 5,
  },
  {
    title: 'Range Constraints',
    description: 'Specific value ranges',
    prompt: `Generate 50 records where:
- Numeric field between 10 and 500
- 30% have value < 50
- 10% have value > 300`,
    category: 'qa',
    relevance: 5,
  },
  {
    title: 'Pattern Matching',
    description: 'Specific patterns for testing',
    prompt: `Generate 50 records where:
- Email field with @company.com domain
- Ages between 25-45`,
    category: 'advanced',
    relevance: 4,
  },
];

interface PromptExamplesProps {
  onSelectExample: (prompt: string) => void;
  schema: DatabaseSchema;
}

export default function PromptExamples({ onSelectExample, schema }: PromptExamplesProps) {
  const examples = useMemo(() => {
    const smartExamples = ExampleGenerator.generateExamples(schema);
    return [...smartExamples, ...GENERIC_EXAMPLES].sort((a, b) => b.relevance - a.relevance);
  }, [schema]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground">Example Prompts</h4>
      
      <div className="grid gap-3">
        {examples.slice(0, 6).map((example, idx) => (
          <Card key={idx} className="p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="text-sm font-medium">{example.title}</h5>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    example.category === 'basic' ? 'bg-blue-100 text-blue-700' :
                    example.category === 'qa' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {example.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{example.description}</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                  {example.prompt}
                </pre>
              </div>
              <Button
                onClick={() => onSelectExample(example.prompt)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                Use
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
