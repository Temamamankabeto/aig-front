import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { menuService, type MenuRoleScope } from "@/services/menu-management";
import type { MenuCategoryParams, MenuItemParams } from "@/types/menu-management";

export const useMenuCategoriesQuery = (params: MenuCategoryParams = {}, scope: MenuRoleScope = "admin") =>
  useQuery({ queryKey: queryKeys.menu.categories(params, scope), queryFn: () => menuService.categories(params, scope) });

export const useMenuItemsQuery = (params: MenuItemParams = {}, scope: MenuRoleScope = "admin") =>
  useQuery({ queryKey: queryKeys.menu.items(params, scope), queryFn: () => menuService.items(params, scope) });
