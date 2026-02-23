'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Database, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { DatabaseSchema, api } from '@/lib/api';
import { GenerationPlan } from '@/lib/generators/types';
import PromptExamples from '@/components/prompt-examples';

interface DataGeneratorPanelProps {
  schema: DatabaseSchema;
}

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  table?: string;
  column?: string;
}

export default function DataGeneratorPanel({ schema }: DataGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GenerationPlan | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showExamples, setShowExamples] = useState(true);

  const handleSelectExample = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setShowExamples(false);
  };

  const handleGeneratePlan = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setPlan(null);
    setValidationErrors([]);
    setGeneratedSQL(null);
    setExecutionResult(null);

    try {
      const data = await api.generatePlan(prompt, schema);
      setPlan(data.plan);
      setValidationErrors(data.validationErrors || []);
    } catch (error) {
      console.error('Error generating plan:', error);
      setValidationErrors([{
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate plan',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      const data = await api.generatePreview(plan, schema);
      setGeneratedSQL(data.result.sql);
    } catch (error) {
      console.error('Error generating preview:', error);
      setValidationErrors([{
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate preview',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!plan) return;

    setExecuting(true);
    setExecutionResult(null);

    try {
      const data = await api.executeGeneration(plan, schema, true);
      setExecutionResult(data);
      setGeneratedSQL(data.result.sql);
    } catch (error) {
      console.error('Error executing generation:', error);
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleDownloadSQL = () => {
    if (!generatedSQL) return;

    const blob = new Blob([generatedSQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockdata-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasErrors = validationErrors.some(e => e.type === 'error');
  const hasWarnings = validationErrors.some(e => e.type === 'warning');

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Generate Mock Data
          </h3>
          {!showExamples && (
            <Button
              onClick={() => setShowExamples(!showExamples)}
              variant="ghost"
              size="sm"
            >
              {showExamples ? 'Hide' : 'Show'} Examples
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the data you want to generate...&#10;&#10;Example:&#10;Generate 100 users where:&#10;- 80% have status 'active' and 20% 'inactive'&#10;- Ages between 25-45&#10;- All created in the last 6 months"
            className="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          <Button
            onClick={handleGeneratePlan}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Generate Plan'
            )}
          </Button>
        </div>

        {showExamples && (
          <div className="mt-4 pt-4 border-t">
            <PromptExamples onSelectExample={handleSelectExample} />
          </div>
        )}
      </Card>

      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors.map((error, idx) => (
            <Alert key={idx} variant={error.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-medium">{error.type === 'error' ? 'Error' : 'Warning'}:</span>{' '}
                {error.message}
                {error.table && <span className="text-xs ml-2">({error.table}{error.column ? `.${error.column}` : ''})</span>}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {plan && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Generation Plan</h4>
            <Badge variant="outline">{plan.estimatedRows} rows</Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

          <div className="space-y-3">
            {plan.tables.map((table, idx) => (
              <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{table.name}</span>
                  <Badge>{table.count} rows</Badge>
                </div>

                {table.description && (
                  <p className="text-xs text-muted-foreground mb-2">{table.description}</p>
                )}

                {table.constraints.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Constraints:</p>
                    <ul className="text-xs space-y-1 ml-4">
                      {table.constraints.map((constraint, cidx) => (
                        <li key={cidx} className="text-muted-foreground">
                          <span className="font-mono">{constraint.column}</span>: {constraint.description || `${constraint.rule} = ${JSON.stringify(constraint.value)}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {table.relationships.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Relationships:</p>
                    <ul className="text-xs space-y-1 ml-4">
                      {table.relationships.map((rel, ridx) => (
                        <li key={ridx} className="text-muted-foreground">
                          {rel.localColumn} → {rel.foreignTable}.{rel.foreignColumn} ({rel.strategy})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handlePreview}
              disabled={loading || hasErrors}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Preview SQL'
              )}
            </Button>

            <Button
              onClick={handleExecute}
              disabled={executing || hasErrors}
              className="flex-1"
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Execute in DB
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {generatedSQL && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Generated SQL</h4>
            <Button
              onClick={handleDownloadSQL}
              variant="outline"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
            {generatedSQL}
          </pre>
        </Card>
      )}

      {executionResult && (
        <Alert variant={executionResult.success ? 'default' : 'destructive'}>
          {executionResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            {executionResult.success ? (
              <span>
                <span className="font-medium">Success!</span> {executionResult.message}
              </span>
            ) : (
              <span>
                <span className="font-medium">Error:</span> {executionResult.error}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
