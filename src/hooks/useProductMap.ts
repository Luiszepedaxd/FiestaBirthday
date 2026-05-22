import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getStatusColor } from "@/lib/product-map-status";
import type {
  CreateProductMapNodeInput,
  DeleteProductMapNodeInput,
  ProductMapNodeWithProgress,
  ProductMapStatus,
  UpdateProductMapNodeInput,
} from "@/types/product-map";

const NODE_VIEW = "product_map_nodes_with_progress";

const NODE_VIEW_COLUMNS = "*";

export const productMapKeys = {
  all: ["product-map"] as const,
  children: (parentId: string | null) => ["product-map", "children", parentId] as const,
  root: ["product-map", "root"] as const,
  path: (nodeId: string) => ["product-map", "path", nodeId] as const,
  node: (nodeId: string) => ["product-map", "node", nodeId] as const,
  globalProgress: ["product-map", "global-progress"] as const,
  trackingStats: ["product-map", "tracking-stats"] as const,
};

function invalidateAllProductMapQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey[0] === productMapKeys.all[0],
  });
}

async function fetchNodeById(nodeId: string): Promise<ProductMapNodeWithProgress> {
  const { data, error } = await supabase
    .from(NODE_VIEW)
    .select(NODE_VIEW_COLUMNS)
    .eq("id", nodeId)
    .single();

  if (error) throw error;
  return data as ProductMapNodeWithProgress;
}

async function fetchPathFromRoot(nodeId: string): Promise<ProductMapNodeWithProgress[]> {
  const path: ProductMapNodeWithProgress[] = [];
  let currentId: string | null = nodeId;

  while (currentId) {
    const node = await fetchNodeById(currentId);
    path.unshift(node);
    currentId = node.parent_id;
  }

  return path;
}

export function useNodesByParent(parentId: string | null) {
  return useQuery({
    queryKey: productMapKeys.children(parentId),
    enabled: parentId !== null,
    queryFn: async (): Promise<ProductMapNodeWithProgress[]> => {
      const { data, error } = await supabase
        .from(NODE_VIEW)
        .select(NODE_VIEW_COLUMNS)
        .eq("parent_id", parentId as string)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ProductMapNodeWithProgress[];
    },
  });
}

export function useRootNode() {
  return useQuery({
    queryKey: productMapKeys.root,
    queryFn: async (): Promise<ProductMapNodeWithProgress | null> => {
      const { data, error } = await supabase
        .from(NODE_VIEW)
        .select(NODE_VIEW_COLUMNS)
        .is("parent_id", null)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as ProductMapNodeWithProgress | null) ?? null;
    },
  });
}

export function useNodePath(nodeId: string | null) {
  return useQuery({
    queryKey: productMapKeys.path(nodeId ?? ""),
    enabled: Boolean(nodeId),
    queryFn: async (): Promise<ProductMapNodeWithProgress[]> => {
      if (!nodeId) return [];
      return fetchPathFromRoot(nodeId);
    },
  });
}

export function useProductMapNode(nodeId: string | null) {
  return useQuery({
    queryKey: productMapKeys.node(nodeId ?? ""),
    enabled: Boolean(nodeId),
    queryFn: async (): Promise<ProductMapNodeWithProgress | null> => {
      if (!nodeId) return null;
      return fetchNodeById(nodeId);
    },
  });
}

export function useGlobalProgress() {
  return useQuery({
    queryKey: productMapKeys.globalProgress,
    queryFn: async (): Promise<{
      progress: number | null;
      root: ProductMapNodeWithProgress | null;
    }> => {
      const { data, error } = await supabase
        .from(NODE_VIEW)
        .select(NODE_VIEW_COLUMNS)
        .is("parent_id", null)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      const root = (data as ProductMapNodeWithProgress | null) ?? null;
      return {
        progress: root?.calculated_progress ?? null,
        root,
      };
    },
  });
}

export function useMapTrackingStats() {
  return useQuery({
    queryKey: productMapKeys.trackingStats,
    queryFn: async (): Promise<{ tracked: number; untracked: number }> => {
      const { data, error } = await supabase.from(NODE_VIEW).select("status");

      if (error) throw error;
      const rows = (data ?? []) as { status: ProductMapStatus }[];
      const untracked = rows.filter((r) => r.status === "untracked").length;
      const tracked = rows.length - untracked;
      return { tracked, untracked };
    },
  });
}

export function useCreateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductMapNodeInput): Promise<ProductMapNodeWithProgress> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const status: ProductMapStatus = input.status ?? "not_started";
      const color = getStatusColor(status);

      const siblings = await supabase
        .from("product_map_nodes")
        .select("position")
        .eq("parent_id", input.parent_id)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition =
        input.position ??
        (((siblings.data?.[0] as { position: number } | undefined)?.position ?? -1) + 1);

      const { data, error } = await supabase
        .from("product_map_nodes")
        .insert({
          name: input.name,
          parent_id: input.parent_id,
          color,
          status,
          position: nextPosition,
          description: input.description ?? null,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;
      return fetchNodeById((data as { id: string }).id);
    },
    onSuccess: () => {
      invalidateAllProductMapQueries(queryClient);
    },
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProductMapNodeInput): Promise<ProductMapNodeWithProgress> => {
      const payload: Record<string, string> = {
        updated_at: new Date().toISOString(),
      };

      if (input.name !== undefined) {
        payload.name = input.name;
      }
      if (input.status !== undefined) {
        payload.status = input.status;
        payload.color = getStatusColor(input.status);
      }

      const { error } = await supabase
        .from("product_map_nodes")
        .update(payload)
        .eq("id", input.id);

      if (error) throw error;
      return fetchNodeById(input.id);
    },
    onSuccess: () => {
      invalidateAllProductMapQueries(queryClient);
    },
  });
}

export function useDeleteNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteProductMapNodeInput): Promise<void> => {
      const { error } = await supabase.from("product_map_nodes").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllProductMapQueries(queryClient);
    },
  });
}
