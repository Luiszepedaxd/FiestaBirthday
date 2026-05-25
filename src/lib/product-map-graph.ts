import { getColorByProgress, getStatusColor, isVisuallyUntracked } from "@/lib/product-map-status";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

const RADIUS_BY_DEPTH = [14, 10, 7, 4] as const;

export function getGraphNodeRadius(depth: number): number {
  return RADIUS_BY_DEPTH[Math.min(depth, RADIUS_BY_DEPTH.length - 1)];
}

export function computeNodeDepths(
  nodes: ProductMapNodeWithProgress[],
): Map<string, number> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depths = new Map<string, number>();

  const resolveDepth = (id: string): number => {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;

    const node = byId.get(id);
    if (!node || node.parent_id === null) {
      depths.set(id, 0);
      return 0;
    }
    const parentDepth = resolveDepth(node.parent_id);
    const depth = parentDepth + 1;
    depths.set(id, depth);
    return depth;
  };

  for (const node of nodes) {
    resolveDepth(node.id);
  }

  return depths;
}

export function getGraphNodeColor(node: ProductMapNodeWithProgress): string {
  const dimmed = isVisuallyUntracked(node.calculated_progress) || node.status === "untracked";
  if (dimmed) return getStatusColor("untracked");
  if (node.children_count > 0) return getColorByProgress(node.calculated_progress);
  return getStatusColor(node.status);
}

export type LeafDescendantStats = {
  total: number;
  done: number;
  in_progress: number;
  pending: number;
};

function getLeafBucket(
  node: Pick<ProductMapNodeWithProgress, "status" | "calculated_progress" | "children_count">,
): "done" | "in_progress" | "pending" {
  if (node.children_count > 0) {
    if (node.calculated_progress === 100) return "done";
    if (node.calculated_progress === null || node.calculated_progress === 0) return "pending";
    return "in_progress";
  }
  if (node.status === "completed") return "done";
  if (node.status === "not_started" || node.status === "untracked") return "pending";
  return "in_progress";
}

export function countLeafDescendants(
  nodeId: string,
  allNodes: ProductMapNodeWithProgress[],
): LeafDescendantStats {
  const childrenByParent = new Map<string, ProductMapNodeWithProgress[]>();
  for (const node of allNodes) {
    if (!node.parent_id) continue;
    const siblings = childrenByParent.get(node.parent_id) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parent_id, siblings);
  }

  const stats: LeafDescendantStats = {
    total: 0,
    done: 0,
    in_progress: 0,
    pending: 0,
  };

  const stack = [...(childrenByParent.get(nodeId) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const children = childrenByParent.get(current.id) ?? [];
    if (children.length === 0) {
      stats.total += 1;
      stats[getLeafBucket(current)] += 1;
    } else {
      stack.push(...children);
    }
  }

  return stats;
}

export function formatLeafDescendantBreakdown(stats: LeafDescendantStats): string {
  const parts: string[] = [];
  if (stats.done > 0) parts.push(`✓${stats.done}`);
  if (stats.in_progress > 0) parts.push(`●${stats.in_progress}`);
  if (stats.pending > 0) parts.push(`○${stats.pending}`);
  return parts.length > 0 ? parts.join(" ") : "—";
}
