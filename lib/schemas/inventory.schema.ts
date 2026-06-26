import { z } from "zod";

export const baseUnitSchema = z.enum(["g", "ml", "pc"]);

export const inventoryItemSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  base_unit: baseUnitSchema,
  current_stock: z.coerce.number().min(0).optional(),
  minimum_quantity: z.coerce.number().min(0, "Minimum quantity is required"),
  average_purchase_price: z.coerce.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const stockQuantitySchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  note: z.string().optional(),
});

export const wasteSchema = stockQuantitySchema.extend({
  reason: z.string().optional(),
});

export const receiveStockSchema = z.object({
  inventory_item_id: z.coerce.number().positive(),
  quantity: z.coerce.number().positive(),
  unit_cost: z.coerce.number().min(0).optional(),
  expiry_date: z.string().optional(),
  batch_no: z.string().optional(),
});

export const recipeSchema = z.object({
  menu_item_id: z.coerce.number().positive("Menu item is required"),
  items: z.array(z.object({
    inventory_item_id: z.coerce.number().positive(),
    quantity: z.coerce.number().positive(),
  })).min(1, "Add at least one ingredient"),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;
export type StockQuantityFormValues = z.infer<typeof stockQuantitySchema>;
export type WasteFormValues = z.infer<typeof wasteSchema>;
export type ReceiveStockFormValues = z.infer<typeof receiveStockSchema>;
export type RecipeFormValues = z.infer<typeof recipeSchema>;
