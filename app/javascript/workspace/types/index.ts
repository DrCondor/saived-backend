// Custom status type
export interface CustomStatus {
  id: string;
  name: string;
  color: string;
  include_in_sum: boolean;
}

// User types
export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  display_name: string;
  initials: string;
  company_name: string | null;
  phone: string | null;
  title: string | null;
  avatar_url: string | null;
  api_token: string;
  custom_statuses: CustomStatus[];
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  title?: string;
}

export interface UpdatePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
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
  favorite: boolean;
  position: number;
  total_price: number;
  sections: ProjectSection[];
}

export interface ProjectListItem {
  id: number;
  name: string;
  favorite: boolean;
  position: number;
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

// View mode type
export type ViewMode = 'grid' | 'list';

// Sort and filter types
export type SortOption =
  | 'default'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'status-approved'
  | 'status-proposal';

export interface FilterState {
  statuses: string[];
  categories: string[];
}

export interface ToolbarState {
  searchQuery: string;
  sortBy: SortOption;
  filters: FilterState;
}

// Initial data from Rails
declare global {
  interface Window {
    __INITIAL_DATA__: {
      currentUser: User;
    };
  }
}
