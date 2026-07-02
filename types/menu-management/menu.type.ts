export type MenuType = "food" | "drink";

export type MenuMode = "normal" | "spatial";

export type MenuRoleScope =
  | "admin"
  | "waiter"
  | "food-controller"
  | "public";

// 
  
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedResponse<T> {
  success?: boolean;
  message?: string;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export interface MenuCategory {
  id: number | string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sort_order?: number | null;
  is_active: boolean | number;
  items_count?: number;
  menu_items_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: number | string;
  category_id: number | string;
  menu_category_id?: number | string;
  category?: MenuCategory | null;
  name: string;
  description?: string | null;
  type: MenuType;
  price: number | string;
  image_path?: string | null;
  image_url?: string | null;
  is_available: boolean | number;
  is_active: boolean | number;
  menu_mode?: MenuMode;
  created_at?: string;
  updated_at?: string;
}

export interface MenuCategoryParams {
  search?: string;
  active?: "all" | 0 | 1 | boolean;
  is_active?: "all" | 0 | 1 | boolean;
  page?: number;
  per_page?: number;
}

export interface MenuItemParams {
  search?: string;
  type?: MenuType | "all";
  category_id?: number | string | "all";
  active?: "all" | 0 | 1 | boolean;
  is_active?: "all" | 0 | 1 | boolean;
  available?: "all" | 0 | 1 | boolean;
  is_available?: "all" | 0 | 1 | boolean;
  menu_mode?: MenuMode | "all";
  page?: number;
  per_page?: number;
}

export interface MenuCategoryPayload {
  name: string;
  description?: string | null;
  icon?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
}

export interface MenuItemPayload {
  category_id: number | string;
  name: string;
  description?: string | null;
  type: MenuType;
  price: number;
  is_available?: boolean;
  is_active?: boolean;
  menu_mode?: MenuMode;
  image?: File | null;
}
