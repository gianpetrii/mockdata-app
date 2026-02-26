'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, Download, AlertTriangle, CheckCircle2, Eye, X } from 'lucide-react';
import { DatabaseSchema, api } from '@/lib/api';
import { AnonymizationPlan, AnonymizationStrategy } from '@/lib/anonymization/types';

interface DataAnonymizationPanelProps {
  schema: DatabaseSchema;
}

const STRATEGY_LABELS: Record<AnonymizationStrategy, string> = {
  mask: 'Mask (j***@email.com)',
  tokenize: 'Tokenize (TOKEN_A123)',
  fake: 'Replace with fake data',
  hash: 'Hash (one-way)',
  remove: 'Remove (set NULL)',
  generalize: 'Generalize (reduce precision)',
  noise: 'Add noise (±10%)',
  shuffle: 'Shuffle between rows',
  pseudonymize: 'Pseudonymize (consistent fake)',
  keep: 'Keep original',
};

export default function DataAnonymizationPanel({ schema }: DataAnonymizationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [plan, setPlan] = useState<AnonymizationPlan | null>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [previewSQL, setPreviewSQL] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const planRef = useRef<HTMLDivElement>(null);
  const sqlRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const scrollToElement = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setSamples([]);
    setPlan(null);

    try {
      const response = await fetch('/api/anonymize/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionStorage.getItem('db-session-id') || 'default',
        },
        body: JSON.stringify({ schema }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze data');
      }

      setSamples(data.samples);

      const planResponse = await fetch('/api/anonymize/plan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionStorage.getItem('db-session-id') || 'default',
        },
        body: JSON.stringify({ schema, autoSelect: true }),
      });

      const planData = await planResponse.json();

      if (!planResponse.ok) {
        throw new Error(planData.error || 'Failed to create plan');
      }

      setPlan(planData.plan);
      
      // Scroll to plan
      setTimeout(() => scrollToElement(planRef), 300);
    } catch (error) {
      console.error('Error analyzing:', error);
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to analyze'],
      });
      setTimeout(() => scrollToElement(resultRef), 300);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStrategyChange = (tableIdx: number, ruleIdx: number, strategy: AnonymizationStrategy) => {
    if (!plan) return;

    const newPlan = { ...plan };
    newPlan.tables[tableIdx].rules[ruleIdx].strategy = strategy;
    setPlan(newPlan);
  };

  const handlePreview = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      const response = await fetch('/api/anonymize/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionStorage.getItem('db-session-id') || 'default',
        },
        body: JSON.stringify({ plan, executeInDb: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview');
      }

      setPreviewSQL(data.result.sql);
      
      // Scroll to SQL
      setTimeout(() => scrollToElement(sqlRef), 300);
    } catch (error) {
      console.error('Error previewing:', error);
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to preview'],
      });
      setTimeout(() => scrollToElement(resultRef), 300);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!plan) return;

    const confirmed = confirm(
      `⚠️ This will anonymize ${plan.totalRows} rows across ${plan.tables.length} tables.\n\nThis action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    setExecuting(true);
    setResult(null);

    try {
      const response = await fetch('/api/anonymize/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionStorage.getItem('db-session-id') || 'default',
        },
        body: JSON.stringify({ plan, executeInDb: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute');
      }

      setResult(data.result);
      setPreviewSQL(data.result.sql);
      
      // Scroll to result
      setTimeout(() => scrollToElement(resultRef), 300);
    } catch (error) {
      console.error('Error executing:', error);
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to execute'],
      });
      setTimeout(() => scrollToElement(resultRef), 300);
    } finally {
      setExecuting(false);
    }
  };

  const handleDownloadSQL = () => {
    if (!previewSQL) return;

    const blob = new Blob([previewSQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anonymization-${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 h-full pb-8">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Anonymize Existing Data
          </h3>
        </div>

        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This feature will <strong>modify existing data</strong> in your database. 
            Always preview and download SQL before executing. This action cannot be undone.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Data...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Analyze & Detect PII
            </>
          )}
        </Button>
      </Card>

      {samples.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Detected PII in Data</h4>
          <div className="space-y-2 text-sm">
            {samples.map((sample, idx) => (
              <div key={idx} className="border-l-4 border-red-400 pl-3 py-1">
                <div className="font-medium">
                  {sample.tableName}.{sample.columnName}
                </div>
                <div className="text-xs text-muted-foreground">
                  Type: {sample.detectedPII} | Strategy: {sample.suggestedStrategy}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Sample: {String(sample.sampleValues[0]).substring(0, 30)}...
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {plan && (
        <Card className="p-4" ref={planRef}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Anonymization Plan</h4>
            <Badge variant="outline">{plan.totalRows} rows</Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

          <div className="space-y-4">
            {plan.tables.map((table, tableIdx) => (
              <div key={tableIdx} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{table.tableName}</span>
                  <Badge>{table.rowsToProcess} rows</Badge>
                </div>

                <div className="space-y-2">
                  {table.rules.map((rule, ruleIdx) => (
                    <div key={ruleIdx} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs flex-1">{rule.columnName}</span>
                      <Badge variant="outline" className="text-xs">
                        {rule.piiType}
                      </Badge>
                      <Select
                        value={rule.strategy}
                        onValueChange={(value) => handleStrategyChange(tableIdx, ruleIdx, value as AnonymizationStrategy)}
                      >
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STRATEGY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {table.sampleBefore && table.sampleBefore.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-medium mb-2">Sample Data (before):</p>
                    <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(table.sampleBefore[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handlePreview}
              disabled={loading}
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
              disabled={executing}
              variant="destructive"
              className="flex-1"
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Execute Anonymization
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {previewSQL && (
        <Card className="p-4" ref={sqlRef}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Anonymization SQL</h4>
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
            {previewSQL}
          </pre>
        </Card>
      )}

      {result && (
        <Alert 
          variant={result.success ? 'default' : 'destructive'}
          className="relative"
          ref={resultRef}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={() => setResult(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription className="pr-8">
            {result.success ? (
              <div>
                <p className="font-medium">Anonymization Complete!</p>
                <p className="text-sm mt-1">
                  Processed {result.rowsProcessed} rows across {result.tablesProcessed} tables.
                  Anonymized {result.columnsAnonymized} columns.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Error</p>
                {result.errors && (
                  <div className="text-sm mt-2 space-y-1">
                    {result.errors.map((err: string, idx: number) => (
                      <p key={idx} className="font-mono text-xs bg-red-50 p-2 rounded">
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
