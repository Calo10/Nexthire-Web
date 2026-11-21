import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type XYPosition,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import WorkflowStepNode from './WorkflowStepNode';
import type { WorkflowStepNodeData } from '../mappers/workflowGraphMapper';
import { isBranchActivity } from '../models/activityCatalog';

type Props = {
  nodes: Node<WorkflowStepNodeData>[];
  edges: Edge[];
  readOnly: boolean;
  onNodesChange: OnNodesChange<Node<WorkflowStepNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnectEdges: (edges: Edge[]) => void;
  onCommitNodePosition: (nodeId: string, position: XYPosition) => void;
  onSelectStep: (stepId: string | null) => void;
};

const nodeTypes: NodeTypes = {
  workflowStep: WorkflowStepNode,
};

function CanvasInner({
  nodes,
  edges,
  readOnly,
  onNodesChange,
  onEdgesChange,
  onConnectEdges,
  onCommitNodePosition,
  onSelectStep,
}: Props) {
  const { fitView } = useReactFlow();

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep' as const,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    }),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly || !connection.source || !connection.target) return;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      if (!sourceNode) return;

      let nextEdges = edges.filter((edge) => {
        if (edge.source !== connection.source) return true;
        if (isBranchActivity(sourceNode.data.activityType)) {
          return edge.sourceHandle !== connection.sourceHandle;
        }
        return edge.data?.kind !== 'next' && edge.sourceHandle !== 'out';
      });

      const isBranch = isBranchActivity(sourceNode.data.activityType);
      const transitionKey = connection.sourceHandle?.startsWith('transition:')
        ? connection.sourceHandle.slice('transition:'.length)
        : undefined;

      const newEdge: Edge = {
        ...connection,
        id: isBranch
          ? `${connection.source}|transition:${transitionKey}|${connection.target}`
          : `${connection.source}|next|${connection.target}`,
        type: 'smoothstep',
        data: isBranch
          ? { kind: 'transition', key: transitionKey }
          : { kind: 'next' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        label: isBranch ? transitionKey : undefined,
      };

      nextEdges = addEdge(newEdge, nextEdges);
      onConnectEdges(nextEdges);
    },
    [edges, nodes, onConnectEdges, readOnly],
  );

  return (
    <div className="flex-1 min-w-0 min-h-0 bg-[#F4F7FB]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          onSelectStep(node.id);
        }}
        onPaneClick={() => {
          onSelectStep(null);
        }}
        onNodeDragStop={(_, node) => {
          onCommitNodePosition(node.id, node.position);
        }}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
        onInit={() => {
          window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
        }}
      >
        <Background gap={18} size={1} color="#D7DEE8" />
        <Controls showInteractive={!readOnly} />
        <MiniMap pannable zoomable className="!bg-white !border !border-gray-200 !rounded-lg" />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
