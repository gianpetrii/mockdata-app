'use client';

import { TableInfo } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Table2, Key, Link2, MessageSquare, Send, MessageCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TableSidebarProps {
  tables: TableInfo[];
  selectedTable: string | null;
  onTableSelect: (tableName: string) => void;
  showClassification: boolean;
}

export default function TableSidebar({ tables, selectedTable, onTableSelect, showClassification }: TableSidebarProps) {
  const [search, setSearch] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const filteredTables = tables.filter((table) => {
    const searchLower = search.toLowerCase();
    const tableMatch = table.name.toLowerCase().includes(searchLower);
    const columnMatch = table.columns.some(col => 
      col.name.toLowerCase().includes(searchLower)
    );
    return tableMatch || columnMatch;
  });

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isLoading) return;
    
    const userMessage = chatMessage;
    setChatHistory([...chatHistory, { role: 'user', content: userMessage }]);
    setChatMessage('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content: userMessage }],
          schema: tables,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-80 border-r bg-white h-full flex flex-col">
      <Tabs defaultValue="schema" className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schema" className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Schema
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schema" className="flex-1 flex flex-col mt-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tables or columns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredTables.map((table) => {
              const piiCount = table.piiDetection.filter((p) => p.detectedType !== 'none').length;
              const isSelected = selectedTable === table.name;
              const isExpanded = expandedTables.has(table.name);

              return (
                <div key={table.name} className="border-b">
                  <div
                    className={`flex items-center justify-between p-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-100 border-l-4 border-l-slate-600' : ''
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2 flex-1"
                      onClick={() => onTableSelect(table.name)}
                    >
                      <Table2 className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{table.name}</span>
                      <div className="flex gap-1.5 ml-auto">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {table.columns.length}
                        </Badge>
                        {piiCount > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0">
                            {piiCount} PII
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTable(table.name);
                      }}
                      className="p-1 hover:bg-slate-200 rounded ml-2"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50 px-3 py-2 space-y-1">
                  {table.columns.map((column) => {
                    const piiInfo = table.piiDetection.find(p => p.columnName === column.name);
                    const isPII = piiInfo && piiInfo.detectedType !== 'none';
                    
                    const getClassificationColor = () => {
                      if (!showClassification || !isPII) return '';
                      switch (piiInfo.classification) {
                        case 'direct_identifier': return 'bg-red-100 border-l-2 border-l-red-500';
                        case 'indirect_identifier': return 'bg-orange-100 border-l-2 border-l-orange-500';
                        case 'sensitive_data': return 'bg-purple-100 border-l-2 border-l-purple-500';
                        default: return '';
                      }
                    };
                    
                    return (
                      <div
                        key={column.name}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white text-xs transition-colors ${getClassificationColor()}`}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {column.isPrimaryKey && (
                            <Key className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                          )}
                          {table.foreignKeys.some(fk => fk.columnName === column.name) && (
                            <Link2 className="w-3 h-3 text-purple-600 flex-shrink-0" />
                          )}
                          <span className="font-mono font-medium truncate">{column.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-gray-500 text-xs">{column.type}</span>
                          {column.comment && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="hover:bg-blue-100 rounded p-0.5 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MessageCircle className="w-3 h-3 text-blue-500" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" side="right" align="start">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-blue-500" />
                                    <h4 className="font-semibold text-sm">Column Comment</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {column.comment}
                                  </p>
                                  <div className="pt-2 border-t text-xs text-muted-foreground">
                                    <span className="font-mono">{table.name}.{column.name}</span>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t bg-slate-50">
            <div className="text-xs text-gray-600">
              {filteredTables.length} of {tables.length} tables
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="font-semibold text-sm mb-1">Chat with your data</h3>
                <p className="text-xs text-gray-500">
                  Ask questions about your schema, request transformations, or get help with anonymization strategies.
                </p>
              </div>
            ) : (
              <>
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-gray-900'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about your data..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !chatMessage.trim()}
                size="icon"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Try: "What PII data do I have?" or "Suggest anonymization for customers"
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
