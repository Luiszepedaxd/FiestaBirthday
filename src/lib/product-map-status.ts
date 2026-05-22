import type { ProductMapStatus } from "@/types/product-map";

export type StatusConfigEntry = {
  label: string;
  color: string;
  /** Default progress for leaf nodes; null = no tracking ring */
  progress: number | null;
};

export const STATUS_ORDER: ProductMapStatus[] = [
  "untracked",
  "not_started",
  "lowest_fi",
  "design",
  "development",
  "qa",
  "completed",
];

export const STATUS_CONFIG: Record<ProductMapStatus, StatusConfigEntry> = {
  untracked: {
    label: "Sin tracking",
    color: "#9CA3AF",
    progress: null,
  },
  not_started: {
    label: "Sin iniciar",
    color: "#EF4444",
    progress: 0,
  },
  lowest_fi: {
    label: "Lowest-fi",
    color: "#A855F7",
    progress: 15,
  },
  design: {
    label: "Diseño",
    color: "#F59E0B",
    progress: 35,
  },
  development: {
    label: "Desarrollo",
    color: "#F97316",
    progress: 60,
  },
  qa: {
    label: "QA",
    color: "#3B82F6",
    progress: 85,
  },
  completed: {
    label: "Completo",
    color: "#22C55E",
    progress: 100,
  },
};

export function getStatusLabel(status: ProductMapStatus): string {
  return STATUS_CONFIG[status].label;
}

export function getStatusColor(status: ProductMapStatus): string {
  return STATUS_CONFIG[status].color;
}

export function getStatusProgress(status: ProductMapStatus): number | null {
  return STATUS_CONFIG[status].progress;
}

export function getNodeTooltipText(
  status: ProductMapStatus,
  calculatedProgress: number | null,
): string {
  const label = getStatusLabel(status);
  if (status === "untracked" || calculatedProgress === null) {
    return "Sin tracking";
  }
  return `${label} · ${calculatedProgress}%`;
}

/** Visual treatment when SQL returns no aggregate progress (all descendants untracked). */
export function isVisuallyUntracked(calculatedProgress: number | null): boolean {
  return calculatedProgress === null;
}
