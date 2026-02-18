'use client';

import { useState } from 'react';
import { api, ConnectionConfig, DatabaseSchema } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { useConnections, SavedConnection } from '@/lib/hooks/useConnections';
import { Database, Trash2, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface ConnectionFormProps {
  onConnected: () => void;
  onSchemaLoaded: (schema: DatabaseSchema) => void;
}

export default function ConnectionForm({ onConnected, onSchemaLoaded }: ConnectionFormProps) {
  const { user } = useAuth();
  const { connections, loading: connectionsLoading, saveConnection, deleteConnection } = useConnections(user?.uid || null);
  
  const [config, setConfig] = useState<ConnectionConfig>({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    database: '',
    user: '',
    password: '',
  });
  const [connectionName, setConnectionName] = useState('');
  const [shouldSave, setShouldSave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(user && connections.length > 0 ? "saved" : "new");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.connect(config);
      const schema = await api.getSchema();
      
      // Save connection if user is logged in and checkbox is checked
      if (user && shouldSave && connectionName.trim()) {
        await saveConnection(connectionName, config);
      }
      
      onSchemaLoaded(schema);
      onConnected();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadConnection = (conn: SavedConnection) => {
    // Load connection config and switch to "new" tab
    const configWithPassword = {
      type: conn.type,
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.user,
      password: '', // User needs to provide password
    };
    
    setConfig(configWithPassword);
    setConnectionName(conn.name);
    setError('Connection loaded. Please enter the password to connect.');
    setActiveTab('new');
  };

  const handleDeleteConnection = async (id: string) => {
    if (confirm('Are you sure you want to delete this saved connection?')) {
      await deleteConnection(id);
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Database Connection</CardTitle>
            <CardDescription>
              Connect to your database to analyze and anonymize data
            </CardDescription>
            {user && (
              <TabsList className="grid w-full grid-cols-2 mt-4">
                <TabsTrigger value="saved">Saved Connections</TabsTrigger>
                <TabsTrigger value="new">New Connection</TabsTrigger>
              </TabsList>
            )}
          </CardHeader>
          
          <CardContent>
            {user && (
              <TabsContent value="saved" className="space-y-4">
                {connectionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading connections...
                  </div>
                ) : connections.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-muted-foreground mb-2">No saved connections yet</p>
                    <p className="text-sm text-gray-500">Create a new connection to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connections.map((conn) => (
                      <Card key={conn.id} className="hover:border-indigo-200 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Database className="w-4 h-4 text-indigo-600" />
                                <h3 className="font-semibold">{conn.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  conn.type === 'postgres' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {conn.type === 'postgres' ? 'PostgreSQL' : 'MySQL'}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>{conn.user}@{conn.host}:{conn.port}/{conn.database}</p>
                                <div className="flex items-center gap-1 text-xs">
                                  <Clock className="w-3 h-3" />
                                  {conn.createdAt?.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleLoadConnection(conn)}
                                disabled={loading}
                              >
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteConnection(conn.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
            
            <TabsContent value="new">
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

            {user && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save-connection"
                    checked={shouldSave}
                    onCheckedChange={(checked) => setShouldSave(checked as boolean)}
                  />
                  <Label
                    htmlFor="save-connection"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Save this connection for later
                  </Label>
                </div>
                {shouldSave && (
                  <div className="space-y-2">
                    <Label htmlFor="connection-name">Connection Name</Label>
                    <Input
                      id="connection-name"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      placeholder="My Production DB"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Password will not be saved for security
                    </p>
                  </div>
                )}
              </div>
            )}

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
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Need a test database? Try Docker: <code className="bg-muted px-2 py-1 rounded">docker run -e POSTGRES_PASSWORD=test -p 5432:5432 postgres</code></p>
      </div>
    </div>
  );
}
