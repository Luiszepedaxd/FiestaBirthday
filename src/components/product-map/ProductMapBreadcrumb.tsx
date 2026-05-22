import { ChevronRight } from "lucide-react";
import type { ProductMapNode } from "@/types/product-map";
import { cn } from "@/lib/utils";

type ProductMapBreadcrumbProps = {
  path: ProductMapNode[];
  onNavigate: (nodeId: string | null) => void;
  className?: string;
};

export function ProductMapBreadcrumb({
  path,
  onNavigate,
  className,
}: ProductMapBreadcrumbProps) {
  if (path.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Ruta del mapa"
      className={cn("flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm", className)}
    >
      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        return (
          <span key={node.id} className="flex min-w-0 items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#717B99]" aria-hidden />
            )}
            <button
              type="button"
              disabled={isLast}
              onClick={() => onNavigate(node.id)}
              className={cn(
                "max-w-[140px] truncate rounded-md px-1.5 py-0.5 transition-colors sm:max-w-[200px]",
                isLast
                  ? "cursor-default font-semibold text-[#2E2D2C]"
                  : "text-[#717B99] hover:bg-[#FFF0F9] hover:text-[#C6017F]",
              )}
            >
              {node.name}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
