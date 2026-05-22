export interface ProductMapNode {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  position: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type CreateProductMapNodeInput = {
  name: string;
  parent_id: string;
  color: string;
  position?: number;
  description?: string | null;
};

export type UpdateProductMapNodeInput = {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
};

export type DeleteProductMapNodeInput = {
  id: string;
  parent_id: string | null;
};
