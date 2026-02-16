'use client';

import { useState } from 'react';
import { api, ConnectionConfig, DatabaseSchema } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectionFormProps {
  onConnected: () => void;
  onSchemaLoaded: (schema: DatabaseSchema) => void;
}

export default function ConnectionForm({ onConnected, onSchemaLoaded }: ConnectionFormProps) {
  const [config, setConfig] = useState<ConnectionConfig>({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    database: '',
    user: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.connect(config);
      const schema = await api.getSchema();
      onSchemaLoaded(schema);
      onConnected();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Connect to Your Database</h2>
        <p className="text-muted-foreground">
          Securely connect to analyze your schema and detect sensitive data
        </p>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Database Connection</CardTitle>
          <CardDescription>
            Your credentials are never stored and only used for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnect} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-base font-semibold">Database Type</Label>
              <Select
                value={config.type}
                onValueChange={(value: 'postgres' | 'mysql') => {
                  setConfig({
                    ...config,
                    type: value,
                    port: value === 'postgres' ? 5432 : 3306,
                  });
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgres">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      PostgreSQL
                    </div>
                  </SelectItem>
                  <SelectItem value="mysql">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      MySQL
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="host" className="text-base font-semibold">Host</Label>
                <Input
                  id="host"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  placeholder="localhost"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port" className="text-base font-semibold">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="database" className="text-base font-semibold">Database Name</Label>
              <Input
                id="database"
                value={config.database}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                placeholder="my_database"
                className="h-11"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user" className="text-base font-semibold">User</Label>
                <Input
                  id="user"
                  value={config.user}
                  onChange={(e) => setConfig({ ...config, user: e.target.value })}
                  placeholder="postgres"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-11"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                'Connect to Database'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Need a test database? Try Docker: <code className="bg-muted px-2 py-1 rounded">docker run -e POSTGRES_PASSWORD=test -p 5432:5432 postgres</code></p>
      </div>
    </div>
  );
}
