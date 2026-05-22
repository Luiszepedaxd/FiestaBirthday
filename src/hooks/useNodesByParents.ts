import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

const NODE_VIEW = "product_map_nodes_with_progress";
const NODE_VIEW_COLUMNS = "*";

function childrenBulkKey(parentIds: string[]) {
  return ["product-map", "children-bulk", [...parentIds].sort().join(",")] as const;
}

export function useNodesByParents(parentIds: string[]) {
  const sortedIds = [...parentIds].sort();

  return useQuery({
    queryKey: childrenBulkKey(parentIds),
    enabled: parentIds.length > 0,
    queryFn: async (): Promise<ProductMapNodeWithProgress[]> => {
      const { data, error } = await supabase
        .from(NODE_VIEW)
        .select(NODE_VIEW_COLUMNS)
        .in("parent_id", sortedIds)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ProductMapNodeWithProgress[];
    },
  });
}
