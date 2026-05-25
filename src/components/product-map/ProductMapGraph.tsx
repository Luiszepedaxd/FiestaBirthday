import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-2d";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  computeNodeDepths,
  getGraphNodeColor,
  getGraphNodeRadius,
} from "@/lib/product-map-graph";
import { PRODUCT_MAP_BG } from "./constants";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

const DEFAULT_LINK_COLOR = "#D4CFC4";
const DIMMED_LINK_COLOR = "rgba(212, 207, 196, 0.2)";
const LABEL_MIN_SCALE = 1.15;
const GRAPH_MIN_HEIGHT_PX = 560;

export type GraphForceNode = NodeObject & {
  id: string;
  name: string;
  depth: number;
  color: string;
  baseRadius: number;
  raw: ProductMapNodeWithProgress;
};

type GraphForceLink = LinkObject<GraphForceNode, { id: string }>;

export type ProductMapGraphProps = {
  nodes: ProductMapNodeWithProgress[];
  isLoading: boolean;
  onNodeClick: (node: ProductMapNodeWithProgress) => void;
};

function buildGraphData(
  nodes: ProductMapNodeWithProgress[],
): { nodes: GraphForceNode[]; links: GraphForceLink[] } {
  const depths = computeNodeDepths(nodes);

  const graphNodes: GraphForceNode[] = nodes.map((n) => {
    const depth = depths.get(n.id) ?? 0;
    return {
      id: n.id,
      name: n.name,
      depth,
      color: getGraphNodeColor(n),
      baseRadius: getGraphNodeRadius(depth),
      raw: n,
    };
  });

  const links: GraphForceLink[] = nodes
    .filter((n) => n.parent_id !== null)
    .map((n) => ({
      id: `${n.parent_id}-${n.id}`,
      source: n.parent_id as string,
      target: n.id,
    }));

  return { nodes: graphNodes, links };
}

function getLinkEndpointId(endpoint: string | GraphForceNode): string {
  return typeof endpoint === "object" ? endpoint.id : endpoint;
}

export function ProductMapGraph({ nodes, isLoading, onNodeClick }: ProductMapGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods<GraphForceNode, GraphForceLink>>();
  const [dimensions, setDimensions] = useState({ width: 800, height: GRAPH_MIN_HEIGHT_PX });
  const [hoveredNode, setHoveredNode] = useState<GraphForceNode | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const graphData = useMemo(() => buildGraphData(nodes), [nodes]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDimensions({
        width: Math.max(width, 320),
        height: Math.max(height, GRAPH_MIN_HEIGHT_PX),
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || graphData.nodes.length === 0) return;

    const charge = fg.d3Force("charge");
    if (charge && typeof charge.strength === "function") {
      charge.strength(-200);
    }

    const link = fg.d3Force("link");
    if (link && typeof link.distance === "function") {
      link.distance(80);
    }
  }, [graphData]);

  useEffect(() => {
    if (graphData.nodes.length === 0) return;
    const timer = window.setTimeout(() => {
      fgRef.current?.zoomToFit(400, 48);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [graphData]);

  const drawNode = useCallback(
    (node: GraphForceNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (node.x === undefined || node.y === undefined) return;

      const isHovered = hoveredNode?.id === node.id;
      const radius = node.baseRadius * (isHovered ? 1.3 : 1);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();

      const showLabel = isHovered || globalScale >= LABEL_MIN_SCALE;
      if (showLabel) {
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#2E2D2C";
        ctx.fillText(node.name, node.x, node.y + radius + 2 / globalScale);
      }
    },
    [hoveredNode],
  );

  const paintPointerArea = useCallback(
    (node: GraphForceNode, color: string, ctx: CanvasRenderingContext2D) => {
      if (node.x === undefined || node.y === undefined) return;
      const radius = node.baseRadius * 1.35;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    },
    [],
  );

  const handleNodeClick = useCallback(
    (node: GraphForceNode) => {
      onNodeClick(node.raw);
    },
    [onNodeClick],
  );

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-[#F2F2F2]"
        style={{ minHeight: GRAPH_MIN_HEIGHT_PX }}
      >
        <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-[#E5E5E5] p-12 text-sm text-[#717B99]"
        style={{ minHeight: GRAPH_MIN_HEIGHT_PX }}
      >
        No hay nodos para mostrar en el grafo.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-[#F2F2F2]"
      style={{ minHeight: GRAPH_MIN_HEIGHT_PX, height: "min(70vh, 720px)" }}
    >
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={PRODUCT_MAP_BG}
        autoPauseRedraw
        warmupTicks={50}
        cooldownTicks={100}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
        nodeRelSize={1}
        nodeVal={1}
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={paintPointerArea}
        linkColor={(link) => {
          if (!hoveredNode) return DEFAULT_LINK_COLOR;
          const sourceId = getLinkEndpointId(link.source as string | GraphForceNode);
          const targetId = getLinkEndpointId(link.target as string | GraphForceNode);
          if (sourceId === hoveredNode.id || targetId === hoveredNode.id) {
            return hoveredNode.color;
          }
          return DIMMED_LINK_COLOR;
        }}
        linkWidth={(link) => {
          if (!hoveredNode) return 1;
          const sourceId = getLinkEndpointId(link.source as string | GraphForceNode);
          const targetId = getLinkEndpointId(link.target as string | GraphForceNode);
          return sourceId === hoveredNode.id || targetId === hoveredNode.id ? 2 : 0.5;
        }}
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => setHoveredNode(node)}
        onZoom={({ k }) => setZoomScale(k)}
        onZoomEnd={({ k }) => setZoomScale(k)}
      />

      <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 text-center text-xs text-[#717B99]">
        Click en un nodo para ver detalles · Arrastra para reorganizar · Scroll para zoom
      </div>

      <div className="absolute bottom-14 left-3 z-10 flex flex-col gap-1 rounded-xl border border-[#E5E5E5] bg-white/95 p-1 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => fgRef.current?.zoom(Math.min(zoomScale * 1.35, 8), 250)}
          aria-label="Acercar"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => fgRef.current?.zoom(Math.max(zoomScale / 1.35, 0.15), 250)}
          aria-label="Alejar"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => fgRef.current?.zoomToFit(400, 48)}
          aria-label="Centrar vista"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => fgRef.current?.d3ReheatSimulation()}
          aria-label="Reiniciar simulación"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
