import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { ProductMapNodeWithProgress, ProductMapStatus } from "@/types/product-map";
import { ProductMapNodeBubble } from "./ProductMapNode";
import { PRODUCT_MAP_BG } from "./constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CENTER_NODE_ID = "__center__";
const CANVAS_HEIGHT_PX = 520;

type FlowNodeData = {
  label: string;
  status: ProductMapStatus;
  calculatedProgress: number | null;
  isCenter: boolean;
  animationDelay: number;
  childrenCount: number;
};

type ProductMapFlowNodeType = Node<FlowNodeData, "productMapBubble">;

const NODE_DIMENSIONS = {
  center: 144,
  child: 96,
} as const;

function ProductMapFlowNode({ data }: NodeProps<ProductMapFlowNodeType>) {
  const size = data.isCenter ? NODE_DIMENSIONS.center : NODE_DIMENSIONS.child;

  return (
    <div
      className="nodrag nopan flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!pointer-events-none !opacity-0 !h-0 !w-0 !min-h-0 !min-w-0 !border-0"
      />
      <ProductMapNodeBubble
        name={data.label}
        status={data.status}
        calculatedProgress={data.calculatedProgress}
        isCenter={data.isCenter}
        childrenCount={data.childrenCount}
        size={data.isCenter ? "lg" : "md"}
        animationDelay={data.animationDelay ?? 0}
        variant="flow"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!pointer-events-none !opacity-0 !h-0 !w-0 !min-h-0 !min-w-0 !border-0"
      />
    </div>
  );
}

const nodeTypes = {
  productMapBubble: ProductMapFlowNode,
};

function getRadialRadius(childCount: number, isMobile: boolean): number {
  const base = isMobile ? 130 : 200;
  if (childCount <= 6) return base;
  if (childCount <= 12) return base + 50;
  return base + 90;
}

function buildGraph(
  centerNode: ProductMapNodeWithProgress,
  childNodes: ProductMapNodeWithProgress[],
  radius: number,
): { nodes: ProductMapFlowNodeType[]; edges: Edge[] } {
  const centerOffset = NODE_DIMENSIONS.center / 2;
  const childOffset = NODE_DIMENSIONS.child / 2;

  const nodes: ProductMapFlowNodeType[] = [
    {
      id: CENTER_NODE_ID,
      type: "productMapBubble",
      position: { x: -centerOffset, y: -centerOffset },
      data: {
        label: centerNode.name,
        status: centerNode.status,
        calculatedProgress: centerNode.calculated_progress,
        isCenter: true,
        animationDelay: 0,
        childrenCount: centerNode.children_count,
      },
      draggable: false,
      selectable: true,
    },
  ];

  const edges: Edge[] = [];
  const count = childNodes.length;

  childNodes.forEach((child, index) => {
    const angle = (2 * Math.PI * index) / Math.max(count, 1) - Math.PI / 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    nodes.push({
      id: child.id,
      type: "productMapBubble",
      position: { x: x - childOffset, y: y - childOffset },
      data: {
        label: child.name,
        status: child.status,
        calculatedProgress: child.calculated_progress,
        isCenter: false,
        animationDelay: 0.05 + index * 0.04,
        childrenCount: child.children_count,
      },
      draggable: false,
      selectable: true,
    });

    edges.push({
      id: `edge-${child.id}`,
      source: CENTER_NODE_ID,
      target: child.id,
      style: { stroke: "#E5E5E5", strokeWidth: 2 },
      animated: false,
    });
  });

  return { nodes, edges };
}

type FlowCanvasInnerProps = {
  centerNode: ProductMapNodeWithProgress;
  childNodes: ProductMapNodeWithProgress[];
  isLoading: boolean;
  onSelectChild: (node: ProductMapNodeWithProgress) => void;
  onSelectCenter: () => void;
  canGoBack: boolean;
  onAddChild: () => void;
  onNodeContextMenu: (node: ProductMapNodeWithProgress, event: React.MouseEvent) => void;
};

function FlowCanvasInner({
  centerNode,
  childNodes,
  isLoading,
  onSelectChild,
  onSelectCenter,
  canGoBack,
  onAddChild,
  onNodeContextMenu,
}: FlowCanvasInnerProps) {
  const { fitView } = useReactFlow();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const radius = getRadialRadius(childNodes.length, isMobile);

  const graph = useMemo(
    () => buildGraph(centerNode, childNodes, radius),
    [centerNode, childNodes, radius],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<ProductMapFlowNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length === 0) return;

    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.35, duration: 280, minZoom: 0.5, maxZoom: 1.2 });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [fitView, nodes, edges, centerNode.id, childNodes.length]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<FlowNodeData>) => {
      if (node.id === CENTER_NODE_ID) {
        if (canGoBack) onSelectCenter();
        return;
      }
      const selected = childNodes.find((c) => c.id === node.id);
      if (selected) onSelectChild(selected);
    },
    [canGoBack, childNodes, onSelectCenter, onSelectChild],
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node<FlowNodeData>) => {
      event.preventDefault();
      if (node.id === CENTER_NODE_ID) {
        onNodeContextMenu(centerNode, event);
        return;
      }
      const selected = childNodes.find((c) => c.id === node.id);
      if (selected) onNodeContextMenu(selected, event);
    },
    [centerNode, childNodes, onNodeContextMenu],
  );

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center gap-4 p-8"
        style={{ width: "100%", height: CANVAS_HEIGHT_PX }}
      >
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ width: "100%", height: CANVAS_HEIGHT_PX }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.35}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        style={{ width: "100%", height: "100%", background: PRODUCT_MAP_BG }}
      >
        <Background color="#E5E5E5" gap={24} size={1} />
      </ReactFlow>

      {childNodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E5E5E5] bg-white/80 px-6 py-5 text-center shadow-sm backdrop-blur-sm">
            <p className="text-sm text-[#717B99]">Este nodo aún no tiene ramas</p>
            <Button
              type="button"
              size="lg"
              onClick={onAddChild}
              className="h-14 w-14 rounded-full bg-[#C6017F] p-0 hover:bg-[#B10072]"
              aria-label="Agregar primer hijo"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </div>
        </motion.div>
      )}

      {canGoBack && (
        <p className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 text-center text-xs text-[#717B99]">
          Toca el centro para volver · Esc o ← para atrás
        </p>
      )}
    </div>
  );
}

export type ProductMapCanvasProps = FlowCanvasInnerProps;

export function ProductMapCanvas(props: ProductMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
