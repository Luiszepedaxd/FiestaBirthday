import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";
import { productMapKeys } from "@/hooks/useProductMap";
import {
  getProductMapMutationErrorMessage,
  isProductMapPermissionError,
} from "@/lib/product-map-mutation-errors";
import type { ClickUpLink } from "@/types/product-map";

const CLICKUP_LINKS_TABLE = "product_map_clickup_links";
const STALE_TIME_MS = 30_000;

export const clickUpLinkKeys = {
  byNode: (nodeId: string) => ["clickup-links", nodeId] as const,
};

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string })?.code === "23505";
}

async function fetchMaxPosition(nodeId: string): Promise<number> {
  const { data, error } = await supabase
    .from(CLICKUP_LINKS_TABLE)
    .select("position")
    .eq("node_id", nodeId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return ((data as { position: number } | null)?.position ?? -1) + 1;
}

export function useClickUpLinks(nodeId: string | null) {
  return useQuery({
    queryKey: clickUpLinkKeys.byNode(nodeId ?? ""),
    enabled: Boolean(nodeId),
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<ClickUpLink[]> => {
      if (!nodeId) return [];
      const { data, error } = await supabase
        .from(CLICKUP_LINKS_TABLE)
        .select("id, node_id, clickup_url, task_id, task_name, position, created_at")
        .eq("node_id", nodeId)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ClickUpLink[];
    },
  });
}

export function useAddClickUpLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      node_id: string;
      clickup_url: string;
      task_name?: string | null;
    }): Promise<ClickUpLink> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const position = await fetchMaxPosition(input.node_id);
      const trimmedUrl = input.clickup_url.trim();
      const trimmedName = input.task_name?.trim() || null;

      const { data, error } = await supabase
        .from(CLICKUP_LINKS_TABLE)
        .insert({
          node_id: input.node_id,
          clickup_url: trimmedUrl,
          task_name: trimmedName,
          position,
          created_by: user?.id ?? null,
        })
        .select("id, node_id, clickup_url, task_id, task_name, position, created_at")
        .single();

      if (error) throw error;
      return data as ClickUpLink;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: clickUpLinkKeys.byNode(variables.node_id),
      });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === productMapKeys.all[0],
      });
      toast.success("Task ligada");
    },
    onError: (error, variables) => {
      if (isUniqueViolation(error)) {
        toast.warning("Esta task ya está ligada al nodo");
        return;
      }
      if (isProductMapPermissionError(error)) {
        toast.error("No tienes permisos");
        return;
      }
      toast.error(getProductMapMutationErrorMessage(error));
      void queryClient.invalidateQueries({
        queryKey: clickUpLinkKeys.byNode(variables.node_id),
      });
    },
  });
}

export function useUpdateClickUpLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      node_id: string;
      task_name: string | null;
    }): Promise<ClickUpLink> => {
      const trimmedName = input.task_name?.trim() || null;
      const { data, error } = await supabase
        .from(CLICKUP_LINKS_TABLE)
        .update({ task_name: trimmedName })
        .eq("id", input.id)
        .select("id, node_id, clickup_url, task_id, task_name, position, created_at")
        .single();

      if (error) throw error;
      return data as ClickUpLink;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: clickUpLinkKeys.byNode(variables.node_id),
      });
      toast.success("Alias actualizado");
    },
    onError: (error) => {
      if (isProductMapPermissionError(error)) {
        toast.error("No tienes permisos");
        return;
      }
      toast.error(getProductMapMutationErrorMessage(error));
    },
  });
}

export function useDeleteClickUpLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: ClickUpLink): Promise<ClickUpLink> => {
      const { error } = await supabase
        .from(CLICKUP_LINKS_TABLE)
        .delete()
        .eq("id", link.id);

      if (error) throw error;
      return link;
    },
    onSuccess: (snapshot) => {
      void queryClient.invalidateQueries({
        queryKey: clickUpLinkKeys.byNode(snapshot.node_id),
      });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === productMapKeys.all[0],
      });

      toast.success("Task desligada", {
        action: {
          label: "Deshacer",
          onClick: () => {
            void supabase
              .from(CLICKUP_LINKS_TABLE)
              .insert({
                node_id: snapshot.node_id,
                clickup_url: snapshot.clickup_url,
                task_name: snapshot.task_name,
                position: snapshot.position,
              })
              .then(({ error }) => {
                if (error) {
                  if (isUniqueViolation(error)) {
                    toast.warning("Esta task ya está ligada al nodo");
                  } else {
                    toast.error(getProductMapMutationErrorMessage(error));
                  }
                  return;
                }
                void queryClient.invalidateQueries({
                  queryKey: clickUpLinkKeys.byNode(snapshot.node_id),
                });
                void queryClient.invalidateQueries({
                  predicate: (query) =>
                    Array.isArray(query.queryKey) &&
                    query.queryKey[0] === productMapKeys.all[0],
                });
                toast.success("Task restaurada");
              });
          },
        },
      });
    },
    onError: (error) => {
      if (isProductMapPermissionError(error)) {
        toast.error("No tienes permisos");
        return;
      }
      toast.error(getProductMapMutationErrorMessage(error));
    },
  });
}
