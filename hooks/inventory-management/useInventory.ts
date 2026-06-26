import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import inventoryService, { type InventoryRoleScope } from "@/services/inventory-management/inventory.service";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  InventoryItemPayload,
  InventoryListParams,
  RecipePayload,
  StockAdjustmentPayload,
  TransferPayload,
  WastePayload,
} from "@/types/inventory-management";

export type InventoryScope = InventoryRoleScope;

function invalidateInventory(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.inventory.root() });
}

export function useInventoryItems(params: InventoryListParams = {}, scope: InventoryScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.items(params, scope),
    queryFn: () => inventoryService.items(params, scope),
  });
}

export function useInventoryItem(id?: string | number, scope: InventoryScope = "admin") {
  return useQuery({
    queryKey: ["inventory", "item", scope, id],
    queryFn: () => inventoryService.item(id as string | number, scope),
    enabled: Boolean(id),
  });
}

export function useCreateInventoryItem(done?: () => void, scope: InventoryScope = "admin") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryItemPayload) => inventoryService.createItem(payload, scope),
    onSuccess: () => {
      invalidateInventory(qc);
      toast.success("Inventory item created");
      done?.();
    },
  });
}

export function useUpdateInventoryItem(done?: () => void, scope: InventoryScope = "admin") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Partial<InventoryItemPayload> }) => inventoryService.updateItem(id, payload, scope),
    onSuccess: () => {
      invalidateInventory(qc);
      toast.success("Inventory item updated");
      done?.();
    },
  });
}

export function useDeleteInventoryItem(scope: InventoryScope = "admin") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => inventoryService.deleteItem(id, scope),
    onSuccess: () => {
      invalidateInventory(qc);
      toast.success("Inventory item deleted");
    },
  });
}

export function useInventoryTransactions(params: InventoryListParams & { type?: string; inventory_item_id?: string | number } = {}, scope: InventoryScope = "admin") {
  return useQuery({
    queryKey: queryKeys.inventory.transactions(params, scope),
    queryFn: () => inventoryService.transactions(params, scope),
  });
}

export function useAdjustInventoryItem(done?: () => void, scope: InventoryScope = "admin") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: StockAdjustmentPayload }) => inventoryService.adjustItem(id, payload, scope),
    onSuccess: () => {
      invalidateInventory(qc);
      toast.success("Stock adjusted");
      done?.();
    },
  });
}

export function useWasteInventoryItem(done?: () => void, scope: InventoryScope = "admin") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: WastePayload }) => inventoryService.wasteItem(id, payload, scope),
    onSuccess: () => {
      invalidateInventory(qc);
      toast.success("Waste / damage recorded");
      done?.();
    },
  });
}

export function useTransferInventoryItem(done?: () => void, scope: InventoryScope = "admin") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: TransferPayload }) => inventoryService.transferItem(id, payload, scope),
    onSuccess: () => {
      invalidateInventory(qc);
      toast.success("Stock transfer recorded");
      done?.();
    },
  });
}

export function useInventoryBatches(params: InventoryListParams & { inventory_item_id?: string | number } = {}, scope: InventoryScope = "stock-keeper") {
  return useQuery({
    queryKey: queryKeys.inventory.batches(params, scope),
    queryFn: () => inventoryService.batches(params, scope),
  });
}

export function useInventoryMenuItems(params: InventoryListParams & { type?: string; is_active?: boolean; is_available?: boolean } = {}, scope: InventoryScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.menuItems(params, scope),
    queryFn: () => inventoryService.menuItems(params, scope),
  });
}

export function useRecipes(params: InventoryListParams = {}, scope: InventoryScope = "food-controller") {
  return useQuery({
    queryKey: queryKeys.inventory.recipes(params, scope),
    queryFn: () => inventoryService.recipes(params, scope),
  });
}

export function useCreateRecipe(done?: () => void, scope: InventoryScope = "food-controller") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecipePayload) => inventoryService.createRecipe(payload, scope),
    onSuccess: () => {
      invalidateInventory(qc);
      toast.success("Recipe saved");
      done?.();
    },
  });
}

export function useUpdateRecipe(done?: () => void, scope: InventoryScope = "food-controller") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: RecipePayload }) => inventoryService.updateRecipe(id, payload, scope),
    onSuccess: () => {
      invalidateInventory(qc);
      toast.success("Recipe updated");
      done?.();
    },
  });
}

export function useLowStock(scope: InventoryScope = "food-controller") {
  return useQuery({ queryKey: queryKeys.inventory.lowStock(scope), queryFn: () => inventoryService.lowStock(scope) });
}

export function useStockValuation(scope: InventoryScope = "food-controller") {
  return useQuery({ queryKey: queryKeys.inventory.valuation(scope), queryFn: () => inventoryService.stockValuation(scope) });
}

export function useRecipeIntegrity(scope: InventoryScope = "food-controller") {
  return useQuery({ queryKey: queryKeys.inventory.recipeIntegrity(scope), queryFn: () => inventoryService.recipeIntegrity(scope) });
}

export function useStockStatusSummary(scope: InventoryScope = "food-controller") {
  return useQuery({ queryKey: queryKeys.inventory.summary(scope), queryFn: () => inventoryService.stockStatusSummary(scope) });
}
