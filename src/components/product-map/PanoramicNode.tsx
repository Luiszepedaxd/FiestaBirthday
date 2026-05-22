import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getNodeTooltipText,
  getStatusColor,
  getStatusLabel,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import type { ProductMapStatus } from "@/types/product-map";

export const PANORAMIC_NODE_WIDTH = 140;
export const PANORAMIC_NODE_HEIGHT = 40;

export type PanoramicNodeData = {
  label: string;
  fullName: string;
  status: ProductMapStatus;
  calculatedProgress: number | null;
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
  const effectiveStatus: ProductMapStatus = dimmed ? "untracked" : data.status;
  const borderColor = getStatusColor(effectiveStatus);
  const bgColor = getStatusColor(effectiveStatus);

  const tooltipLines = [
    data.fullName,
    data.calculatedProgress !== null && data.status !== "untracked"
      ? `${getStatusLabel(data.status)} · ${data.calculatedProgress}%`
      : getNodeTooltipText(data.status, data.calculatedProgress),
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="nodrag nopan flex cursor-pointer items-center justify-center rounded-md border px-2 shadow-sm transition-shadow hover:shadow-md"
            style={{
              width: PANORAMIC_NODE_WIDTH,
              height: PANORAMIC_NODE_HEIGHT,
              borderColor,
              backgroundColor: `${bgColor}33`,
            }}
          >
            <Handle
              type="target"
              position={Position.Top}
              className="!pointer-events-none !h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
            />
            <span className="line-clamp-2 w-full text-center text-[11px] font-semibold leading-tight text-[#2E2D2C]">
              {data.label}
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
          <p className="font-semibold">{tooltipLines[0]}</p>
          <p className="text-xs text-[#717B99]">{tooltipLines[1]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const PanoramicNode = memo(PanoramicNodeComponent);
