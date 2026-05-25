import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getColorByProgress,
  getNodeHoverTooltip,
  getStatusColor,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import type { ProductMapStatus, TimeHealth } from "@/types/product-map";

type ProductMapNodeBubbleProps = {
  name: string;
  status: ProductMapStatus;
  calculatedProgress: number | null;
  isCenter?: boolean;
  childrenCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  canEdit?: boolean;
  animationDelay?: number;
  variant?: "default" | "flow";
  hasNotes?: boolean;
  timeHealth?: TimeHealth;
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

function TimeHealthBadge({ timeHealth }: { timeHealth: TimeHealth }) {
  if (timeHealth !== "overdue" && timeHealth !== "at_risk") return null;
  const isOverdue = timeHealth === "overdue";
  return (
    <span
      className={cn(
        "absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold text-white shadow-sm",
        isOverdue ? "bg-[#EF4444]" : "bg-[#F59E0B]",
      )}
    >
      {isOverdue ? "Atrasado" : "En riesgo"}
    </span>
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
  hasNotes,
}: {
  name: string;
  status: ProductMapStatus;
  calculatedProgress: number | null;
  isCenter: boolean;
  size: ProductMapNodeBubbleProps["size"];
  className?: string;
  dimmed: boolean;
  childrenCount?: number;
  hasNotes?: boolean;
}) {
  const isParent = (childrenCount ?? 0) > 0;
  const displayColor = dimmed
    ? getStatusColor("untracked")
    : isParent
      ? getColorByProgress(calculatedProgress)
      : getStatusColor(status);
  const showProgressLabel =
    isCenter && calculatedProgress !== null && !dimmed;

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
      {hasNotes && (
        <FileText
          className="absolute bottom-1.5 right-1.5 text-white opacity-70"
          size={10}
          aria-hidden
        />
      )}
    </div>
  );
}

export function ProductMapNodeBubble({
  name,
  status,
  calculatedProgress,
  isCenter = false,
  childrenCount,
  size = "md",
  className,
  onClick,
  onDoubleClick,
  onContextMenu,
  canEdit = true,
  animationDelay = 0,
  variant = "default",
  hasNotes = false,
  timeHealth,
}: ProductMapNodeBubbleProps) {
  const dimmed = isVisuallyUntracked(calculatedProgress) || status === "untracked";
  const px = sizePx[size];
  const isParent = (childrenCount ?? 0) > 0;
  const ringColor = dimmed
    ? getStatusColor("untracked")
    : isParent
      ? getColorByProgress(calculatedProgress)
      : getStatusColor(status);
  const showRing =
    isCenter && calculatedProgress !== null && !dimmed;
  const tooltip = getNodeHoverTooltip(name, status, calculatedProgress);

  const inner = (
    <div className="relative flex items-center justify-center" style={{ width: px, height: px }}>
      {timeHealth && <TimeHealthBadge timeHealth={timeHealth} />}
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
        hasNotes={hasNotes}
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
    return (
      <div className={canEdit ? "cursor-pointer" : "cursor-default"} title={canEdit ? undefined : "Solo lectura"}>
        {wrapped}
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: animationDelay, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={canEdit ? { scale: 1.06 } : undefined}
      whileTap={canEdit ? { scale: 0.96 } : undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={canEdit ? onContextMenu : undefined}
      title={canEdit ? undefined : "Solo lectura"}
      className={cn(
        "outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#C6017F] focus-visible:ring-offset-[#FAF8F5]",
        canEdit ? "cursor-pointer" : "cursor-default",
      )}
    >
      {wrapped}
    </motion.button>
  );
}
