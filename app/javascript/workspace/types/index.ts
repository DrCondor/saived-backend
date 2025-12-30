// User types
export interface User {
  id: number;
  email: string;
  apiToken: string;
}

// Project types
export interface ProjectItem {
  id: number;
  name: string;
  note: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  currency: string;
  category: string | null;
  dimensions: string | null;
  status: string;
  external_url: string | null;
  discount_label: string | null;
  thumbnail_url: string | null;
  position: number;
}

export interface ProjectSection {
  id: number;
  name: string;
  position: number;
  total_price?: number;
  items?: ProjectItem[];
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  total_price: number;
  sections: ProjectSection[];
}

export interface ProjectListItem {
  id: number;
  name: string;
  created_at: string;
  total_price: number;
  sections: Array<{ id: number; name: string; position: number }>;
}

// Form input types
export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export interface CreateSectionInput {
  name?: string;
}

export interface UpdateSectionInput {
  name?: string;
  position?: number;
}

export interface CreateItemInput {
  name: string;
  note?: string;
  quantity: number;
  unit_price?: number;
  currency?: string;
  category?: string;
  dimensions?: string;
  status: string;
  external_url?: string;
  discount_label?: string;
  thumbnail_url?: string;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {}

// Reorder types
export interface ItemMove {
  item_id: number;
  section_id: number;
  position: number;
}

export interface ReorderInput {
  item_moves?: ItemMove[];
  section_order?: number[];
}

// Initial data from Rails
declare global {
  interface Window {
    __INITIAL_DATA__: {
      currentUser: User;
    };
  }
}
