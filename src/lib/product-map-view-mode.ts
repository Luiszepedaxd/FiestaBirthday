export type ProductMapViewMode = "mindly" | "panoramic" | "graph" | "timeline";

export const PRODUCT_MAP_VIEW_MODE_KEY = "product-map-view-mode";

const VALID_MODES: ProductMapViewMode[] = ["mindly", "panoramic", "graph", "timeline"];

export function getStoredProductMapViewMode(): ProductMapViewMode {
  if (typeof window === "undefined") return "mindly";
  try {
    const stored = localStorage.getItem(PRODUCT_MAP_VIEW_MODE_KEY);
    if (stored && VALID_MODES.includes(stored as ProductMapViewMode)) {
      return stored as ProductMapViewMode;
    }
  } catch {
    /* ignore */
  }
  return "mindly";
}

export function setStoredProductMapViewMode(mode: ProductMapViewMode): void {
  try {
    localStorage.setItem(PRODUCT_MAP_VIEW_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}
