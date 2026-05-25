import { memo } from "react";
import { Link2 } from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getColorByProgress,
  getNodeHoverTooltip,
  getStatusColor,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import { getTimeHealthStroke } from "@/lib/time-health";
import type { ProductMapStatus, TimeHealth } from "@/types/product-map";

export const PANORAMIC_NODE_WIDTH = 140;
export const PANORAMIC_NODE_HEIGHT = 40;

export type PanoramicNodeData = {
  label: string;
  fullName: string;
  status: ProductMapStatus;
  calculatedProgress: number | null;
  childrenCount: number;
  hasNotes: boolean;
  clickUpLinksCount: number;
  timeHealth: TimeHealth;
};

export function formatPanoramicLabel(
  name: string,
  status: ProductMapStatus,
  calculatedProgress: number | null,
): string {
  const untracked = isVisuallyUntracked(calculatedProgress) || status === "untracked";
  if (untracked) return name;
  return `${name} · ${calculatedProgress}%`;
}

function PanoramicNodeComponent({ data }: NodeProps<{ type: "panoramic"; data: PanoramicNodeData }>) {
  const dimmed = isVisuallyUntracked(data.calculatedProgress) || data.status === "untracked";
  const isParent = data.childrenCount > 0;
  const statusBorderColor = dimmed
    ? getStatusColor("untracked")
    : isParent
      ? getColorByProgress(data.calculatedProgress)
      : getStatusColor(data.status);
  const healthStroke = getTimeHealthStroke(data.timeHealth);
  const borderColor = healthStroke ?? statusBorderColor;
  const bgColor = statusBorderColor;

  const tooltip = getNodeHoverTooltip(data.fullName, data.status, data.calculatedProgress);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="nodrag nopan relative flex cursor-pointer items-center justify-center rounded-md border px-2 py-1 shadow-sm transition-shadow hover:shadow-md"
            style={{
              width: PANORAMIC_NODE_WIDTH,
              height: PANORAMIC_NODE_HEIGHT,
              borderColor,
              borderWidth: healthStroke ? 2 : 1,
              backgroundColor: `${bgColor}33`,
            }}
          >
            {data.hasNotes && (
              <span
                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white shadow-sm ring-1 ring-[#2E2D2C]/20"
                aria-hidden
              />
            )}
            <Handle
              type="target"
              position={Position.Top}
              className="!pointer-events-none !h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
            />
            <span className="flex w-full items-center justify-center gap-1 px-0.5">
              {data.clickUpLinksCount > 0 && (
                <Link2
                  className="h-3 w-3 shrink-0 text-[#7B68EE]"
                  aria-hidden
                />
              )}
              <span className="line-clamp-2 min-w-0 flex-1 text-center text-[11px] font-semibold leading-tight text-[#2E2D2C]">
                {data.label}
              </span>
            </span>
            <Handle
              type="source"
              position={Position.Bottom}
              className="!pointer-events-none !h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs rounded-lg border-[#E5E5E5] bg-white text-[#2E2D2C]"
        >
          <div className="space-y-0.5">
            <p>{tooltip}</p>
            {data.clickUpLinksCount > 0 && (
              <p className="text-xs text-[#7B68EE]">
                {data.clickUpLinksCount} task
                {data.clickUpLinksCount === 1 ? "" : "s"} de ClickUp ligadas
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const PanoramicNode = memo(PanoramicNodeComponent);
