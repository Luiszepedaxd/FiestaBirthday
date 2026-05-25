export type ProductMapGraphDimension = "2d" | "3d";

export const PRODUCT_MAP_GRAPH_DIMENSION_KEY = "product-map-graph-dimension";

const VALID_DIMENSIONS: ProductMapGraphDimension[] = ["2d", "3d"];

export function getStoredProductMapGraphDimension(): ProductMapGraphDimension {
  if (typeof window === "undefined") return "3d";
  try {
    const stored = localStorage.getItem(PRODUCT_MAP_GRAPH_DIMENSION_KEY);
    if (stored && VALID_DIMENSIONS.includes(stored as ProductMapGraphDimension)) {
      return stored as ProductMapGraphDimension;
    }
  } catch {
    /* ignore */
  }
  return "3d";
}

export function setStoredProductMapGraphDimension(dimension: ProductMapGraphDimension): void {
  try {
    localStorage.setItem(PRODUCT_MAP_GRAPH_DIMENSION_KEY, dimension);
  } catch {
    /* ignore */
  }
}
