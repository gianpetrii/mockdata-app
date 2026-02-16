'use client';

import { TableInfo } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TableDetailsProps {
  table: TableInfo;
}

export default function TableDetails({ table }: TableDetailsProps) {
  return (
    <div className="p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{table.name}</h2>
        <div className="flex gap-2">
          <Badge variant="secondary">{table.columns.length} columns</Badge>
          <Badge variant="outline">{table.primaryKeys.length} primary keys</Badge>
          <Badge variant="outline">{table.foreignKeys.length} foreign keys</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Columns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {table.columns.map((column) => {
              const piiInfo = table.piiDetection.find((p) => p.columnName === column.name);
              const isPII = piiInfo && piiInfo.detectedType !== 'none';

              return (
                <div
                  key={column.name}
                  className={`p-3 rounded-lg border-2 ${
                    isPII ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">{column.name}</span>
                      {column.isPrimaryKey && (
                        <Badge variant="default" className="text-xs">
                          PK
                        </Badge>
                      )}
                      {column.isUnique && (
                        <Badge variant="outline" className="text-xs">
                          UNIQUE
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {column.nullable ? 'nullable' : 'not null'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-xs bg-white px-2 py-1 rounded border">
                      {column.type}
                      {column.maxLength ? `(${column.maxLength})` : ''}
                    </code>
                    {column.defaultValue && (
                      <span className="text-xs text-muted-foreground">
                        default: {column.defaultValue}
                      </span>
                    )}
                  </div>

                  {isPII && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          PII: {piiInfo.detectedType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {piiInfo.confidence} confidence - {piiInfo.reason}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {table.foreignKeys.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Foreign Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {table.foreignKeys.map((fk, idx) => (
                <div key={idx} className="p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <div className="font-mono text-sm mb-1">
                    <span className="font-semibold">{fk.columnName}</span>
                    <span className="text-muted-foreground mx-2">→</span>
                    <span className="font-semibold">
                      {fk.referencedTable}.{fk.referencedColumn}
                    </span>
                  </div>
                  {(fk.onDelete || fk.onUpdate) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {fk.onDelete && <span>ON DELETE: {fk.onDelete}</span>}
                      {fk.onUpdate && <span className="ml-3">ON UPDATE: {fk.onUpdate}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
