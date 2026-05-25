import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAllProductMapNodes } from "@/hooks/useAllProductMapNodes";
import { buildNodePath, formatNodePathBreadcrumb } from "@/lib/product-map-utils";
import {
  getCenterNodeAccentColor,
  isVisuallyUntracked,
} from "@/lib/product-map-status";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

const MAX_RESULTS = 50;

export type ProductMapSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNode: (nodeId: string) => void;
};

function filterNodes(nodes: ProductMapNodeWithProgress[], query: string): ProductMapNodeWithProgress[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes.slice(0, MAX_RESULTS);

  return nodes
    .filter((node) => node.name.toLowerCase().includes(q))
    .slice(0, MAX_RESULTS);
}

function SearchResultItem({
  node,
  pathLabel,
  onSelect,
}: {
  node: ProductMapNodeWithProgress;
  pathLabel: string;
  onSelect: () => void;
}) {
  const dotColor = getCenterNodeAccentColor(node);
  const showProgress =
    !isVisuallyUntracked(node.calculated_progress) && node.status !== "untracked";

  return (
    <CommandItem
      value={node.id}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg py-2.5 aria-selected:bg-[#FFF0F9]"
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-[#2E2D2C]">{node.name}</span>
          {showProgress && (
            <span className="shrink-0 text-xs tabular-nums text-[#717B99]">
              {node.calculated_progress}%
            </span>
          )}
          {node.has_notes && (
            <FileText className="h-3.5 w-3.5 shrink-0 text-[#717B99]" aria-label="Tiene notas" />
          )}
        </div>
        <p className="truncate text-xs text-[#717B99]">{pathLabel}</p>
      </div>
    </CommandItem>
  );
}

export function ProductMapSearch({ open, onOpenChange, onSelectNode }: ProductMapSearchProps) {
  const { data: allNodes = [], isLoading } = useAllProductMapNodes();
  const [query, setQuery] = useState("");

  const results = useMemo(() => filterNodes(allNodes, query), [allNodes, query]);

  const pathByNodeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of allNodes) {
      map.set(node.id, formatNodePathBreadcrumb(buildNodePath(node, allNodes)));
    }
    return map;
  }, [allNodes]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };

  const handleSelect = (nodeId: string) => {
    onSelectNode(nodeId);
    setQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 shadow-lg">
        <Command shouldFilter={false} className="rounded-lg">
          <CommandInput
            placeholder="Busca cualquier pantalla, módulo o usuario..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[360px]">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-[#717B99]">Cargando nodos…</p>
            ) : (
              <>
                <CommandEmpty>
                  {query.trim()
                    ? `Sin resultados para '${query.trim()}'`
                    : "Escribe para buscar en el mapa"}
                </CommandEmpty>
                <CommandGroup>
                  {results.map((node) => (
                    <SearchResultItem
                      key={node.id}
                      node={node}
                      pathLabel={pathByNodeId.get(node.id) ?? node.name}
                      onSelect={() => handleSelect(node.id)}
                    />
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <div className="border-t border-[#F2F2F2] px-3 py-2 text-xs text-[#717B99]">
            ↑↓ navegar · ↵ seleccionar · esc cerrar
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
