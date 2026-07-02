import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  InventoryBatch,
  InventoryItem,
  InventoryItemPayload,
  InventoryListParams,
  MenuItemOption,
  InventoryTransaction,
  LowStockRow,
  PaginatedResponse,
  Recipe,
  RecipeIntegrityRow,
  RecipePayload,
  StockAdjustmentPayload,
  StockValuationRow,
  TransferPayload,
  WastePayload,
} from "@/types/inventory-management";

/**
 * Clean query params safely for Axios
 */
function cleanParams<T extends object>(params: T) {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    ) {
      continue;
    }

    output[key] = value;
  }

  return output;
}

/**
 * Role scope
 */
export type InventoryRoleScope =
  | "admin"
  | "food-controller"
  | "stock-keeper"
  | "purchaser";

function rolePrefix(roleScope: InventoryRoleScope = "admin") {
  if (roleScope === "food-controller") return "/food-controller";
  if (roleScope === "stock-keeper") return "/stock-keeper";
  if (roleScope === "purchaser") return "/purchaser";
  return "/admin";
}

/**
 * Generic pagination wrapper
 */
function paginated<T>(body: unknown): PaginatedResponse<T> {
  const source = body as { success?: boolean; message?: string };

  const data =
    (body as any)?.data?.data ??
    (body as any)?.data ??
    body ??
    [];

  const rows: T[] = Array.isArray(data) ? data : [];

  const meta =
    (body as any)?.data?.meta ?? (body as any)?.meta ?? {};

  return {
    success: source?.success,
    message: source?.message,
    data: rows,
    meta: {
      current_page: Number(meta.current_page ?? 1),
      per_page: Number(meta.per_page ?? rows.length ?? 10),
      total: Number(meta.total ?? rows.length ?? 0),
      last_page: Number(meta.last_page ?? 1),
    },
  };
}

/**
 * Extract list fallback
 */
function extractListFromKeys<T>(body: unknown, keys: string[]): T[] {
  const root = body as any;

  const candidates = [root?.data, root];

  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;

    for (const key of keys) {
      if (Array.isArray(c[key])) return c[key] as T[];
    }
  }

  return [];
}

/**
 * Service
 */
