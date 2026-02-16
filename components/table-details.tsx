'use client';

import { useState } from 'react';
import { TableInfo } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Key, Link2, AlertCircle } from 'lucide-react';

interface TableDetailsProps {
  table: TableInfo;
  showClassification: boolean;
}

export default function TableDetails({ table, showClassification }: TableDetailsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['columns']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const piiColumns = table.piiDetection.filter(p => p.detectedType !== 'none').length;

  return (
    <div className="p-6 overflow-y-auto bg-slate-50">
      {/* Header */}
      <div className="mb-6 bg-white p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-3">{table.name}</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            {table.columns.length} columns
          </Badge>
          <Badge variant="outline" className="text-sm">
            {table.primaryKeys.length} PKs
          </Badge>
          <Badge variant="outline" className="text-sm">
            {table.foreignKeys.length} FKs
          </Badge>
          {piiColumns > 0 && (
            <Badge variant="destructive" className="text-sm">
              {piiColumns} PII fields
            </Badge>
          )}
        </div>
      </div>

      {/* Columns Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b">
          <h3 className="font-semibold text-sm">Columns</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {table.columns.map((column) => {
            const piiInfo = table.piiDetection.find((p) => p.columnName === column.name);
            const isPII = piiInfo && piiInfo.detectedType !== 'none';
            const isForeignKey = table.foreignKeys.some(fk => fk.columnName === column.name);

            const getClassificationBg = () => {
              if (!showClassification || !isPII) return isPII ? 'bg-red-50/50' : '';
              switch (piiInfo.classification) {
                case 'direct_identifier': return 'bg-red-50 border-l-4 border-l-red-500';
                case 'indirect_identifier': return 'bg-orange-50 border-l-4 border-l-orange-500';
                case 'sensitive_data': return 'bg-purple-50 border-l-4 border-l-purple-500';
                default: return '';
              }
            };

            return (
              <div
                key={column.name}
                className={`px-4 py-3 hover:bg-slate-50 transition-colors ${getClassificationBg()}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {column.isPrimaryKey && (
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    {isForeignKey && (
                      <Link2 className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className="font-mono font-semibold text-sm">{column.name}</span>
                    {column.isUnique && (
                      <Badge variant="outline" className="text-xs h-5">
                        UNIQUE
                      </Badge>
                    )}
                    {isPII && (
                      <Badge variant="destructive" className="text-xs h-5">
                        PII
                      </Badge>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    column.nullable 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-slate-200 text-slate-700 font-medium'
                  }`}>
                    {column.nullable ? 'nullable' : 'required'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 ml-6 flex-wrap">
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded">
                    {column.type}
                    {column.maxLength ? `(${column.maxLength})` : ''}
                  </code>
                  {column.defaultValue && (
                    <span>
                      default: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{column.defaultValue}</code>
                    </span>
                  )}
                  {column.comment && (
                    <span className="text-slate-500 italic">
                      {column.comment}
                    </span>
                  )}
                  {isPII && (
                    <span className="text-red-600">
                      {piiInfo.detectedType} · {piiInfo.confidence} confidence
                    </span>
                  )}
                  {showClassification && isPII && (
                    <Badge variant="outline" className="text-xs">
                      {piiInfo.classification === 'direct_identifier' ? 'Direct Identifier' :
                       piiInfo.classification === 'indirect_identifier' ? 'Indirect Identifier' :
                       'Sensitive Data'}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Foreign Keys Section */}
      {table.foreignKeys.length > 0 && (
        <div className="bg-white rounded-lg border">
          <button
            onClick={() => toggleSection('foreignKeys')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSections.has('foreignKeys') ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
              <h3 className="font-semibold text-lg">Foreign Keys</h3>
              <Badge variant="secondary">{table.foreignKeys.length}</Badge>
            </div>
          </button>

          {expandedSections.has('foreignKeys') && (
            <div className="px-4 pb-4 space-y-2">
              {table.foreignKeys.map((fk, idx) => (
                <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-purple-600" />
                    <div className="font-mono text-sm">
                      <span className="font-semibold text-purple-900">{fk.columnName}</span>
                      <span className="text-gray-500 mx-2">→</span>
                      <span className="font-semibold text-purple-900">
                        {fk.referencedTable}.{fk.referencedColumn}
                      </span>
                    </div>
                  </div>
                  {(fk.onDelete || fk.onUpdate) && (
                    <div className="flex gap-3 text-xs text-purple-700 ml-6">
                      {fk.onDelete && (
                        <span className="bg-purple-100 px-2 py-1 rounded">
                          ON DELETE: {fk.onDelete}
                        </span>
                      )}
                      {fk.onUpdate && (
                        <span className="bg-purple-100 px-2 py-1 rounded">
                          ON UPDATE: {fk.onUpdate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
