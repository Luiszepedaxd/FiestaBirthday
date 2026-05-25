import { useMemo, useState } from "react";
import { parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  computeTimelineRange,
  dateToPercent,
  filterTimelineNodes,
  formatTimelineMonthLabel,
  getMilestoneNodes,
  getNodeBarStartDate,
  getNodeBreadcrumb,
  getTimelineMonths,
  TIMELINE_USER_TYPE_OPTIONS,
  type TimelineUserTypeFilter,
} from "@/lib/product-map-timeline";
import {
  getColorByProgress,
  getStatusColor,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import { formatTargetDateLabel, TIME_HEALTH_CONFIG } from "@/lib/time-health";
import { PRODUCT_MAP_BG } from "@/components/product-map/constants";
import type { ProductMapNodeWithProgress, TimeHealth } from "@/types/product-map";

const INFO_COL_WIDTH = 320;
const TRACK_WIDTH = 720;
const MIN_BAR_PX_FOR_INLINE_LABEL = 80;

export type ProductMapTimelineProps = {
  nodes: ProductMapNodeWithProgress[];
  rootId: string | undefined;
  isLoading?: boolean;
  onNodeClick: (nodeId: string) => void;
  onGoToRoot: () => void;
};

function getNodeBarColor(node: ProductMapNodeWithProgress): string {
  const dimmed = isVisuallyUntracked(node.calculated_progress) || node.status === "untracked";
  if (dimmed) return getStatusColor("untracked");
  if (node.children_count > 0) return getColorByProgress(node.calculated_progress);
  return getStatusColor(node.status);
}

function getBarBorderClass(timeHealth: TimeHealth): string {
  switch (timeHealth) {
    case "on_track":
      return "border-2 border-[#22C55E]/50 shadow-[0_0_0_1px_rgba(34,197,94,0.15)]";
    case "at_risk":
      return "border-2 border-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.55)]";
    case "overdue":
      return "border-2 border-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.65)] timeline-bar-overdue";
    case "completed":
      return "border border-[#22C55E]/40";
    default:
      return "border border-[#E5E5E5]";
  }
}

type TimelineRowProps = {
  node: ProductMapNodeWithProgress;
  breadcrumb: string;
  rangeStart: Date;
  totalDays: number;
  onNodeClick: (nodeId: string) => void;
};

function TimelineRow({ node, breadcrumb, rangeStart, totalDays, onNodeClick }: TimelineRowProps) {
  const targetDate = parseISO(node.target_date!);
  const barStart = getNodeBarStartDate(node);
  const leftPct = dateToPercent(barStart, rangeStart, totalDays);
  const rightPct = dateToPercent(targetDate, rangeStart, totalDays);
  const widthPct = Math.max(0.5, rightPct - leftPct);
  const barWidthPx = (widthPct / 100) * TRACK_WIDTH;
  const barColor = getNodeBarColor(node);
  const progress = node.calculated_progress ?? 0;
  const isCompleted = node.time_health === "completed";
  const healthConfig = TIME_HEALTH_CONFIG[node.time_health];
  const tooltipText = `${node.name} · ${progress}% · Vence el ${formatTargetDateLabel(node.target_date)} · ${healthConfig.label}`;
  const showLabelInside = barWidthPx >= MIN_BAR_PX_FOR_INLINE_LABEL;

  return (
    <div
      className="grid border-t border-[#F2F2F2]"
      style={{ gridTemplateColumns: `${INFO_COL_WIDTH}px ${TRACK_WIDTH}px` }}
    >
      <button
        type="button"
        className="flex min-h-[56px] flex-col justify-center gap-1 px-4 py-3 text-left transition-colors hover:bg-[#FFF0F9]/60"
        onClick={() => onNodeClick(node.id)}
      >
        <span className="font-medium text-[#2E2D2C]">{node.name}</span>
        <span className="line-clamp-1 text-xs text-[#717B99]">{breadcrumb}</span>
        <Badge
          variant="outline"
          className="w-fit border-transparent text-[10px] font-medium"
          style={{ color: healthConfig.color, backgroundColor: `${healthConfig.color}18` }}
        >
          {healthConfig.label}
        </Badge>
      </button>

      <div className="relative min-h-[56px] px-4 py-3">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="absolute top-1/2 h-7 -translate-y-1/2 cursor-pointer rounded-md transition-opacity hover:opacity-90"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  minWidth: 4,
                  backgroundColor: isCompleted ? barColor : `${barColor}33`,
                  opacity: isCompleted ? 0.6 : 1,
                }}
                onClick={() => onNodeClick(node.id)}
                aria-label={tooltipText}
              >
                <div
                  className={`relative h-full w-full overflow-hidden rounded-md ${getBarBorderClass(node.time_health)}`}
                >
                  {!isCompleted && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-l-md transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  )}
                  {isCompleted && (
                    <div
                      className="absolute inset-0 rounded-md"
                      style={{ backgroundColor: barColor }}
                    />
                  )}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {showLabelInside ? (
          <span
            className="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-[10px] font-semibold text-[#2E2D2C]"
            style={{ left: `calc(${leftPct}% + 6px)` }}
          >
            {progress}%
          </span>
        ) : (
          <span
            className="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-[#717B99]"
            style={{ left: `calc(${leftPct}% + ${widthPct}% + 6px)` }}
          >
            {progress}%
          </span>
        )}
      </div>
    </div>
  );
}

