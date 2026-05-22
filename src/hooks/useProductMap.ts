import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  CreateProductMapNodeInput,
  DeleteProductMapNodeInput,
  ProductMapNode,
  UpdateProductMapNodeInput,
} from "@/types/product-map";

const NODE_COLUMNS =
  "id, name, parent_id, color, position, description, created_at, updated_at, created_by";

export const productMapKeys = {
  all: ["product-map"] as const,
  children: (parentId: string | null) => ["product-map", "children", parentId] as const,
  root: ["product-map", "root"] as const,
  path: (nodeId: string) => ["product-map", "path", nodeId] as const,
  node: (nodeId: string) => ["product-map", "node", nodeId] as const,
};

async function fetchNodeById(nodeId: string): Promise<ProductMapNode> {
  const { data, error } = await supabase
    .from("product_map_nodes")
    .select(NODE_COLUMNS)
    .eq("id", nodeId)
    .single();

  if (error) throw error;
  return data as ProductMapNode;
}

async function fetchPathFromRoot(nodeId: string): Promise<ProductMapNode[]> {
  const path: ProductMapNode[] = [];
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
    queryFn: async (): Promise<ProductMapNode[]> => {
      const { data, error } = await supabase
        .from("product_map_nodes")
        .select(NODE_COLUMNS)
        .eq("parent_id", parentId as string)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ProductMapNode[];
    },
  });
}

export function useRootNode() {
  return useQuery({
    queryKey: productMapKeys.root,
    queryFn: async (): Promise<ProductMapNode | null> => {
      const { data, error } = await supabase
        .from("product_map_nodes")
        .select(NODE_COLUMNS)
        .is("parent_id", null)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as ProductMapNode | null) ?? null;
    },
  });
}

export function useNodePath(nodeId: string | null) {
  return useQuery({
    queryKey: productMapKeys.path(nodeId ?? ""),
    enabled: Boolean(nodeId),
    queryFn: async (): Promise<ProductMapNode[]> => {
      if (!nodeId) return [];
      return fetchPathFromRoot(nodeId);
    },
  });
}

export function useProductMapNode(nodeId: string | null) {
  return useQuery({
    queryKey: productMapKeys.node(nodeId ?? ""),
    enabled: Boolean(nodeId),
    queryFn: async (): Promise<ProductMapNode | null> => {
      if (!nodeId) return null;
      return fetchNodeById(nodeId);
    },
  });
}

function invalidateNodeQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  parentId: string | null,
  nodeId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: productMapKeys.all });
  void queryClient.invalidateQueries({ queryKey: productMapKeys.children(parentId) });
  if (nodeId) {
    void queryClient.invalidateQueries({ queryKey: productMapKeys.path(nodeId) });
    void queryClient.invalidateQueries({ queryKey: productMapKeys.node(nodeId) });
  }
  void queryClient.invalidateQueries({ queryKey: productMapKeys.root });
}

export function useCreateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductMapNodeInput): Promise<ProductMapNode> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
          color: input.color,
          position: nextPosition,
          description: input.description ?? null,
          created_by: user?.id ?? null,
        })
        .select(NODE_COLUMNS)
        .single();

      if (error) throw error;
      return data as ProductMapNode;
    },
    onSuccess: (data) => {
      invalidateNodeQueries(queryClient, data.parent_id, data.id);
    },
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProductMapNodeInput): Promise<ProductMapNode> => {
      const { data, error } = await supabase
        .from("product_map_nodes")
        .update({
          name: input.name,
          color: input.color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select(NODE_COLUMNS)
        .single();

      if (error) throw error;
      return data as ProductMapNode;
    },
    onSuccess: (data) => {
      invalidateNodeQueries(queryClient, data.parent_id, data.id);
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
    onSuccess: (_data, variables) => {
      invalidateNodeQueries(queryClient, variables.parent_id);
      void queryClient.invalidateQueries({ queryKey: productMapKeys.all });
    },
  });
}
