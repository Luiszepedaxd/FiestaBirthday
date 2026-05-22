import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
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
import type { ProductMapNode } from "@/types/product-map";
import { ProductMapNodeBubble } from "./ProductMapNode";
import { PRODUCT_MAP_BG } from "./constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CENTER_NODE_ID = "__center__";

type FlowNodeData = {
  label: string;
  color: string;
  isCenter: boolean;
  animationDelay: number;
};

function ProductMapFlowNode({ data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0 !h-0 !w-0 !min-h-0 !min-w-0 !border-0" />
      <ProductMapNodeBubble
        name={data.label}
        color={data.color}
        isCenter={data.isCenter}
        size={data.isCenter ? "lg" : "md"}
        animationDelay={data.animationDelay ?? 0}
      />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !h-0 !w-0 !min-h-0 !min-w-0 !border-0" />
    </>
  );
}

const nodeTypes = {
  productMapBubble: ProductMapFlowNode,
};

function getRadialRadius(childCount: number, isMobile: boolean): number {
  const base = isMobile ? 120 : 180;
  if (childCount <= 6) return base;
  if (childCount <= 12) return base + 40;
  return base + 80;
}

function buildGraph(
  centerNode: ProductMapNode,
  childNodes: ProductMapNode[],
  radius: number,
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = [
    {
      id: CENTER_NODE_ID,
      type: "productMapBubble",
      position: { x: -72, y: -72 },
      data: {
        label: centerNode.name,
        color: centerNode.color,
        isCenter: true,
        animationDelay: 0,
      },
      draggable: false,
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
      position: { x: x - 40, y: y - 40 },
      data: {
        label: child.name,
        color: child.color,
        isCenter: false,
        animationDelay: 0.05 + index * 0.04,
      },
      draggable: false,
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
  centerNode: ProductMapNode;
  childNodes: ProductMapNode[];
  isLoading: boolean;
  onSelectChild: (node: ProductMapNode) => void;
  onSelectCenter: () => void;
  canGoBack: boolean;
  onAddChild: () => void;
  onNodeContextMenu: (node: ProductMapNode, event: React.MouseEvent) => void;
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

  const { nodes, edges } = useMemo(
    () => buildGraph(centerNode, childNodes, radius),
    [centerNode, childNodes, radius],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.35, duration: 300 });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [fitView, centerNode.id, childNodes.length]);

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
      <div className="flex h-full min-h-[320px] items-center justify-center gap-4 p-8">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[min(70vh,520px)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="rounded-2xl"
        style={{ background: PRODUCT_MAP_BG }}
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
        <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-[#717B99]">
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
