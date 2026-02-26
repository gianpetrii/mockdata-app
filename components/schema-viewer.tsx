'use client';

import { useState } from 'react';
import { DatabaseSchema } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import TableSidebar from '@/components/table-sidebar';
import ERDiagram from '@/components/er-diagram';
import TableDetails from '@/components/table-details';
import DataGeneratorPanel from '@/components/data-generator-panel';
import DataAnonymizationPanel from '@/components/data-anonymization-panel';
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
  const [activeTab, setActiveTab] = useState('diagram');

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
        <Button variant="outline" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <TableSidebar
          tables={schema.tables}
          selectedTable={selectedTable}
          onTableSelect={setSelectedTable}
          showClassification={showClassification}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Table Details</TabsTrigger>
              <TabsTrigger value="diagram">ER Diagram</TabsTrigger>
              <TabsTrigger value="generate">Generate Data</TabsTrigger>
              <TabsTrigger value="anonymize">Anonymize Data</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 relative">
              {/* Keep all tabs mounted but hide inactive ones */}
              <div className={`absolute inset-0 overflow-hidden ${activeTab === 'details' ? 'block' : 'hidden'}`}>
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
              </div>

              <div className={`absolute inset-0 ${activeTab === 'diagram' ? 'block' : 'hidden'}`}>
                <ERDiagram
                  tables={schema.tables}
                  onTableSelect={setSelectedTable}
                  selectedTable={selectedTable}
                  showClassification={showClassification}
                  onToggleClassification={setShowClassification}
                />
              </div>

              <div className={`absolute inset-0 overflow-auto ${activeTab === 'generate' ? 'block' : 'hidden'}`}>
                <DataGeneratorPanel schema={schema} />
              </div>

              <div className={`absolute inset-0 overflow-auto ${activeTab === 'anonymize' ? 'block' : 'hidden'}`}>
                <DataAnonymizationPanel schema={schema} />
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