export const inventoryService = {
  // ---------------- ITEMS ----------------
  async items(
    params: InventoryListParams = {},
    roleScope: InventoryRoleScope = "admin"
  ) {
    const response = await api.get(
      `${rolePrefix(roleScope)}/inventory/items`,
      { params: cleanParams(params) }
    );
    return paginated<InventoryItem>(response.data);
  },

  async trashedItems(
    params: InventoryListParams = {},
    roleScope: InventoryRoleScope = "food-controller"
  ) {
    const response = await api.get(
      `${rolePrefix(roleScope)}/inventory/items/trashed`,
      { params: cleanParams(params) }
    );
    return paginated<InventoryItem>(response.data);
  },

  async item(id: number | string, roleScope: InventoryRoleScope = "admin") {
    const response = await api.get(
      `${rolePrefix(roleScope)}/inventory/items/${id}`
    );
    return unwrap<ApiEnvelope<InventoryItem>>(response).data;
  },

  async createItem(payload: InventoryItemPayload, roleScope: InventoryRoleScope = "admin") {
    const response = await api.post(
      `${rolePrefix(roleScope)}/inventory/items`,
      payload
    );
    return unwrap<ApiEnvelope<InventoryItem>>(response);
  },

  async updateItem(
    id: number | string,
    payload: Partial<InventoryItemPayload>,
    roleScope: InventoryRoleScope = "admin"
  ) {
    const response = await api.put(
      `${rolePrefix(roleScope)}/inventory/items/${id}`,
      payload
    );
    return unwrap<ApiEnvelope<InventoryItem>>(response);
  },

  async deleteItem(id: number | string, roleScope: InventoryRoleScope = "admin") {
    const response = await api.delete(
      `${rolePrefix(roleScope)}/inventory/items/${id}`
    );
    return unwrap<ApiEnvelope<null>>(response);
  },

  async restoreItem(id: number | string, roleScope: InventoryRoleScope = "food-controller") {
    const response = await api.post(
      `${rolePrefix(roleScope)}/inventory/items/${id}/restore`
    );
    return unwrap<ApiEnvelope<InventoryItem>>(response);
  },

  async forceDeleteItem(id: number | string, roleScope: InventoryRoleScope = "food-controller") {
    const response = await api.delete(
      `${rolePrefix(roleScope)}/inventory/items/${id}/force`
    );
    return unwrap<ApiEnvelope<null>>(response);
  },

  // ---------------- TRANSACTIONS ----------------
  async transactions(
    params: InventoryListParams & {
      type?: string;
      inventory_item_id?: number | string;
    } = {},
    roleScope: InventoryRoleScope = "admin"
  ) {
    const response = await api.get(
      `${rolePrefix(roleScope)}/inventory/transactions`,
      { params: cleanParams(params) }
    );
    return paginated<InventoryTransaction>(response.data);
  },

  // ---------------- BATCHES ----------------
  async batches(
    params: InventoryListParams & {
      inventory_item_id?: number | string;
    } = {},
    roleScope: InventoryRoleScope = "admin"
  ) {
    const response = await api.get(
      `${rolePrefix(roleScope)}/inventory/batches`,
      { params: cleanParams(params) }
    );
    return paginated<InventoryBatch>(response.data);
  },

  // ---------------- MENU ----------------
  async menuItems(
    params: InventoryListParams & {
      type?: string;
      is_active?: boolean;
      is_available?: boolean;
    } = {},
    roleScope: InventoryRoleScope = "admin"
  ) {
    const response = await api.get(
      `${rolePrefix(roleScope)}/menu/items`,
      { params: cleanParams(params) }
    );
    return paginated<MenuItemOption>(response.data);
  },

  // ---------------- RECIPES ----------------
  async recipes(
    params: InventoryListParams = {},
    roleScope: InventoryRoleScope = "admin"
  ) {
    const response = await api.get(
      `${rolePrefix(roleScope)}/recipes`,
      { params: cleanParams(params) }
    );
    return paginated<Recipe>(response.data);
  },

  async recipeIntegrity(roleScope: InventoryRoleScope = "food-controller") {
    const response = await api.get(
      `${rolePrefix(roleScope)}/reports/recipe-integrity`
    );

    return {
      rows: extractListFromKeys<RecipeIntegrityRow>(response.data, [
        "recipes",
        "rows",
      ]),
      summary: response.data?.data?.summary ?? {},
    };
  },

  async stockValuation(roleScope: InventoryRoleScope = "food-controller") {
    const response = await api.get(
      `${rolePrefix(roleScope)}/reports/stock-valuation`
    );

    const data = response.data?.data ?? response.data;

    return {
      rows: data?.items ?? [],
      total_value: data?.total_value ?? 0,
    };
  },

  async lowStock(roleScope: InventoryRoleScope = "food-controller") {
    const response = await api.get(
      `${rolePrefix(roleScope)}/reports/low-stock`
    );

    return extractListFromKeys<LowStockRow>(response.data, [
      "items",
      "low_stock",
      "rows",
    ]);
  },
async createRecipe(payload: RecipePayload, roleScope: InventoryRoleScope = "admin") {
  const response = await api.post(
    `${rolePrefix(roleScope)}/recipes`,
    payload
  );
  return unwrap<ApiEnvelope<any>>(response);
},

async adjustItem(
  id: number | string,
  payload: StockAdjustmentPayload,
  roleScope: InventoryRoleScope = "admin"
) {
  const response = await api.post(
    `${rolePrefix(roleScope)}/inventory/items/${id}/adjust`,
    payload
  );
  return unwrap<ApiEnvelope<any>>(response);
},

async wasteItem(
  id: number | string,
  payload: WastePayload,
  roleScope: InventoryRoleScope = "admin"
) {
  const response = await api.post(
    `${rolePrefix(roleScope)}/inventory/items/${id}/waste`,
    {
      ...payload,
      reason: payload.reason ?? "",
    }
  );

  return unwrap<ApiEnvelope<any>>(response);
},
async updateRecipe(
  id: number | string,
  payload: RecipePayload,
  roleScope: InventoryRoleScope = "admin"
) {
  const response = await api.put(
    `${rolePrefix(roleScope)}/recipes/${id}`,
    payload
  );

  return unwrap<ApiEnvelope<any>>(response);
},
async deleteRecipe(
  id: number | string,
  roleScope: InventoryRoleScope = "admin"
) {
  const response = await api.delete(
    `${rolePrefix(roleScope)}/recipes/${id}`
  );

  return unwrap<ApiEnvelope<any>>(response);
},
async stockStatusSummary(
  roleScope: InventoryRoleScope = "food-controller"
) {
  const response = await api.get(
    `${rolePrefix(roleScope)}/reports/stock-status-summary`
  );

  return response.data?.data ?? response.data;
},
async transferItem(
  id: number | string,
  payload: TransferPayload,
  roleScope: InventoryRoleScope = "admin"
) {
  const response = await api.post(
    `${rolePrefix(roleScope)}/inventory/items/${id}/transfer`,
    {
      ...payload,
      reason: payload.reason ?? "",
    }
  );

  return unwrap<ApiEnvelope<any>>(response);
},
  async reorderSuggestions(roleScope: InventoryRoleScope = "food-controller") {
    const response = await api.get(
      `${rolePrefix(roleScope)}/reports/reorder-suggestions`
    );

    return extractListFromKeys<any>(response.data, [
      "items",
      "suggestions",
      "rows",
      "data",
    ]);
  },

  async expiredItems(roleScope: InventoryRoleScope = "food-controller") {
    const response = await api.get(
      `${rolePrefix(roleScope)}/reports/expired-items`
    );

    return extractListFromKeys<any>(response.data, [
      "items",
      "expired_items",
      "batches",
      "rows",
      "data",
    ]);
  },
};



export default inventoryService;