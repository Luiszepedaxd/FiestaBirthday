import type { ProductMapNodeWithProgress, ProductMapStatus } from "@/types/product-map";

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

export function getColorByProgress(progress: number | null): string {
  if (progress === null || progress === undefined) return "#9CA3AF";
  if (progress === 0) return "#EF4444";
  if (progress <= 25) return "#A855F7";
  if (progress <= 50) return "#F59E0B";
  if (progress <= 75) return "#F97316";
  if (progress <= 99) return "#3B82F6";
  return "#22C55E";
}

/** Bubble/pip color for a node (parent uses progress, leaf uses status). */
export function getNodeVisualColor(
  node: Pick<ProductMapNodeWithProgress, "children_count" | "calculated_progress" | "status">,
): string {
  const dimmed = isVisuallyUntracked(node.calculated_progress) || node.status === "untracked";
  if (dimmed) return getStatusColor("untracked");
  if (node.children_count > 0) return getColorByProgress(node.calculated_progress);
  return getStatusColor(node.status);
}

export type ChildBucket = "done" | "in_progress" | "pending";

export type BucketCounts = {
  done: number;
  in_progress: number;
  pending: number;
};

export const EMPTY_BUCKET_COUNTS: BucketCounts = {
  done: 0,
  in_progress: 0,
  pending: 0,
};

export function getChildBucket(
  child: Pick<ProductMapNodeWithProgress, "status" | "calculated_progress" | "children_count">,
): ChildBucket {
  if (child.children_count > 0) {
    if (child.calculated_progress === 100) return "done";
    if (child.calculated_progress === null || child.calculated_progress === 0) return "pending";
    return "in_progress";
  }
  if (child.status === "completed") return "done";
  if (child.status === "not_started" || child.status === "untracked") return "pending";
  return "in_progress";
}

export function hasBucketCounts(counts: BucketCounts): boolean {
  return counts.done + counts.in_progress + counts.pending > 0;
}

export function buildBucketCountsForChildren(
  children: ProductMapNodeWithProgress[],
): BucketCounts {
  const counts: BucketCounts = { ...EMPTY_BUCKET_COUNTS };
  for (const child of children) {
    counts[getChildBucket(child)]++;
  }
  return counts;
}

/** Map each parent id to bucket counts of its direct children (for orbit pips). */
export function buildChildrenBucketsMap(
  parentIds: string[],
  childNodes: ProductMapNodeWithProgress[],
): Record<string, BucketCounts> {
  const grouped: Record<string, ProductMapNodeWithProgress[]> = {};
  for (const id of parentIds) grouped[id] = [];

  for (const node of childNodes) {
    const parentId = node.parent_id;
    if (parentId && parentId in grouped) {
      grouped[parentId].push(node);
    }
  }

  const result: Record<string, BucketCounts> = {};
  for (const id of parentIds) {
    result[id] = buildBucketCountsForChildren(grouped[id] ?? []);
  }
  return result;
}
