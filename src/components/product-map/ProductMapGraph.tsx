import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PRODUCT_MAP_CANVAS_FRAME_CLASS,
  PRODUCT_MAP_CANVAS_INNER_CLASS,
} from "./constants";
import type { ProductMapGraphDimension } from "@/lib/product-map-graph-dimension";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

const GRAPH_MIN_HEIGHT_PX = 560;

const ProductMapGraph2D = lazy(() => import("./ProductMapGraph2D"));
const ProductMapGraph3D = lazy(() => import("./ProductMapGraph3D"));

export type ProductMapGraphProps = {
  nodes: ProductMapNodeWithProgress[];
  isLoading: boolean;
  dimension: ProductMapGraphDimension;
  onNodeClick: (node: ProductMapNodeWithProgress) => void;
};

function GraphViewFallback() {
  return (
    <div className={PRODUCT_MAP_CANVAS_FRAME_CLASS}>
      <div
        className={`${PRODUCT_MAP_CANVAS_INNER_CLASS} flex items-center justify-center`}
        style={{ minHeight: GRAPH_MIN_HEIGHT_PX }}
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C6017F] border-t-transparent" />
      </div>
    </div>
  );
}

export function ProductMapGraph({
  nodes,
  isLoading,
  dimension,
  onNodeClick,
}: ProductMapGraphProps) {
  if (isLoading) {
    return (
      <div className={PRODUCT_MAP_CANVAS_FRAME_CLASS}>
        <div
          className={`${PRODUCT_MAP_CANVAS_INNER_CLASS} flex items-center justify-center`}
          style={{ minHeight: GRAPH_MIN_HEIGHT_PX }}
        >
          <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={PRODUCT_MAP_CANVAS_FRAME_CLASS}>
        <div
          className={`${PRODUCT_MAP_CANVAS_INNER_CLASS} flex items-center justify-center border-dashed p-12 text-sm text-[#717B99]`}
          style={{ minHeight: GRAPH_MIN_HEIGHT_PX }}
        >
          No hay nodos para mostrar en el grafo.
        </div>
      </div>
    );
  }

  const GraphView = dimension === "3d" ? ProductMapGraph3D : ProductMapGraph2D;

  return (
    <Suspense fallback={<GraphViewFallback />}>
      <GraphView nodes={nodes} onNodeClick={onNodeClick} />
    </Suspense>
  );
}

export default ProductMapGraph;
