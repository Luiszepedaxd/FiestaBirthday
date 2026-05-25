import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import { Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGraph3DNodeColor, getGraph3DNodeVal } from "@/lib/product-map-graph";
import {
  PRODUCT_MAP_CANVAS_FRAME_CLASS,
  PRODUCT_MAP_CANVAS_INNER_CLASS,
} from "./constants";
import {
  buildGraphData,
  type GraphForceLink,
  type GraphForceNode,
} from "./product-map-graph-data";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

const GRAPH_MIN_HEIGHT_PX = 560;

export type ProductMapGraph3DProps = {
  nodes: ProductMapNodeWithProgress[];
  onNodeClick: (node: ProductMapNodeWithProgress) => void;
};

function ProductMapGraph3D({ nodes, onNodeClick }: ProductMapGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods<GraphForceNode, GraphForceLink>>();
  const [dimensions, setDimensions] = useState({ width: 800, height: GRAPH_MIN_HEIGHT_PX });

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
      charge.strength(-120);
    }

    const link = fg.d3Force("link");
    if (link && typeof link.distance === "function") {
      link.distance(60);
    }
  }, [graphData]);

  useEffect(() => {
    if (graphData.nodes.length === 0) return;
    const timer = window.setTimeout(() => {
      fgRef.current?.zoomToFit(400, 48);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [graphData]);

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
        <ForceGraph3D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="transparent"
          showNavInfo={false}
          warmupTicks={50}
          cooldownTicks={100}
          enableNodeDrag
          enableNavigationControls
          nodeLabel="name"
          nodeColor={(node) => getGraph3DNodeColor(node.raw)}
          nodeVal={(node) => getGraph3DNodeVal(node.depth)}
          linkColor={() => "#D4CFC4"}
          linkOpacity={0.5}
          linkWidth={1}
          onNodeClick={handleNodeClick}
        />

        <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 text-center text-[11px] text-[#717B99]/90">
          Arrastra para rotar · Scroll para zoom · Click en un nodo
        </div>

        <div className="absolute bottom-14 left-3 z-10 flex flex-col gap-1 rounded-xl border border-[#E5E5E5] bg-white/95 p-1 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => {
              const fg = fgRef.current;
              if (!fg) return;
              const distance = fg.cameraPosition().z;
              fg.cameraPosition({ z: distance * 0.75 }, undefined, 250);
            }}
            aria-label="Acercar"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => {
              const fg = fgRef.current;
              if (!fg) return;
              const distance = fg.cameraPosition().z;
              fg.cameraPosition({ z: distance * 1.35 }, undefined, 250);
            }}
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
        </div>

        <div className="pointer-events-none absolute right-3 top-3 z-10 max-w-[200px] rounded-lg border border-[#E5E5E5] bg-white/90 px-2.5 py-2 text-[10px] leading-snug text-[#717B99]">
          <p className="font-medium text-[#2E2D2C]">Leyenda 3D</p>
          <p className="mt-1">Color = progreso/estado</p>
          <p>Rojo/ámbar = atrasado/en riesgo</p>
        </div>
      </div>
    </div>
  );
}

export default ProductMapGraph3D;
