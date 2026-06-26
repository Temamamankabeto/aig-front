import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "@/services/menu-management";
import { queryKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";

export function useMenuCategoriesQuery(params = {}, scope = "admin") {
  return useQuery({
    queryKey: queryKeys.menu.categories(params, scope),
    queryFn: () => menuService.categories(params, scope),
  });
}

export function useCreateMenuCategoryMutation(done?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: menuService.createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.menu.root() });
      toast.success("Category created");
      done?.();
    },
  });
}