export function ProductMapTimeline({
  nodes,
  rootId,
  isLoading,
  onNodeClick,
  onGoToRoot,
}: ProductMapTimelineProps) {
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [userType, setUserType] = useState<TimelineUserTypeFilter>("all");

  const allMilestones = useMemo(() => getMilestoneNodes(nodes), [nodes]);
  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const filteredNodes = useMemo(
    () => filterTimelineNodes(allMilestones, nodes, rootId, overdueOnly, userType),
    [allMilestones, nodes, rootId, overdueOnly, userType],
  );

  const hasFilters = overdueOnly || userType !== "all";
  const today = useMemo(() => new Date(), []);
  const range = useMemo(
    () => computeTimelineRange(allMilestones.length > 0 ? allMilestones : filteredNodes, today),
    [allMilestones, filteredNodes, today],
  );

  const months = useMemo(
    () => getTimelineMonths(range.rangeStart, range.rangeEnd),
    [range.rangeStart, range.rangeEnd],
  );

  const todayPct = dateToPercent(today, range.rangeStart, range.totalDays);
  const showTodayLine = todayPct >= 0 && todayPct <= 100;
  const todayLineLeft = INFO_COL_WIDTH + (TRACK_WIDTH * todayPct) / 100;

  const hasAnyMilestones = allMilestones.length > 0;

  const clearFilters = () => {
    setOverdueOnly(false);
    setUserType("all");
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#C6017F] border-t-transparent" />
      </div>
    );
  }

  if (!hasAnyMilestones) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#F2F2F2] bg-white py-16 text-center">
        <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold text-[#2E2D2C]">No hay hitos con fecha objetivo</h3>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">
          Para usar la vista Timeline, agrega fechas objetivo a los nodos importantes. Empieza por
          los nodos top: Fiestamas, Cliente, Proveedor, Admin.
        </p>
        <Button
          type="button"
          className="rounded-xl bg-[#C6017F] hover:bg-[#B10072]"
          onClick={onGoToRoot}
        >
          Ir al nodo raíz
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#F2F2F2] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Switch
            id="timeline-overdue-only"
            checked={overdueOnly}
            onCheckedChange={setOverdueOnly}
          />
          <Label htmlFor="timeline-overdue-only" className="cursor-pointer text-sm text-[#2E2D2C]">
            Solo atrasados
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Label className="shrink-0 text-sm text-[#717B99]">Tipo de usuario</Label>
          <Select value={userType} onValueChange={(v) => setUserType(v as TimelineUserTypeFilter)}>
            <SelectTrigger className="h-9 w-[140px] rounded-lg border-[#E5E5E5]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMELINE_USER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[#717B99] hover:text-[#C6017F]"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        )}

        <p className="ml-auto text-xs text-[#717B99]">
          Mostrando {filteredNodes.length} de {allMilestones.length} hitos
        </p>
      </div>

      {filteredNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#F2F2F2] bg-white py-12 text-center">
          <p className="text-sm text-[#717B99]">
            Sin resultados con los filtros actuales ·{" "}
            <button
              type="button"
              className="font-medium text-[#C6017F] underline-offset-2 hover:underline"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          </p>
        </div>
      ) : (
        <div
          className="relative flex-1 overflow-x-auto rounded-xl border border-[#F2F2F2]"
          style={{ backgroundColor: PRODUCT_MAP_BG }}
        >
          <div
            className="relative"
            style={{ minWidth: INFO_COL_WIDTH + TRACK_WIDTH, width: INFO_COL_WIDTH + TRACK_WIDTH }}
          >
            <div
              className="sticky top-0 z-20 grid border-b border-[#F2F2F2]"
              style={{
                gridTemplateColumns: `${INFO_COL_WIDTH}px ${TRACK_WIDTH}px`,
                backgroundColor: PRODUCT_MAP_BG,
              }}
            >
              <div className="flex items-center px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#717B99]">
                Nodo
              </div>
              <div className="relative h-10 px-4">
                {months.map((month) => {
                  const left = dateToPercent(month, range.rangeStart, range.totalDays);
                  return (
                    <span
                      key={month.toISOString()}
                      className="absolute top-1/2 -translate-y-1/2 text-[10px] font-medium capitalize text-[#717B99]"
                      style={{ left: `${left}%` }}
                    >
                      {formatTimelineMonthLabel(month)}
                    </span>
                  );
                })}
                {showTodayLine && (
                  <span
                    className="absolute -top-1 z-30 -translate-x-1/2 rounded-full bg-[#EF4444] px-2 py-0.5 text-[9px] font-bold uppercase text-white"
                    style={{ left: `${todayPct}%` }}
                  >
                    HOY
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              {showTodayLine && (
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-10 w-0 border-l-2 border-dashed border-[#EF4444]"
                  style={{ left: todayLineLeft }}
                />
              )}

              {filteredNodes.map((node) => (
                <TimelineRow
                  key={node.id}
                  node={node}
                  breadcrumb={getNodeBreadcrumb(node, nodesById)}
                  rangeStart={range.rangeStart}
                  totalDays={range.totalDays}
                  onNodeClick={onNodeClick}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
