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
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import DatabaseTableNode from '@/components/database-table-node';
import ClassificationLegend from '@/components/classification-legend';

interface ERDiagramProps {
  tables: TableInfo[];
  onTableSelect: (tableName: string) => void;
  selectedTable: string | null;
  showClassification: boolean;
}

const edgeOptions = {
  style: { strokeWidth: 1.5, stroke: '#cbd5e1' },
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#cbd5e1' },
};

const nodeTypes = {
  databaseTable: DatabaseTableNode,
};

function ERDiagramInner({ tables, onTableSelect, selectedTable, showClassification }: ERDiagramProps) {
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
  
  // Convert tables to React Flow nodes with custom node type
  const initialNodes: Node[] = useMemo(() => {
    return tables.map((table, index) => {
      const isSelected = selectedTable === table.name;

      return {
        id: table.name,
        type: 'databaseTable',
        position: {
          x: (index % 3) * 340,
          y: Math.floor(index / 3) * 280,
        },
        data: {
          table,
          isSelected,
          showClassification,
        },
      };
    });
  }, [tables, showClassification]);

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
          type: 'smoothstep',
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
        {showClassification && <ClassificationLegend />}
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
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        elevateEdgesOnSelect={true}
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
