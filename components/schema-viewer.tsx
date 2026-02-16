'use client';

import { useState } from 'react';
import { DatabaseSchema } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import TableSidebar from '@/components/table-sidebar';
import ERDiagram from '@/components/er-diagram';
import TableDetails from '@/components/table-details';
import ClassificationToggle from '@/components/classification-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SchemaViewerProps {
  schema: DatabaseSchema | null;
  onDisconnect: () => void;
}

export default function SchemaViewer({ schema, onDisconnect }: SchemaViewerProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(
    schema?.tables[0]?.name || null
  );
  const [showClassification, setShowClassification] = useState(false);

  const handleDisconnect = async () => {
    await api.disconnect();
    onDisconnect();
  };

  if (!schema) {
    return <div>Loading schema...</div>;
  }

  const selectedTableData = schema.tables.find((t) => t.name === selectedTable);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Database Schema</h2>
          <p className="text-sm text-muted-foreground">
            {schema.tables.length} tables detected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClassificationToggle 
            enabled={showClassification}
            onToggle={setShowClassification}
          />
          <Button variant="outline" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <TableSidebar
          tables={schema.tables}
          selectedTable={selectedTable}
          onTableSelect={setSelectedTable}
          showClassification={showClassification}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Tabs defaultValue="diagram" className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="diagram">ER Diagram</TabsTrigger>
              <TabsTrigger value="details">Table Details</TabsTrigger>
            </TabsList>

            <TabsContent value="diagram" className="flex-1 min-h-0 mt-0">
              <ERDiagram
                tables={schema.tables}
                onTableSelect={setSelectedTable}
                selectedTable={selectedTable}
                showClassification={showClassification}
              />
            </TabsContent>

            <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
              {selectedTableData ? (
                <TableDetails 
                  table={selectedTableData}
                  showClassification={showClassification}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a table from the sidebar
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
