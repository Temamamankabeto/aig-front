// Compatibility barrel for inventory hooks used by inventory-pages.tsx
// Re-export wrappers matching expected naming convention

export {
  useInventoryItems as useInventoryItemsQuery,
  useInventoryTransactions as useInventoryTransactionsQuery,
  useInventoryBatches as useInventoryBatchesQuery,
  useRecipes as useRecipesQuery,
  useLowStock as useLowStockQuery,
  useStockValuation as useStockValuationQuery,
  useRecipeIntegrity as useRecipeIntegrityQuery,
  useStockStatusSummary as useStockStatusSummaryQuery,
  useInventoryMenuItems as useMenuItemsQuery,
} from "./useInventory";

export {
  useCreateInventoryItem as useCreateInventoryItemMutation,
  useUpdateInventoryItem as useUpdateInventoryItemMutation,
  useDeleteInventoryItem as useDeleteInventoryItemMutation,
  useAdjustInventoryItem as useAdjustStockMutation,
  useWasteInventoryItem as useRecordWasteMutation,
  useTransferInventoryItem as useTransferStockMutation,
  useCreateRecipe as useCreateRecipeMutation,
  useUpdateRecipe as useUpdateRecipeMutation,
} from "./useInventory";
