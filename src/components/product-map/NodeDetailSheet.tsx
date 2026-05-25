import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useNodePath, useProductMapNode } from "@/hooks/useProductMap";
import {
  countLeafDescendants,
  formatLeafDescendantBreakdown,
} from "@/lib/product-map-graph";
import {
  getCenterNodeAccentColor,
  getStatusLabel,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

export type NodeDetailSheetProps = {
  open: boolean;
  nodeId: string | null;
  onClose: () => void;
  allNodes: ProductMapNodeWithProgress[];
  onEditNode: (node: ProductMapNodeWithProgress) => void;
  onFocusInMindly: (nodeId: string) => void;
};

export function NodeDetailSheet({
  open,
  nodeId,
  onClose,
  allNodes,
  onEditNode,
  onFocusInMindly,
}: NodeDetailSheetProps) {
  const { data: node, isLoading, isError } = useProductMapNode(open ? nodeId : null);
  const { data: path = [], isLoading: pathLoading } = useNodePath(open ? nodeId : null);

  const directChildrenCount = useMemo(() => {
    if (!nodeId) return 0;
    return allNodes.filter((n) => n.parent_id === nodeId).length;
  }, [allNodes, nodeId]);

  const leafStats = useMemo(() => {
    if (!nodeId) return null;
    return countLeafDescendants(nodeId, allNodes);
  }, [allNodes, nodeId]);

  const breadcrumb = path.length > 0 ? path.map((n) => n.name).join(" › ") : null;
  const isLeaf = (node?.children_count ?? 0) === 0;
  const accentColor = node ? getCenterNodeAccentColor(node) : "#9CA3AF";
  const progressLabel =
    node && !isVisuallyUntracked(node.calculated_progress) && node.status !== "untracked"
      ? `${node.calculated_progress}%`
      : null;

  const createdLabel = node?.created_at
    ? format(new Date(node.created_at), "d MMM yyyy", { locale: es })
    : null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        {isLoading || pathLoading ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError || !node ? (
          <div className="pt-6 text-sm text-[#717B99]">No se pudo cargar el nodo.</div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-left text-xl text-[#2E2D2C]">{node.name}</SheetTitle>
              {breadcrumb && (
                <SheetDescription className="text-left text-xs text-[#717B99]">
                  {breadcrumb}
                </SheetDescription>
              )}
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge
                className="border-transparent text-white"
                style={{ backgroundColor: accentColor }}
              >
                {getStatusLabel(node.status)}
              </Badge>
              {progressLabel && (
                <span className="text-sm font-semibold tabular-nums text-[#2E2D2C]">
                  {progressLabel}
                </span>
              )}
            </div>

            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#2E2D2C]">Detalles</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#717B99]">Tipo</dt>
                  <dd className="font-medium text-[#2E2D2C]">
                    {isLeaf ? "Pantalla" : "Módulo / Grupo"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#717B99]">Hijos directos</dt>
                  <dd className="font-medium tabular-nums text-[#2E2D2C]">
                    {directChildrenCount}
                  </dd>
                </div>
                {!isLeaf && leafStats && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#717B99]">Descendientes hoja</dt>
                    <dd className="font-medium tabular-nums text-[#2E2D2C]">
                      {leafStats.total}{" "}
                      <span className="text-xs font-normal text-[#717B99]">
                        ({formatLeafDescendantBreakdown(leafStats)})
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#2E2D2C]">Notas</h3>
              <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#FAF8F5] px-4 py-8 text-center text-sm text-[#717B99]">
                Agrega notas, contexto y decisiones sobre este nodo
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button type="button" variant="outline" disabled className="w-full rounded-xl">
                        Editar notas
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Próximamente</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </section>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onEditNode(node)}
              >
                Editar nombre y estado
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-[#C6017F] hover:bg-[#B10072]"
                onClick={() => onFocusInMindly(node.id)}
              >
                Ver en vista Foco
              </Button>
            </div>

            {createdLabel && (
              <SheetFooter className="mt-auto pt-6 sm:justify-start">
                <p className="text-xs text-[#717B99]">Creado el {createdLabel}</p>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
