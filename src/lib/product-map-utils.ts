import type { ProductMapNodeWithProgress } from "@/types/product-map";

type NodePathInput = Pick<ProductMapNodeWithProgress, "id" | "parent_id" | "name">;

export function buildNodePath(node: NodePathInput, allNodes: NodePathInput[]): string[] {
  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const path: string[] = [];
  let current: NodePathInput | undefined = node;

  while (current) {
    path.unshift(current.name);
    if (!current.parent_id) break;
    current = byId.get(current.parent_id);
  }

  return path;
}

export function formatNodePathBreadcrumb(pathNames: string[]): string {
  return pathNames.join(" › ");
}
