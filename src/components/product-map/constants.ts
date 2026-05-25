export const PRODUCT_MAP_CENTER_COLOR = "#C6017F";
export const PRODUCT_MAP_BG = "#FAF8F5";
export const PRODUCT_MAP_CANVAS_SURFACE_BG = "rgba(255, 255, 255, 0.6)";

/** Shared frame for Mindly, Panoramic, Graph, and Timeline chart areas. */
export const PRODUCT_MAP_CANVAS_FRAME_CLASS =
  "relative w-full overflow-hidden rounded-2xl border border-border/40 bg-white/60 p-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] sm:p-8";

export const PRODUCT_MAP_CANVAS_INNER_CLASS =
  "relative overflow-hidden rounded-xl bg-[radial-gradient(circle,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[length:20px_20px]";

/** Mindly orbit + fitView inset from canvas edges */
export const PRODUCT_MAP_CANVAS_SAFE_PADDING_PX = 60;

export const PRODUCT_MAP_PRESET_COLORS = [
  "#C6017F",
  "#5221D6",
  "#E0407B",
  "#2563EB",
  "#059669",
  "#D97706",
  "#0891B2",
  "#7C3AED",
] as const;
