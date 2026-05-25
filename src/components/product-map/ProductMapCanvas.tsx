import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
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
import type { ProductMapNodeWithProgress, ProductMapStatus, TimeHealth } from "@/types/product-map";
import { ProductMapNodeBubble } from "./ProductMapNode";
import {
  PRODUCT_MAP_CANVAS_FRAME_CLASS,
  PRODUCT_MAP_CANVAS_INNER_CLASS,
  PRODUCT_MAP_CANVAS_SAFE_PADDING_PX,
} from "./constants";
import { Skeleton } from "@/components/ui/skeleton";

const CENTER_NODE_ID = "__center__";
const ORBIT_RADIUS_MIN = 200;
const ORBIT_RADIUS_MAX = 500;
const CLICK_DELAY_MS = 250;

type FlowNodeData = {
  label: string;
  status: ProductMapStatus;
  calculatedProgress: number | null;
  isCenter: boolean;
  animationDelay: number;
  childrenCount: number;
  hasNotes: boolean;
  clickUpLinksCount: number;
  timeHealth: TimeHealth;
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
        hasNotes={data.hasNotes}
        clickUpLinksCount={data.clickUpLinksCount}
        timeHealth={data.timeHealth}
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

function getOrbitRadiusFactor(childCount: number): number {
  if (childCount > 8) return 0.4;
  if (childCount < 4) return 0.32;
  return 0.35;
}

function getSafeOrbitRadius(
  containerWidth: number,
  containerHeight: number,
  childCount: number,
): number {
  const usableW = Math.max(0, containerWidth - PRODUCT_MAP_CANVAS_SAFE_PADDING_PX * 2);
  const usableH = Math.max(0, containerHeight - PRODUCT_MAP_CANVAS_SAFE_PADDING_PX * 2);
  const usableDim = Math.min(usableW, usableH);
  const raw = usableDim * getOrbitRadiusFactor(childCount);
  return Math.max(ORBIT_RADIUS_MIN, Math.min(ORBIT_RADIUS_MAX, raw));
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
        hasNotes: centerNode.has_notes,
        clickUpLinksCount: centerNode.clickup_links_count ?? 0,
        timeHealth: centerNode.time_health,
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
        hasNotes: child.has_notes,
        clickUpLinksCount: child.clickup_links_count ?? 0,
        timeHealth: child.time_health,
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
  onNodeDoubleClick?: (nodeId: string) => void;
  canEdit?: boolean;
};

function FlowCanvasInner({
  centerNode,
  childNodes,
  isLoading,
  onSelectChild,
  onSelectCenter,
  canGoBack,
  onAddChild: _onAddChild,
  onNodeContextMenu,
  onNodeDoubleClick,
  canEdit = true,
}: FlowCanvasInnerProps) {
  const { fitView } = useReactFlow();
  const flowAreaRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flowSize, setFlowSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = flowAreaRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setFlowSize({ width, height });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
  }, []);

  const radius = getSafeOrbitRadius(flowSize.width, flowSize.height, childNodes.length);

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
    if (nodes.length === 0 || flowSize.width <= 0 || flowSize.height <= 0) return;

    const timer = window.setTimeout(() => {
      void fitView({
        padding: PRODUCT_MAP_CANVAS_SAFE_PADDING_PX,
        duration: 280,
        minZoom: 0.55,
        maxZoom: 1.25,
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [fitView, nodes, edges, centerNode.id, childNodes.length, flowSize.width, flowSize.height]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<FlowNodeData>) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        if (node.id === CENTER_NODE_ID) {
          onSelectCenter();
          return;
        }
        const selected = childNodes.find((c) => c.id === node.id);
        if (selected) onSelectChild(selected);
      }, CLICK_DELAY_MS);
    },
    [childNodes, onSelectCenter, onSelectChild],
  );

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node<FlowNodeData>) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      if (!onNodeDoubleClick) return;
      const nodeId = node.id === CENTER_NODE_ID ? centerNode.id : node.id;
      onNodeDoubleClick(nodeId);
    },
    [centerNode.id, onNodeDoubleClick],
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node<FlowNodeData>) => {
      if (!canEdit) return;
      event.preventDefault();
      if (node.id === CENTER_NODE_ID) {
        onNodeContextMenu(centerNode, event);
        return;
      }
      const selected = childNodes.find((c) => c.id === node.id);
      if (selected) onNodeContextMenu(selected, event);
    },
    [canEdit, centerNode, childNodes, onNodeContextMenu],
  );

  if (isLoading) {
    return (
      <div className={`${PRODUCT_MAP_CANVAS_FRAME_CLASS} flex min-h-0 flex-1 flex-col`}>
        <div
          className={`${PRODUCT_MAP_CANVAS_INNER_CLASS} flex min-h-[500px] flex-1 items-center justify-center gap-4`}
        >
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className={`${PRODUCT_MAP_CANVAS_FRAME_CLASS} flex min-h-0 flex-1 flex-col`}>
        <div
          ref={flowAreaRef}
          className={`${PRODUCT_MAP_CANVAS_INNER_CLASS} relative h-full min-h-[500px] w-full flex-1`}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeContextMenu={canEdit ? handleNodeContextMenu : undefined}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            panOnDrag
            zoomOnScroll
            zoomOnPinch
            minZoom={0.35}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          />

          {childNodes.length === 0 && (
            <p
              className="pointer-events-none absolute bottom-6 left-0 right-0 z-10 text-center text-xs text-muted-foreground"
              style={{ fontSize: 12, opacity: 0.6 }}
            >
              Esta es una pantalla final
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 shrink-0 text-center text-xs text-[#717B99]">
        Click para detalles · Doble click para navegar
        {canGoBack ? " · Esc o ← atrás" : ""}
      </p>
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

export default ProductMapCanvas;
