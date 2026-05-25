import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLICKUP_BRAND_COLOR } from "@/lib/clickup-utils";
import { getTimeHealthStroke } from "@/lib/time-health";
import {
  PRODUCT_MAP_CANVAS_FRAME_CLASS,
  PRODUCT_MAP_CANVAS_INNER_CLASS,
} from "./constants";
import {
  buildGraphData,
  getLinkEndpointId,
  type GraphForceLink,
  type GraphForceNode,
} from "./product-map-graph-data";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

const DEFAULT_LINK_COLOR = "#D4CFC4";
const DIMMED_LINK_COLOR = "rgba(212, 207, 196, 0.2)";
const LABEL_MIN_SCALE = 1.15;
const GRAPH_MIN_HEIGHT_PX = 560;

export type ProductMapGraph2DProps = {
  nodes: ProductMapNodeWithProgress[];
  onNodeClick: (node: ProductMapNodeWithProgress) => void;
};

function ProductMapGraph2D({ nodes, onNodeClick }: ProductMapGraph2DProps) {
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
      const healthStroke = getTimeHealthStroke(node.raw.time_health);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = healthStroke ?? "rgba(255,255,255,0.85)";
      ctx.lineWidth = healthStroke ? 2.5 / globalScale : 1.5 / globalScale;
      ctx.stroke();

      if (node.raw.has_notes) {
        const dotR = Math.max(2 / globalScale, 1.2);
        const dotX = node.x + radius * 0.65;
        const dotY = node.y - radius * 0.65;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR, 0, 2 * Math.PI);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.strokeStyle = "rgba(46, 45, 44, 0.35)";
        ctx.lineWidth = 0.75 / globalScale;
        ctx.stroke();
      }

      const clickUpCount = node.raw.clickup_links_count ?? 0;
      if (clickUpCount > 0) {
        const dotR = Math.max(2.2 / globalScale, 1.3);
        const dotX = node.x - radius * 0.65;
        const dotY = node.y - radius * 0.65;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR, 0, 2 * Math.PI);
        ctx.fillStyle = CLICKUP_BRAND_COLOR;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 0.75 / globalScale;
        ctx.stroke();
      }

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

  return (
    <div className={PRODUCT_MAP_CANVAS_FRAME_CLASS}>
      <div
        ref={containerRef}
        className={`${PRODUCT_MAP_CANVAS_INNER_CLASS} relative`}
        style={{ minHeight: GRAPH_MIN_HEIGHT_PX, height: "min(70vh, 720px)" }}
      >
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="transparent"
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
    </div>
  );
}

export default ProductMapGraph2D;
