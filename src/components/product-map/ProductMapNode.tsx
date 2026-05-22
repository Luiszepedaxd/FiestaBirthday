import { motion } from "framer-motion";
import { Check, Circle, Loader } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getColorByProgress,
  getNodeTooltipText,
  getStatusColor,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import type { LeafStatsCounts, ProductMapStatus } from "@/types/product-map";

const LEAF_STAT_COLORS = {
  completed: "#22C55E",
  inProgress: "#F97316",
  notStarted: "#EF4444",
} as const;

export function getLeafStatsTotal(stats: LeafStatsCounts): number {
  return stats.completed + stats.inProgress + stats.notStarted;
}

export function formatLeafStatsCompact(stats: LeafStatsCounts): string {
  const parts: string[] = [];
  if (stats.completed > 0) parts.push(`✓${stats.completed}`);
  if (stats.inProgress > 0) parts.push(`●${stats.inProgress}`);
  if (stats.notStarted > 0) parts.push(`○${stats.notStarted}`);
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

type NodeStatsProps = {
  stats: LeafStatsCounts;
  className?: string;
};

export function NodeStats({ stats, className }: NodeStatsProps) {
  if (getLeafStatsTotal(stats) === 0) return null;

  const items: { key: string; Icon: typeof Check; color: string; count: number }[] = [];
  if (stats.completed > 0) {
    items.push({ key: "completed", Icon: Check, color: LEAF_STAT_COLORS.completed, count: stats.completed });
  }
  if (stats.inProgress > 0) {
    items.push({ key: "inProgress", Icon: Loader, color: LEAF_STAT_COLORS.inProgress, count: stats.inProgress });
  }
  if (stats.notStarted > 0) {
    items.push({ key: "notStarted", Icon: Circle, color: LEAF_STAT_COLORS.notStarted, count: stats.notStarted });
  }

  return (
    <div
      className={cn(
        "mt-0.5 flex flex-wrap items-center justify-center gap-0.5 text-[10px] font-medium tabular-nums leading-none",
        className,
      )}
    >
      {items.map((item, index) => (
        <span key={item.key} className="inline-flex items-center gap-0.5">
          {index > 0 && <span className="text-white/70">·</span>}
          <item.Icon className="h-2.5 w-2.5 shrink-0" style={{ color: item.color }} strokeWidth={2.5} />
          <span>{item.count}</span>
        </span>
      ))}
    </div>
  );
}

type ProductMapNodeBubbleProps = {
  name: string;
  status: ProductMapStatus;
  calculatedProgress: number | null;
  isCenter?: boolean;
  childrenCount?: number;
  leafStats?: LeafStatsCounts;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  animationDelay?: number;
  variant?: "default" | "flow";
};

const sizePx = {
  sm: 64,
  md: 96,
  lg: 144,
} as const;

const sizeClasses = {
  sm: "h-16 w-16 text-[10px]",
  md: "h-20 w-20 text-xs sm:h-24 sm:w-24 sm:text-sm",
  lg: "h-28 w-28 text-sm sm:h-36 sm:w-36 sm:text-base",
};

function ProgressDonut({
  size,
  progress,
  strokeColor,
}: {
  size: number;
  progress: number;
  strokeColor: string;
}) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={size}
      height={size}
      aria-hidden
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#E5E5E5"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}

function BubbleContent({
  name,
  status,
  calculatedProgress,
  isCenter,
  size,
  className,
  dimmed,
  childrenCount,
  leafStats,
}: {
  name: string;
  status: ProductMapStatus;
  calculatedProgress: number | null;
  isCenter: boolean;
  size: ProductMapNodeBubbleProps["size"];
  className?: string;
  dimmed: boolean;
  childrenCount?: number;
  leafStats?: LeafStatsCounts;
}) {
  const isParent = (childrenCount ?? 0) > 0;
  const displayColor = dimmed
    ? getStatusColor("untracked")
    : isParent
      ? getColorByProgress(calculatedProgress)
      : getStatusColor(status);
  const showProgressLabel =
    isCenter && calculatedProgress !== null && !dimmed;
  const showLeafStats =
    isCenter &&
    (childrenCount ?? 0) > 0 &&
    leafStats !== undefined &&
    getLeafStatsTotal(leafStats) > 0;

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center rounded-full border-2 border-white p-2 text-center font-semibold leading-tight text-white shadow-lg",
        sizeClasses[size ?? "md"],
        isCenter && !dimmed && "shadow-xl ring-2 ring-[#C6017F]/20",
        dimmed && "opacity-60",
        className,
      )}
      style={{
        backgroundColor: displayColor,
        boxShadow: dimmed
          ? undefined
          : `0 4px 16px ${displayColor}55`,
      }}
    >
      <span className="line-clamp-2 px-1">{name}</span>
      {showProgressLabel && (
        <span className="mt-0.5 text-[10px] font-bold tabular-nums opacity-95 sm:text-xs">
          {calculatedProgress}%
        </span>
      )}
      {showLeafStats && <NodeStats stats={leafStats} />}
    </div>
  );
}

export function ProductMapNodeBubble({
  name,
  status,
  calculatedProgress,
  isCenter = false,
  childrenCount,
  leafStats,
  size = "md",
  className,
  onClick,
  onContextMenu,
  animationDelay = 0,
  variant = "default",
}: ProductMapNodeBubbleProps) {
  const dimmed = isVisuallyUntracked(calculatedProgress) || status === "untracked";
  const px = sizePx[size];
  const isParent = (childrenCount ?? 0) > 0;
  const ringColor = dimmed
    ? getStatusColor("untracked")
    : isParent
      ? getColorByProgress(calculatedProgress)
      : getStatusColor(status);
  const showRing = calculatedProgress !== null && !dimmed;
  const tooltip = getNodeTooltipText(status, calculatedProgress);

  const inner = (
    <div className="relative flex items-center justify-center" style={{ width: px, height: px }}>
      {showRing && (
        <ProgressDonut size={px} progress={calculatedProgress} strokeColor={ringColor} />
      )}
      <BubbleContent
        name={name}
        status={status}
        calculatedProgress={calculatedProgress}
        isCenter={isCenter}
        size={size}
        className={className}
        dimmed={dimmed}
        childrenCount={childrenCount}
        leafStats={leafStats}
      />
    </div>
  );

  const wrapped = (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">{inner}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="rounded-lg border-[#E5E5E5] bg-white text-[#2E2D2C]">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (variant === "flow") {
    return <div className="cursor-pointer">{wrapped}</div>;
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: animationDelay, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="cursor-pointer outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#C6017F] focus-visible:ring-offset-[#FAF8F5]"
    >
      {wrapped}
    </motion.button>
  );
}
