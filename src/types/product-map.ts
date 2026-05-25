import type { JSONContent } from "@tiptap/react";

export type ProductMapStatus =
  | "untracked"
  | "not_started"
  | "lowest_fi"
  | "design"
  | "development"
  | "qa"
  | "completed";

export type TimeHealth = "on_track" | "at_risk" | "overdue" | "no_target" | "completed";

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
  notes: JSONContent | null;
  notes_plain_text: string | null;
  target_date: string | null;
  notes_updated_at: string | null;
}

export interface ClickUpLink {
  id: string;
  node_id: string;
  clickup_url: string;
  task_id: string | null;
  task_name: string | null;
  position: number;
  created_at: string;
}

export interface ProductMapNodeWithProgress extends ProductMapNode {
  calculated_progress: number | null;
  children_count: number;
  untracked_children_count: number;
  time_health: TimeHealth;
  has_notes: boolean;
  clickup_links_count: number;
}

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
