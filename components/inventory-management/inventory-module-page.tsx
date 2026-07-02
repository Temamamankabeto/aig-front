import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  InventoryBatch,
  InventoryItem,
  InventoryItemPayload,
  InventoryListParams,
  InventoryTransaction,
  LowStockRow,
  PaginatedResponse,
  Recipe,
  RecipePayload,
  RecipeIntegrityRow,
  StockValuationRow,
} from "@/types/inventory-management";

/* ---------------------- helpers ---------------------- */

function cleanParams(params: unknown) {
  const out: Record<string, unknown> = {};
  if (!params || typeof params !== "object") return out;

  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v === undefined || v === null || v === "" || v === "all") continue;
    out[k] = v;
  }
  return out;
}

function extractRows<T>(body: any): T[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  return [];
}

function paginated<T>(res: any): PaginatedResponse<T> {
  const rows = extractRows<T>(res.data);
  return {
    data: rows,
    meta: res.data?.meta ?? {
      current_page: 1,
      per_page: rows.length,
      total: rows.length,
      last_page: 1,
    },
  };
}

/* ---------------------- role scope ---------------------- */

export type InventoryRoleScope =
  | "admin"
  | "food-controller"
  | "stock-keeper"
  | "purchaser";

function prefix(scope: InventoryRoleScope = "admin") {
  if (scope === "food-controller") return "/food-controller";
  if (scope === "stock-keeper") return "/stock-keeper";
  if (scope === "purchaser") return "/purchaser";
  return "/admin";
}

/* ---------------------- service ---------------------- */

export const inventoryService = {
  /* ITEMS */
  async items(params: InventoryListParams = {}, scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/inventory/items`, {
      params: cleanParams(params),
    });
    return paginated<InventoryItem>(res);
  },

  async createItem(payload: InventoryItemPayload, scope?: InventoryRoleScope) {
    const res = await api.post(`${prefix(scope)}/inventory/items`, payload);
    return unwrap<ApiEnvelope<InventoryItem>>(res);
  },

  /* TRANSACTIONS */
  async transactions(params: any = {}, scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/inventory/transactions`, {
      params: cleanParams(params),
    });
    return paginated<InventoryTransaction>(res);
  },

  /* BATCHES */
  async batches(params: any = {}, scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/inventory/batches`, {
      params: cleanParams(params),
    });
    return paginated<InventoryBatch>(res);
  },

  /* MENU */
  async menuItems(params: any = {}, scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/menu/items`, {
      params: cleanParams(params),
    });
    return paginated<any>(res);
  },

  /* RECIPES */
  async recipes(params: any = {}, scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/recipes`, {
      params: cleanParams(params),
    });
    return paginated<Recipe>(res);
  },

  async createRecipe(payload: RecipePayload, scope?: InventoryRoleScope) {
    const res = await api.post(`${prefix(scope)}/recipes`, payload);
    return unwrap<ApiEnvelope<Recipe>>(res);
  },

  /* STOCK ACTIONS */
  async adjustItem(
    itemId: string | number,
    payload: { quantity: number; reason: string },
    scope?: InventoryRoleScope,
  ) {
    const res = await api.post(
      `${prefix(scope)}/inventory/items/${itemId}/adjust`,
      payload,
    );
    return unwrap(res);
  },

  async wasteItem(
    itemId: string | number,
    payload: { quantity: number; reason: string },
    scope?: InventoryRoleScope,
  ) {
    const res = await api.post(
      `${prefix(scope)}/inventory/items/${itemId}/waste`,
      payload,
    );
    return unwrap(res);
  },

  /* REPORTS */
  async lowStock(scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/reports/low-stock`);
    return extractRows<LowStockRow>(res.data);
  },

  async stockValuation(scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/reports/stock-valuation`);
    return res.data as { total_value: number; rows: StockValuationRow[] };
  },

  async recipeIntegrity(scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/reports/recipe-integrity`);
    return res.data as { rows: RecipeIntegrityRow[] };
  },

  async reorderSuggestions(scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/reports/reorder-suggestions`);
    return extractRows<any>(res.data);
  },

  async expiredItems(scope?: InventoryRoleScope) {
    const res = await api.get(`${prefix(scope)}/reports/expired-items`);
    return extractRows<any>(res.data);
  },
};

export default inventoryService;