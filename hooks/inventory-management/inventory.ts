import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/hooks/queryKeys";
import { inventoryService, type InventoryRoleScope } from "@/services/inventory-management/inventory.service";
import type {
  InventoryItemPayload,
  InventoryListParams,
  RecipePayload,
  StockAdjustmentPayload,
  TransferPayload,
  WastePayload,
} from "@/types/inventory-management";

type InventoryTransactionsParams = InventoryListParams & {
  type?: string;
  inventory_item_id?: number | string;
};

type InventoryBatchesParams = InventoryListParams & {
  inventory_item_id?: number | string;
};

type InventoryMenuItemsParams = InventoryListParams & {
  type?: string;
  is_active?: boolean;
  is_available?: boolean;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function invalidateInventory(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.inventory.root() });
}

export function useInventoryItemsQuery(params: InventoryListParams = {}, scope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.items(params, scope),
    queryFn: () => inventoryService.items(params, scope),
  });
}

export function useInventoryItemQuery(id?: number | string, scope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: ["inventory", "item", scope, id ?? ""] as const,
    queryFn: () => inventoryService.item(id as number | string, scope),
    enabled: Boolean(id),
  });
}

export function useInventoryTransactionsQuery(params: InventoryTransactionsParams = {}, scope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.transactions(params, scope),
    queryFn: () => inventoryService.transactions(params, scope),
  });
}

export function useInventoryBatchesQuery(params: InventoryBatchesParams = {}, scope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.batches(params, scope),
    queryFn: () => inventoryService.batches(params, scope),
  });
}

export function useInventoryMenuItemsQuery(params: InventoryMenuItemsParams = {}, scope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.menuItems(params, scope),
    queryFn: () => inventoryService.menuItems(params, scope),
  });
}

export function useRecipesQuery(params: InventoryListParams = {}, scope: InventoryRoleScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.recipes(params, scope),
    queryFn: () => inventoryService.recipes(params, scope),
  });
}

export function useLowStockQuery(scope: InventoryRoleScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.lowStock(scope),
    queryFn: () => inventoryService.lowStock(scope),
  });
}

export function useStockValuationQuery(scope: InventoryRoleScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.valuation(scope),
    queryFn: () => inventoryService.stockValuation(scope),
  });
}

export function useRecipeIntegrityQuery(scope: InventoryRoleScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.recipeIntegrity(scope),
    queryFn: () => inventoryService.recipeIntegrity(scope),
  });
}

export function useStockStatusSummaryQuery(scope: InventoryRoleScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.summary(scope),
    queryFn: () => inventoryService.stockStatusSummary(scope),
  });
}

export function useCreateInventoryItemMutation(onSuccess?: () => void, scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InventoryItemPayload) => inventoryService.createItem(payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Inventory item created");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create inventory item")),
  });
}

export function useUpdateInventoryItemMutation(onSuccess?: () => void, scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<InventoryItemPayload> }) =>
      inventoryService.updateItem(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Inventory item updated");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update inventory item")),
  });
}

export function useDeleteInventoryItemMutation(scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => inventoryService.deleteItem(id, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Inventory item deleted");
      invalidateInventory(queryClient);
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete inventory item")),
  });
}

export function useAdjustStockMutation(onSuccess?: () => void, scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: StockAdjustmentPayload }) =>
      inventoryService.adjustItem(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Stock adjusted");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to adjust stock")),
  });
}

export function useRecordWasteMutation(onSuccess?: () => void, scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: WastePayload }) =>
      inventoryService.wasteItem(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Waste recorded");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to record waste")),
  });
}

export function useTransferStockMutation(onSuccess?: () => void, scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: TransferPayload }) =>
      inventoryService.transferItem(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Stock transferred");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to transfer stock")),
  });
}

export function useCreateRecipeMutation(onSuccess?: () => void, scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RecipePayload) => inventoryService.createRecipe(payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Recipe saved");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to save recipe")),
  });
}

export function useUpdateRecipeMutation(onSuccess?: () => void, scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: RecipePayload }) =>
      inventoryService.updateRecipe(id, payload, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Recipe updated");
      invalidateInventory(queryClient);
      onSuccess?.();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update recipe")),
  });
}

export function useDeleteRecipeMutation(scope: InventoryRoleScope = "admin") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => inventoryService.deleteRecipe(id, scope),
    onSuccess: (response) => {
      toast.success(response.message ?? "Recipe deleted");
      invalidateInventory(queryClient);
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete recipe")),
  });
}
