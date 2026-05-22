export type ProductMapViewMode = "mindly" | "panoramic";

export const PRODUCT_MAP_VIEW_MODE_KEY = "product-map-view-mode";

export function getStoredProductMapViewMode(): ProductMapViewMode {
  if (typeof window === "undefined") return "mindly";
  try {
    const stored = localStorage.getItem(PRODUCT_MAP_VIEW_MODE_KEY);
    if (stored === "panoramic" || stored === "mindly") return stored;
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
