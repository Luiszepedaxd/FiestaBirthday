import { useCallback, useEffect, useMemo } from "react";
import dagre from "dagre";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductMapNodeWithProgress } from "@/types/product-map";
import { PRODUCT_MAP_CANVAS_FRAME_CLASS, PRODUCT_MAP_CANVAS_INNER_CLASS } from "./constants";
import {
  PanoramicNode,
  formatPanoramicLabel,
  PANORAMIC_NODE_HEIGHT,
  PANORAMIC_NODE_WIDTH,
  type PanoramicNodeData,
} from "./PanoramicNode";
import { getStatusColor } from "@/lib/product-map-status";

const CANVAS_MIN_HEIGHT_PX = 560;

const nodeTypes = {
  panoramic: PanoramicNode,
};

type PanoramicFlowNode = Node<PanoramicNodeData, "panoramic">;

function applyDagreLayout(
  nodes: PanoramicFlowNode[],
  edges: Edge[],
): { nodes: PanoramicFlowNode[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: PANORAMIC_NODE_WIDTH, height: PANORAMIC_NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - PANORAMIC_NODE_WIDTH / 2,
        y: pos.y - PANORAMIC_NODE_HEIGHT / 2,
      },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });

  return { nodes: layoutedNodes, edges };
}

function buildPanoramicGraph(allNodes: ProductMapNodeWithProgress[]): {
  nodes: PanoramicFlowNode[];
  edges: Edge[];
} {
  const nodes: PanoramicFlowNode[] = allNodes.map((n) => ({
    id: n.id,
    type: "panoramic",
    position: { x: 0, y: 0 },
    data: {
      label: formatPanoramicLabel(n.name, n.status, n.calculated_progress),
      fullName: n.name,
      status: n.status,
      calculatedProgress: n.calculated_progress,
      childrenCount: n.children_count,
      hasNotes: n.has_notes,
      timeHealth: n.time_health,
    },
    draggable: false,
    selectable: true,
    connectable: false,
  }));

  const edges: Edge[] = allNodes
    .filter((n) => n.parent_id !== null)
    .map((n) => ({
      id: `edge-${n.parent_id}-${n.id}`,
      source: n.parent_id as string,
      target: n.id,
      style: { stroke: "#D1D5DB", strokeWidth: 1.5 },
      animated: false,
    }));

  return applyDagreLayout(nodes, edges);
}

export type ProductMapPanoramicProps = {
  nodes: ProductMapNodeWithProgress[];
  isLoading: boolean;
  onNodeClick: (node: ProductMapNodeWithProgress) => void;
  onNodeDoubleClick?: (node: ProductMapNodeWithProgress) => void;
};

function PanoramicCanvasInner({
  nodes: allNodes,
  isLoading,
  onNodeClick,
  onNodeDoubleClick,
}: ProductMapPanoramicProps) {
  const { fitView } = useReactFlow();

  const graph = useMemo(() => buildPanoramicGraph(allNodes), [allNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState<PanoramicFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.2, duration: 300, minZoom: 0.15, maxZoom: 1 });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [fitView, nodes, edges, allNodes.length]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<PanoramicNodeData>) => {
      const selected = allNodes.find((n) => n.id === node.id);
      if (selected) onNodeClick(selected);
    },
    [allNodes, onNodeClick],
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node<PanoramicNodeData>) => {
      const selected = allNodes.find((n) => n.id === node.id);
      if (selected) onNodeDoubleClick?.(selected);
    },
    [allNodes, onNodeDoubleClick],
  );

  if (isLoading) {
    return (
      <div className={PRODUCT_MAP_CANVAS_FRAME_CLASS}>
        <div
          className={`${PRODUCT_MAP_CANVAS_INNER_CLASS} flex items-center justify-center p-12`}
          style={{ minHeight: CANVAS_MIN_HEIGHT_PX }}
        >
          <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={PRODUCT_MAP_CANVAS_FRAME_CLASS}>
      <div
        className={`${PRODUCT_MAP_CANVAS_INNER_CLASS} relative`}
        style={{ minHeight: CANVAS_MIN_HEIGHT_PX, height: "min(70vh, 720px)" }}
      >
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
        >
          <Controls
          showInteractive={false}
          className="!rounded-xl !border-[#E5E5E5] !bg-white !shadow-sm"
        />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as PanoramicNodeData;
            if (d.status === "untracked" || d.calculatedProgress === null) {
              return getStatusColor("untracked");
            }
            return d.childrenCount > 0
              ? getStatusColor("development")
              : getStatusColor(d.status);
          }}
          className="!rounded-xl !border-[#E5E5E5] !bg-white/90"
          maskColor="rgba(250, 248, 245, 0.75)"
        />
        </ReactFlow>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 z-10 h-9 w-9 rounded-xl border-[#E5E5E5] bg-white shadow-sm"
          onClick={() => void fitView({ padding: 0.2, duration: 300 })}
          aria-label="Ajustar vista"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProductMapPanoramic(props: ProductMapPanoramicProps) {
  return (
    <ReactFlowProvider>
      <PanoramicCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
