'use client';

import { TableInfo } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search } from 'lucide-react';

interface TableSidebarProps {
  tables: TableInfo[];
  selectedTable: string | null;
  onTableSelect: (tableName: string) => void;
}

export default function TableSidebar({ tables, selectedTable, onTableSelect }: TableSidebarProps) {
  const [search, setSearch] = useState('');

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 border-r bg-white h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-3">Tables</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredTables.map((table) => {
          const piiCount = table.piiDetection.filter((p) => p.detectedType !== 'none').length;
          const isSelected = selectedTable === table.name;

          return (
            <button
              key={table.name}
              onClick={() => onTableSelect(table.name)}
              className={`w-full text-left p-4 border-b hover:bg-slate-50 transition-colors ${
                isSelected ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
              }`}
            >
              <div className="font-medium text-sm mb-2">{table.name}</div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {table.columns.length} columns
                </Badge>
                {piiCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {piiCount} PII
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t bg-slate-50">
        <div className="text-xs text-muted-foreground">
          {filteredTables.length} of {tables.length} tables
        </div>
      </div>
    </div>
  );
}
