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
import { Button } from '@/components/ui/button';
import { Download, Info, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import DatabaseTableNode from '@/components/database-table-node';
import CustomEdge from '@/components/custom-edge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getLayoutedElements } from '@/lib/layout';

interface ERDiagramProps {
  tables: TableInfo[];
  onTableSelect: (tableName: string) => void;
  selectedTable: string | null;
  showClassification: boolean;
  onToggleClassification: (enabled: boolean) => void;
}

const edgeOptions = {
  style: { strokeWidth: 1.5, stroke: '#cbd5e1' },
  type: 'custom',
  markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#cbd5e1' },
};

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

function ERDiagramInner({ tables, onTableSelect, selectedTable, showClassification, onToggleClassification }: ERDiagramProps) {
  const { getNodes } = useReactFlow();
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImage = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    setIsDownloading(true);
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
        setTimeout(() => setIsDownloading(false), 1000);
      })
      .catch((err) => {
        console.error('Failed to download diagram:', err);
        setIsDownloading(false);
      });
  }, []);
  
  // Convert tables to React Flow nodes with custom node type
  const initialNodes: Node[] = useMemo(() => {
    const nodes = tables.map((table) => {
      const isSelected = selectedTable === table.name;

      return {
        id: table.name,
        type: 'databaseTable',
        position: { x: 0, y: 0 }, // Will be set by layout algorithm
        data: {
          table,
          isSelected,
          showClassification,
        },
      };
    });
    
    return nodes;
  }, [tables, showClassification, selectedTable]);

  // Convert foreign keys to React Flow edges with column-specific handles
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    tables.forEach((table) => {
      table.foreignKeys.forEach((fk, index) => {
        const edgeId = `${table.name}-${fk.columnName}-${fk.referencedTable}-${fk.referencedColumn}`;
        const isSelected = selectedEdge === edgeId;
        
        edges.push({
          id: edgeId,
          source: table.name,
          target: fk.referencedTable,
          sourceHandle: fk.columnName,
          targetHandle: fk.referencedColumn,
          type: 'custom',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: isSelected ? '#64748b' : '#cbd5e1',
          },
          style: {
            stroke: isSelected ? '#64748b' : '#cbd5e1',
            strokeWidth: isSelected ? 2.5 : 1.5,
            cursor: 'pointer',
          },
          // Enable edge routing around nodes
          pathOptions: { 
            offset: 20,
            borderRadius: 10,
          },
        });
      });
    });
    return edges;
  }, [tables, selectedEdge]);

  // Apply automatic layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, 'TB');
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

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

  // Update node data when selection or classification changes, preserving positions
  useMemo(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const table = tables.find((t) => t.name === node.id);
        if (!table) return node;
        
        return {
          ...node,
          data: {
            table,
            isSelected: selectedTable === node.id,
            showClassification,
          },
        };
      })
    );
  }, [selectedTable, showClassification, tables, setNodes]);

  // Update edges when selection changes
  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="w-full h-full bg-white rounded-lg relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border flex items-center divide-x h-10">
          <div className="flex items-center gap-2 px-3 h-full">
            <Switch
              id="classification-toggle"
              checked={showClassification}
              onCheckedChange={onToggleClassification}
            />
            <Label htmlFor="classification-toggle" className="text-sm font-medium cursor-pointer">
              Data Classification
            </Label>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`px-3 h-full hover:bg-gray-50 transition-colors ${
                  showClassification ? 'text-indigo-600' : 'text-gray-300'
                }`}
                disabled={!showClassification}
              >
                <Info className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="bottom" align="end">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Data Classification Types</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Understanding sensitivity levels for data protection
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded bg-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Direct Identifier</div>
                      <div className="text-xs text-muted-foreground">
                        Uniquely identifies a person: email, SSN, name, phone
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded bg-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Indirect Identifier</div>
                      <div className="text-xs text-muted-foreground">
                        Can identify when combined: DOB, address, IP, zip code
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded bg-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Sensitive Data</div>
                      <div className="text-xs text-muted-foreground">
                        Requires protection: salary, medical, financial data
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <button
          onClick={downloadImage}
          disabled={isDownloading}
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border rounded-lg w-10 h-10 flex items-center justify-center transition-all disabled:opacity-50"
          title="Download diagram"
        >
          {isDownloading ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Download className="w-4 h-4 text-gray-700" />
          )}
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={edgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        edgesUpdatable={false}
        edgesFocusable={true}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        elevateEdgesOnSelect={true}
        connectionLineType="default"
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
