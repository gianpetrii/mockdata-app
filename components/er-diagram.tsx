'use client';

import { useCallback, useMemo } from 'react';
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
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ERDiagramProps {
  tables: TableInfo[];
  onTableSelect: (tableName: string) => void;
  selectedTable: string | null;
}

function ERDiagramInner({ tables, onTableSelect, selectedTable }: ERDiagramProps) {
  const { getNodes } = useReactFlow();

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
      const piiCount = table.piiDetection.filter(p => p.detectedType !== 'none').length;
      const isSelected = selectedTable === table.name;

      return {
        id: table.name,
        type: 'default',
        position: {
          x: (index % 3) * 350,
          y: Math.floor(index / 3) * 250,
        },
        data: {
          label: (
            <div className="px-4 py-3">
              <div className="font-bold text-sm mb-2">{table.name}</div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {table.columns.length} cols
                </Badge>
                {piiCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {piiCount} PII
                  </Badge>
                )}
                {table.foreignKeys.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {table.foreignKeys.length} FK
                  </Badge>
                )}
              </div>
            </div>
          ),
        },
        style: {
          background: isSelected ? '#4f46e5' : 'white',
          color: isSelected ? 'white' : 'black',
          border: isSelected ? '2px solid #4338ca' : '2px solid #e5e7eb',
          borderRadius: '8px',
          width: 200,
          cursor: 'pointer',
        },
      };
    });
  }, [tables, selectedTable]);

  // Convert foreign keys to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    tables.forEach((table) => {
      table.foreignKeys.forEach((fk, index) => {
        edges.push({
          id: `${table.name}-${fk.referencedTable}-${index}`,
          source: table.name,
          target: fk.referencedTable,
          type: 'smoothstep',
          animated: false,
          label: fk.columnName,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            stroke: '#4f46e5',
            strokeWidth: 2,
          },
          labelStyle: {
            fontSize: 10,
            fill: '#6b7280',
          },
        });
      });
    });
    return edges;
  }, [tables]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onTableSelect(node.id);
    },
    [onTableSelect]
  );

  // Update nodes when selection changes
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  return (
    <div className="w-full h-full bg-slate-50 rounded-lg border-2 relative">
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={downloadImage}
          size="sm"
          variant="secondary"
          className="bg-white shadow-md hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Diagram
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.id === selectedTable ? '#4f46e5' : '#e5e7eb';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
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
