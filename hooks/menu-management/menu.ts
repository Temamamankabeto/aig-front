import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "@/services/menu-management";
import { queryKeys } from "@/hooks/queryKeys";
import type { MenuCategoryPayload, MenuItemPayload, MenuMode } from "@/types/menu-management";
import { toast } from "sonner";

export function useMenuCategoriesQuery(params = {}, scope = "admin") {
  return useQuery({
    queryKey: queryKeys.menu.categories(params, scope),
    queryFn: () => menuService.categories(params, scope),
  });
}

export function useMenuItemsQuery(params = {}, scope = "admin") {
  return useQuery({
    queryKey: queryKeys.menu.items(params, scope),
    queryFn: () => menuService.items(params, scope),
  });
}

export function useCreateMenuCategoryMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: MenuCategoryPayload) => menuService.createCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Category created");
      done?.();
    },
  });
}

export function useUpdateMenuCategoryMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: MenuCategoryPayload }) =>
      menuService.updateCategory(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Category updated");
      done?.();
    },
  });
}

export function useToggleMenuCategoryMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => menuService.toggleCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Category status updated");
    },
  });
}

export function useDeleteMenuCategoryMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => menuService.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Category deleted");
    },
  });
}

export function useCreateMenuItemMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: MenuItemPayload) => menuService.createItem(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Menu item created");
      done?.();
    },
  });
}

export function useUpdateMenuItemMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: MenuItemPayload }) =>
      menuService.updateItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Menu item updated");
      done?.();
    },
  });
}

export function useToggleMenuItemMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => menuService.toggleItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Menu item status updated");
    },
  });
}

export function useMenuItemAvailabilityMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string | number; isAvailable: boolean }) =>
      menuService.availability(id, isAvailable),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Menu item availability updated");
    },
  });
}

export function useSetMenuItemModeMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, mode }: { id: string | number; mode: MenuMode }) =>
      mode === "spatial" ? menuService.spatial(id) : menuService.normal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Menu item mode updated");
    },
  });
}

export function useDeleteMenuItemMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => menuService.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Menu item deleted");
    },
  });
}
