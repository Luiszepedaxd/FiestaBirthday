import type { LinkObject, NodeObject } from "react-force-graph-2d";
import {
  computeNodeDepths,
  getGraphNodeColor,
  getGraphNodeRadius,
} from "@/lib/product-map-graph";
import type { ProductMapNodeWithProgress } from "@/types/product-map";

export type GraphForceNode = NodeObject & {
  id: string;
  name: string;
  depth: number;
  color: string;
  baseRadius: number;
  raw: ProductMapNodeWithProgress;
};

export type GraphForceLink = LinkObject<GraphForceNode, { id: string }>;

export function buildGraphData(
  nodes: ProductMapNodeWithProgress[],
): { nodes: GraphForceNode[]; links: GraphForceLink[] } {
  const depths = computeNodeDepths(nodes);

  const graphNodes: GraphForceNode[] = nodes.map((n) => {
    const depth = depths.get(n.id) ?? 0;
    return {
      id: n.id,
      name: n.name,
      depth,
      color: getGraphNodeColor(n),
      baseRadius: getGraphNodeRadius(depth),
      raw: n,
    };
  });

  const links: GraphForceLink[] = nodes
    .filter((n) => n.parent_id !== null)
    .map((n) => ({
      id: `${n.parent_id}-${n.id}`,
      source: n.parent_id as string,
      target: n.id,
    }));

  return { nodes: graphNodes, links };
}

export function getLinkEndpointId(endpoint: string | GraphForceNode): string {
  return typeof endpoint === "object" ? endpoint.id : endpoint;
}
