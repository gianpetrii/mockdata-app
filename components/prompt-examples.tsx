'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PromptExample {
  title: string;
  description: string;
  prompt: string;
  category: 'basic' | 'qa' | 'advanced';
}

const EXAMPLES: PromptExample[] = [
  {
    title: 'Basic Generation',
    description: 'Simple data generation with quantity',
    prompt: 'Generate 100 users with realistic data',
    category: 'basic',
  },
  {
    title: 'Distribution Testing',
    description: 'Test status distributions',
    prompt: `Generate 100 orders where:
- 70% have status 'completed'
- 20% have status 'pending'
- 10% have status 'cancelled'
- All created in the last 30 days`,
    category: 'qa',
  },
  {
    title: 'Edge Cases',
    description: 'Test boundary conditions',
    prompt: `Generate test data for checkout flow:
- 10 users with no orders (new users)
- 5 users with abandoned cart (status 'pending' > 24h)
- 3 VIP users with more than 10 completed orders`,
    category: 'qa',
  },
  {
    title: 'Range Constraints',
    description: 'Specific value ranges',
    prompt: `Generate 50 products where:
- Price between $10 and $500
- Stock quantity between 0 and 100
- 30% have stock = 0 (out of stock scenario)`,
    category: 'qa',
  },
  {
    title: 'Pattern Matching',
    description: 'Specific patterns for testing',
    prompt: `Generate 50 users where:
- 30 users with @company.com emails
- 20 users with other email domains
- Ages between 25-45`,
    category: 'advanced',
  },
  {
    title: 'Relationship Testing',
    description: 'Test foreign key relationships',
    prompt: `Generate orders with relationships:
- 50 orders distributed across existing users
- Each user should have between 1-5 orders
- Order total amounts between $50-$500`,
    category: 'advanced',
  },
];

interface PromptExamplesProps {
  onSelectExample: (prompt: string) => void;
}

export default function PromptExamples({ onSelectExample }: PromptExamplesProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground">Example Prompts</h4>
      
      <div className="grid gap-3">
        {EXAMPLES.map((example, idx) => (
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
