export type ProductMapStatus =
  | "untracked"
  | "not_started"
  | "lowest_fi"
  | "design"
  | "development"
  | "qa"
  | "completed";

export interface ProductMapNode {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  position: number;
  description: string | null;
  status: ProductMapStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProductMapNodeWithProgress extends ProductMapNode {
  calculated_progress: number | null;
  children_count: number;
  untracked_children_count: number;
  leaf_completed_count: number;
  leaf_in_progress_count: number;
  leaf_not_started_count: number;
}

export type LeafStatsCounts = {
  completed: number;
  inProgress: number;
  notStarted: number;
};

export type CreateProductMapNodeInput = {
  name: string;
  parent_id: string;
  position?: number;
  description?: string | null;
  status?: ProductMapStatus;
};

export type UpdateProductMapNodeInput = {
  id: string;
  parent_id: string | null;
  name?: string;
  status?: ProductMapStatus;
};

export type DeleteProductMapNodeInput = {
  id: string;
  parent_id: string | null;
};
