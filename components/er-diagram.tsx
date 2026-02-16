'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TableInfo } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Key, Link2 } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ERDiagramProps {
  tables: TableInfo[];
  onTableSelect: (tableName: string) => void;
  selectedTable: string | null;
}

function ERDiagramInner({ tables, onTableSelect, selectedTable }: ERDiagramProps) {
  const { getNodes } = useReactFlow();
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);

  const downloadImage = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    toPng(viewport, {
      backgroundColor: '#f8fafc',
      width: viewport.offsetWidth,
      height: viewport.offsetHeight,
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'er-diagram.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to download diagram:', err);
      });
  }, []);
  // Convert tables to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return tables.map((table, index) => {
      const isSelected = selectedTable === table.name;
      // Show max 6 columns in diagram
      const displayColumns = table.columns.slice(0, 6);
      const hasMore = table.columns.length > 6;

      return {
        id: table.name,
        type: 'default',
        position: {
          x: (index % 3) * 340,
          y: Math.floor(index / 3) * 260,
        },
        data: {
          label: (
            <div style={{ width: '280px' }}>
              {/* Header */}
              <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200">
                <div className="font-semibold text-sm text-slate-900">
                  {table.name}
                </div>
              </div>
              
              {/* Columns */}
              <div className="divide-y divide-slate-100">
                {displayColumns.map((column) => {
                  const piiInfo = table.piiDetection.find(p => p.columnName === column.name);
                  const isPII = piiInfo && piiInfo.detectedType !== 'none';
                  
                  return (
                    <div 
                      key={column.name} 
                      id={`${table.name}-${column.name}`}
                      className="px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {column.isPrimaryKey && (
                          <Key className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        )}
                        {table.foreignKeys.some(fk => fk.columnName === column.name) && (
                          <Link2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-xs text-slate-700 truncate font-mono">
                          {column.name}
                        </span>
                        {isPII && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">
                        {column.type.split('(')[0].substring(0, 10)}
                      </span>
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
          ),
        },
        style: {
          background: 'white',
          border: isSelected ? '2px solid #64748b' : '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: isSelected 
            ? '0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(148, 163, 184, 0.2)' 
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
          cursor: 'pointer',
          padding: 0,
          width: 280,
        },
      };
    });
  }, [tables, selectedTable]);

  // Convert foreign keys to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    tables.forEach((table) => {
      table.foreignKeys.forEach((fk, index) => {
        const edgeId = `${table.name}-${fk.referencedTable}-${index}`;
        const isSelected = selectedEdge === edgeId;
        
        edges.push({
          id: edgeId,
          source: table.name,
          target: fk.referencedTable,
          sourceHandle: `${table.name}-${fk.columnName}`,
          targetHandle: `${fk.referencedTable}-${fk.referencedColumn}`,
          type: 'smoothstep',
          animated: false,
          label: `${fk.columnName} → ${fk.referencedColumn}`,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: isSelected ? '#64748b' : '#cbd5e1',
          },
          style: {
            stroke: isSelected ? '#64748b' : '#cbd5e1',
            strokeWidth: isSelected ? 2.5 : 1.5,
            cursor: 'pointer',
          },
          labelStyle: {
            fontSize: 10,
            fill: isSelected ? '#475569' : '#94a3b8',
            fontWeight: isSelected ? 600 : 400,
            background: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
          },
          labelBgStyle: {
            fill: 'white',
            fillOpacity: 0.9,
          },
        });
      });
    });
    return edges;
  }, [tables, selectedEdge]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onTableSelect(node.id);
      setSelectedEdge(null);
    },
    [onTableSelect]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge.id);
    },
    []
  );

  // Update nodes when selection changes
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Update edges when selection changes
  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="w-full h-full bg-white rounded-lg relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={downloadImage}
          size="sm"
          variant="secondary"
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border-0"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background 
          color="#f1f5f9" 
          gap={20}
          size={1}
        />
        <Controls className="bg-white/90 backdrop-blur-sm border-0 shadow-lg" />
        <MiniMap
          nodeColor={(node) => {
            return node.id === selectedTable ? '#64748b' : '#e2e8f0';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          className="bg-white/90 backdrop-blur-sm border-0 shadow-lg"
        />
      </ReactFlow>
    </div>
  );
}

export default function ERDiagram(props: ERDiagramProps) {
  return (
    <ReactFlowProvider>
      <ERDiagramInner {...props} />
    </ReactFlowProvider>
  );
}
