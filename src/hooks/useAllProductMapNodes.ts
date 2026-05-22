import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { productMapKeys } from "@/hooks/useProductMap";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

const NODE_VIEW = "product_map_nodes_with_progress";

const NODE_VIEW_COLUMNS = "*";

export const allProductMapNodesKey = [...productMapKeys.all, "all-nodes"] as const;

const STALE_TIME_MS = 60_000;

export function useAllProductMapNodes() {
  return useQuery({
    queryKey: allProductMapNodesKey,
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<ProductMapNodeWithProgress[]> => {
      const { data, error } = await supabase
        .from(NODE_VIEW)
        .select(NODE_VIEW_COLUMNS)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ProductMapNodeWithProgress[];
    },
  });
}
