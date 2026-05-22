import { useCallback, useEffect, useMemo } from "react";
import dagre from "dagre";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
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
import { PRODUCT_MAP_BG } from "./constants";
import {
  PanoramicNode,
  formatPanoramicLabel,
  getPanoramicNodeHeight,
  PANORAMIC_NODE_WIDTH,
  type PanoramicNodeData,
} from "./PanoramicNode";
import { getNodeVisualColor, getStatusColor } from "@/lib/product-map-status";

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
    g.setNode(node.id, {
      width: PANORAMIC_NODE_WIDTH,
      height: getPanoramicNodeHeight(node.data.childrenColors),
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    const nodeHeight = getPanoramicNodeHeight(node.data.childrenColors);
    return {
      ...node,
      position: {
        x: pos.x - PANORAMIC_NODE_WIDTH / 2,
        y: pos.y - nodeHeight / 2,
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
  const childrenByParent = new Map<string, ProductMapNodeWithProgress[]>();
  for (const node of allNodes) {
    if (node.parent_id === null) continue;
    const siblings = childrenByParent.get(node.parent_id) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parent_id, siblings);
  }

  const nodes: PanoramicFlowNode[] = allNodes.map((n) => {
    const directChildren = (childrenByParent.get(n.id) ?? []).sort(
      (a, b) => a.position - b.position,
    );
    const childrenColors = directChildren.map(getNodeVisualColor);

    return {
    id: n.id,
    type: "panoramic",
    position: { x: 0, y: 0 },
    data: {
      label: formatPanoramicLabel(n.name, n.status, n.calculated_progress),
      fullName: n.name,
      status: n.status,
      calculatedProgress: n.calculated_progress,
      childrenCount: n.children_count,
      childrenColors,
    },
    draggable: false,
    selectable: true,
    connectable: false,
  };
  });

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
};

function PanoramicFlowInner({ nodes: allNodes, isLoading, onNodeClick }: ProductMapPanoramicProps) {
  const { fitView } = useReactFlow();

  const graph = useMemo(() => buildPanoramicGraph(allNodes), [allNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState<PanoramicFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodeById = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.15, duration: 400, minZoom: 0.05, maxZoom: 1 });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [fitView, nodes.length, edges.length]);

  const handleFitView = useCallback(() => {
    void fitView({ padding: 0.15, duration: 300, minZoom: 0.05, maxZoom: 1 });
  }, [fitView]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: PanoramicFlowNode) => {
      const selected = nodeById.get(node.id);
      if (selected) onNodeClick(selected);
    },
    [nodeById, onNodeClick],
  );

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center p-12"
        style={{ width: "100%", minHeight: CANVAS_MIN_HEIGHT_PX }}
      >
        <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-[#F2F2F2]"
      style={{ width: "100%", minHeight: CANVAS_MIN_HEIGHT_PX, height: "min(75vh, 720px)" }}
    >
      <p className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg bg-white/90 px-2.5 py-1 text-xs text-[#717B99] shadow-sm backdrop-blur-sm">
        Click en cualquier nodo para enfocarlo
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute left-3 top-3 z-10 rounded-xl border-[#E5E5E5] bg-white/95 text-[#2E2D2C] shadow-sm backdrop-blur-sm hover:bg-[#FFF0F9]"
        onClick={handleFitView}
        aria-label="Ajustar a pantalla"
      >
        <Maximize2 className="mr-1.5 h-4 w-4" />
        Ajustar
      </Button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.02}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ width: "100%", height: "100%", background: PRODUCT_MAP_BG }}
      >
        <Background color="#E5E5E5" gap={20} size={1} />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="!rounded-xl !border-[#E5E5E5] !bg-white/95 !shadow-sm"
        />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          className="!rounded-xl !border-[#E5E5E5] !bg-white/95"
          nodeColor={(node) => getStatusColor(node.data?.status ?? "untracked")}
          maskColor="rgba(250, 248, 245, 0.75)"
        />
      </ReactFlow>
    </div>
  );
}

export function ProductMapPanoramic(props: ProductMapPanoramicProps) {
  return (
    <ReactFlowProvider>
      <PanoramicFlowInner {...props} />
    </ReactFlowProvider>
  );
}
