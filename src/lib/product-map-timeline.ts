import {
  addDays,
  differenceInCalendarDays,
  eachMonthOfInterval,
  format,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

export type TimelineUserTypeFilter = "all" | "Cliente" | "Proveedor" | "Admin";

export const TIMELINE_USER_TYPE_OPTIONS: { value: TimelineUserTypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "Cliente", label: "Cliente" },
  { value: "Proveedor", label: "Proveedor" },
  { value: "Admin", label: "Admin" },
];

export type TimelineRange = {
  rangeStart: Date;
  rangeEnd: Date;
  totalDays: number;
};

export function getMilestoneNodes(nodes: ProductMapNodeWithProgress[]): ProductMapNodeWithProgress[] {
  return nodes
    .filter((n) => n.target_date != null)
    .sort((a, b) => {
      const da = parseISO(a.target_date!);
      const db = parseISO(b.target_date!);
      return da.getTime() - db.getTime();
    });
}

/** Bar visual start: max(created_at, 90 days ago). */
export function getNodeBarStartDate(node: ProductMapNodeWithProgress, today = new Date()): Date {
  const created = startOfDay(parseISO(node.created_at));
  const ninetyAgo = startOfDay(addDays(today, -90));
  return maxDate([created, ninetyAgo]);
}

export function computeTimelineRange(
  milestoneNodes: ProductMapNodeWithProgress[],
  today = new Date(),
): TimelineRange {
  const todayStart = startOfDay(today);
  const thirtyAgo = startOfDay(addDays(todayStart, -30));
  const ninetyAhead = startOfDay(addDays(todayStart, 90));

  let earliestStart = ninetyAhead;
  let latestTarget = thirtyAgo;

  for (const node of milestoneNodes) {
    if (!node.target_date) continue;
    const barStart = getNodeBarStartDate(node, today);
    const target = startOfDay(parseISO(node.target_date));
    earliestStart = minDate([earliestStart, barStart]);
    latestTarget = maxDate([latestTarget, target]);
  }

  const rangeStart = minDate([thirtyAgo, earliestStart]);
  const rangeEnd = maxDate([ninetyAhead, latestTarget]);
  const totalDays = Math.max(1, differenceInCalendarDays(rangeEnd, rangeStart));

  return { rangeStart, rangeEnd, totalDays };
}

export function dateToPercent(date: Date, rangeStart: Date, totalDays: number): number {
  const days = differenceInCalendarDays(startOfDay(date), rangeStart);
  return Math.min(100, Math.max(0, (days / totalDays) * 100));
}

export function getTimelineMonths(rangeStart: Date, rangeEnd: Date): Date[] {
  return eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
}

export function formatTimelineMonthLabel(date: Date): string {
  return format(date, "MMM yyyy", { locale: es });
}

export function buildNodesById(
  nodes: ProductMapNodeWithProgress[],
): Map<string, ProductMapNodeWithProgress> {
  return new Map(nodes.map((n) => [n.id, n]));
}

/** Direct child of root (Fiestamas) for user-type filtering. */
export function getTopBranchNode(
  node: ProductMapNodeWithProgress,
  nodesById: Map<string, ProductMapNodeWithProgress>,
  rootId: string | undefined,
): ProductMapNodeWithProgress | null {
  if (!rootId) return null;
  if (node.id === rootId) return node;

  let current: ProductMapNodeWithProgress | undefined = node;
  while (current?.parent_id && current.parent_id !== rootId) {
    current = nodesById.get(current.parent_id);
  }
  if (current?.parent_id === rootId) return current;
  return null;
}

export function getNodeBreadcrumb(
  node: ProductMapNodeWithProgress,
  nodesById: Map<string, ProductMapNodeWithProgress>,
): string {
  const parts: string[] = [];
  let current: ProductMapNodeWithProgress | undefined = node;
  while (current) {
    parts.unshift(current.name);
    current = current.parent_id ? nodesById.get(current.parent_id) : undefined;
  }
  return parts.join(" › ");
}

export function filterTimelineNodes(
  milestones: ProductMapNodeWithProgress[],
  allNodes: ProductMapNodeWithProgress[],
  rootId: string | undefined,
  overdueOnly: boolean,
  userType: TimelineUserTypeFilter,
): ProductMapNodeWithProgress[] {
  const nodesById = buildNodesById(allNodes);

  return milestones.filter((node) => {
    if (overdueOnly && node.time_health !== "overdue") return false;
    if (userType === "all") return true;
    const branch = getTopBranchNode(node, nodesById, rootId);
    return branch?.name === userType;
  });
}

export type TimelineHeaderStats = {
  totalMilestones: number;
  closestName: string | null;
  closestTargetDate: string | null;
  overdueCount: number;
  atRiskCount: number;
};

export function computeTimelineHeaderStats(
  milestones: ProductMapNodeWithProgress[],
): TimelineHeaderStats {
  const today = startOfDay(new Date());
  const upcoming = milestones.filter((n) => {
    if (!n.target_date) return false;
    return startOfDay(parseISO(n.target_date)) >= today;
  });
  const closest = upcoming[0] ?? milestones[0] ?? null;

  return {
    totalMilestones: milestones.length,
    closestName: closest?.name ?? null,
    closestTargetDate: closest?.target_date ?? null,
    overdueCount: milestones.filter((n) => n.time_health === "overdue").length,
    atRiskCount: milestones.filter((n) => n.time_health === "at_risk").length,
  };
}
