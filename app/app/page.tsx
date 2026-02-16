'use client';

import { useState } from 'react';
import ConnectionForm from '@/components/connection-form';
import SchemaViewer from '@/components/schema-viewer';
import { DatabaseSchema } from '@/lib/api';

export default function AppPage() {
  const [connected, setConnected] = useState(false);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {!connected ? (
          <ConnectionForm 
            onConnected={() => setConnected(true)}
            onSchemaLoaded={setSchema}
          />
        ) : (
          <SchemaViewer 
            schema={schema}
            onDisconnect={() => {
              setConnected(false);
              setSchema(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
