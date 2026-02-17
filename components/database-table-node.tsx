'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Key, Link2, MessageCircle } from 'lucide-react';
import { TableInfo } from '@/lib/api';

interface TableNodeData {
  table: TableInfo;
  isSelected: boolean;
  showClassification: boolean;
}

function DatabaseTableNode({ data, selected }: NodeProps<TableNodeData>) {
  const { table, isSelected, showClassification } = data;
  const displayColumns = table.columns.slice(0, 6);
  const hasMore = table.columns.length > 6;

  return (
    <div
      className={`bg-white rounded-lg border transition-all ${
        isSelected 
          ? 'border-2 border-slate-600 shadow-lg ring-4 ring-slate-200' 
          : 'border border-slate-200 shadow-sm'
      }`}
      style={{ 
        width: '280px',
        position: 'relative',
        zIndex: isSelected ? 10 : 1,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="font-semibold text-sm text-slate-900">
          {table.name}
        </div>
      </div>

      {/* Columns */}
      <div className="divide-y divide-slate-100">
        {displayColumns.map((column, idx) => {
          const piiInfo = table.piiDetection.find(p => p.columnName === column.name);
          const isPII = piiInfo && piiInfo.detectedType !== 'none';
          const isForeignKey = table.foreignKeys.some(fk => fk.columnName === column.name);

          const getClassificationBg = () => {
            if (!showClassification || !isPII) return '';
            switch (piiInfo.classification) {
              case 'direct_identifier': return 'bg-red-100';
              case 'indirect_identifier': return 'bg-orange-100';
              case 'sensitive_data': return 'bg-purple-100';
              default: return '';
            }
          };

          return (
            <div
              key={column.name}
              className={`px-3 py-2 flex items-center justify-between gap-3 relative ${getClassificationBg()}`}
              title={column.comment || undefined}
            >
              {/* Left handle for incoming connections */}
              <Handle
                type="target"
                position={Position.Left}
                id={column.name}
                style={{
                  width: 8,
                  height: 8,
                  background: isForeignKey ? '#a855f7' : '#94a3b8',
                  border: '2px solid white',
                  left: -5,
                }}
              />

              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {column.isPrimaryKey && (
                  <Key className="w-3 h-3 text-slate-400 flex-shrink-0" />
                )}
                {isForeignKey && (
                  <Link2 className="w-3 h-3 text-purple-500 flex-shrink-0" />
                )}
                <span className="text-xs text-slate-700 truncate font-mono">
                  {column.name}
                </span>
                {showClassification && isPII && (
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    piiInfo.classification === 'direct_identifier' ? 'bg-red-500' :
                    piiInfo.classification === 'indirect_identifier' ? 'bg-orange-500' :
                    'bg-purple-500'
                  }`} />
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[11px] text-slate-500 font-mono">
                  {column.type.split('(')[0].substring(0, 10)}
                </span>
                {column.comment && (
                  <MessageCircle className="w-3 h-3 text-blue-500" />
                )}
              </div>

              {/* Right handle for outgoing connections */}
              <Handle
                type="source"
                position={Position.Right}
                id={column.name}
                style={{
                  width: 8,
                  height: 8,
                  background: column.isPrimaryKey ? '#4f46e5' : '#94a3b8',
                  border: '2px solid white',
                  right: -5,
                }}
              />
            </div>
          );
        })}
        {hasMore && (
          <div className="px-3 py-1.5 text-[10px] text-slate-400 text-center">
            +{table.columns.length - 6} more columns
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(DatabaseTableNode);
