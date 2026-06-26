"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, ClipboardCheck, PackagePlus, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import inventoryService, { type InventoryRoleScope } from "@/services/inventory-management/inventory.service";
import { authService } from "@/services/auth/auth.service";
import { normalizeRole } from "@/config/dashboard.config";
import type { InventoryItemPayload, RecipePayload } from "@/types/inventory-management";

type ViewKey =
  | "overview"
  | "items"
  | "movements"
  | "valuation"
  | "low-stock"
  | "recipe-integrity"
  | "recipes"
  | "adjustments"
  | "waste"
  | "batches"
  | "reorder-suggestions"
  | "expired-items";

type Props = { view: ViewKey };

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roleScope(): InventoryRoleScope {
  const roles = authService.getStoredRoles();
  const user = authService.getStoredUser();
  const role = normalizeRole(roles[0] ?? user?.role ?? "cafeteria-manager");
  if (role === "fb-controller") return "food-controller";
  if (role === "stock-keeper") return "stock-keeper";
  if (role === "purchaser") return "purchaser";
  return "admin";
}

function canManageInventory(scope: InventoryRoleScope) {
  return scope === "admin" || scope === "food-controller";
}

function canAdjustStock(scope: InventoryRoleScope) {
  return scope === "admin" || scope === "food-controller" || scope === "stock-keeper";
}

function SimpleTable({ headers, rows, empty = "No data found." }: { headers: string[]; rows: Array<Array<React.ReactNode>>; empty?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {rows.length ? rows.map((row, index) => (
              <tr key={index} className="hover:bg-muted/30">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top">{cell}</td>)}</tr>
            )) : (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={headers.length}>{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ItemForm({ scope }: { scope: InventoryRoleScope }) {
  const queryClient = useQueryClient();
  const [payload, setPayload] = useState<InventoryItemPayload>({ name: "", base_unit: "g", current_stock: 0, minimum_quantity: 0, average_purchase_price: 0, is_active: true });
  const mutation = useMutation({
    mutationFn: () => inventoryService.createItem(payload, scope),
    onSuccess: () => {
      setPayload({ name: "", base_unit: "g", current_stock: 0, minimum_quantity: 0, average_purchase_price: 0, is_active: true });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Create inventory item</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-6">
          <Input className="md:col-span-2" placeholder="Item name" value={payload.name} onChange={(event) => setPayload((p) => ({ ...p, name: event.target.value }))} required />
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={payload.base_unit} onChange={(event) => setPayload((p) => ({ ...p, base_unit: event.target.value as InventoryItemPayload["base_unit"] }))}>
            <option value="g">g</option><option value="ml">ml</option><option value="pc">pc</option>
          </select>
          <Input type="number" step="0.01" placeholder="Opening stock" value={payload.current_stock ?? 0} onChange={(event) => setPayload((p) => ({ ...p, current_stock: Number(event.target.value) }))} />
          <Input type="number" step="0.01" placeholder="Minimum" value={payload.minimum_quantity} onChange={(event) => setPayload((p) => ({ ...p, minimum_quantity: Number(event.target.value) }))} />
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save item"}</Button>
          {mutation.error && <p className="md:col-span-6 text-sm text-destructive">{mutation.error.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function AdjustmentForm({ scope, mode }: { scope: InventoryRoleScope; mode: "adjust" | "waste" }) {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const items = useQuery({ queryKey: ["inventory", "items", scope, "for-adjustment"], queryFn: () => inventoryService.items({ per_page: 100 }, scope) });
  const mutation = useMutation({
    mutationFn: () => mode === "adjust" ? inventoryService.adjustItem(itemId, { quantity, reason }, scope) : inventoryService.wasteItem(itemId, { quantity, reason }, scope),
    onSuccess: () => {
      setItemId(""); setQuantity(0); setReason("");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{mode === "adjust" ? "Record adjustment" : "Record waste / damage"}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-5">
          <select className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" value={itemId} onChange={(event) => setItemId(event.target.value)} required>
            <option value="">Select inventory item</option>
            {items.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <Input type="number" step="0.01" placeholder="Quantity" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />
          <Input placeholder="Reason / note" value={reason} onChange={(event) => setReason(event.target.value)} required />
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save"}</Button>
          {mutation.error && <p className="md:col-span-5 text-sm text-destructive">{mutation.error.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function RecipeForm({ scope }: { scope: InventoryRoleScope }) {
  const queryClient = useQueryClient();
  const [menuItemId, setMenuItemId] = useState("");
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const items = useQuery({ queryKey: ["inventory", "items", scope, "recipe-options"], queryFn: () => inventoryService.items({ per_page: 100 }, scope) });
  const menuItems = useQuery({ queryKey: ["inventory", "menu-items", scope], queryFn: () => inventoryService.menuItems({ per_page: 100 }, scope) });
  const mutation = useMutation({
    mutationFn: () => inventoryService.createRecipe({ menu_item_id: Number(menuItemId), items: [{ inventory_item_id: Number(inventoryItemId), quantity }] } as RecipePayload, scope),
    onSuccess: () => {
      setMenuItemId(""); setInventoryItemId(""); setQuantity(0);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Create / link recipe</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-5">
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={menuItemId} onChange={(event) => setMenuItemId(event.target.value)} required>
            <option value="">Food menu item</option>
            {menuItems.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={inventoryItemId} onChange={(event) => setInventoryItemId(event.target.value)} required>
            <option value="">Ingredient</option>
            {items.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <Input type="number" step="0.01" placeholder="Qty per serving" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save recipe"}</Button>
          <p className="text-xs text-muted-foreground">For packaged drinks, edit the menu item and set direct inventory link fields from Menu Management.</p>
          {mutation.error && <p className="md:col-span-5 text-sm text-destructive">{mutation.error.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export default function InventoryModulePage({ view }: Props) {
  const [search, setSearch] = useState("");
  const scope = useMemo(() => roleScope(), []);
  const title = view.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");

  const items = useQuery({ queryKey: ["inventory", "items", scope, search], queryFn: () => inventoryService.items({ search, per_page: 50 }, scope), enabled: ["overview", "items", "adjustments", "waste"].includes(view) });
  const movements = useQuery({ queryKey: ["inventory", "movements", scope], queryFn: () => inventoryService.transactions({ per_page: 50 }, scope), enabled: ["overview", "movements"].includes(view) });
  const valuation = useQuery({ queryKey: ["inventory", "valuation", scope], queryFn: () => inventoryService.stockValuation(scope), enabled: ["overview", "valuation"].includes(view) });
  const lowStock = useQuery({ queryKey: ["inventory", "low-stock", scope], queryFn: () => inventoryService.lowStock(scope), enabled: ["overview", "low-stock"].includes(view) });
  const integrity = useQuery({ queryKey: ["inventory", "recipe-integrity", scope], queryFn: () => inventoryService.recipeIntegrity(scope), enabled: ["overview", "recipe-integrity"].includes(view) });
  const recipes = useQuery({ queryKey: ["inventory", "recipes", scope], queryFn: () => inventoryService.recipes({ per_page: 50 }, scope), enabled: view === "recipes" });
  const batches = useQuery({ queryKey: ["inventory", "batches", scope], queryFn: () => inventoryService.batches({ per_page: 50 }, scope), enabled: view === "batches" });
  const reorder = useQuery({ queryKey: ["inventory", "reorder", scope], queryFn: () => inventoryService.reorderSuggestions(scope), enabled: view === "reorder-suggestions" });
  const expired = useQuery({ queryKey: ["inventory", "expired", scope], queryFn: () => inventoryService.expiredItems(scope), enabled: view === "expired-items" });

  const loading = items.isLoading || movements.isLoading || valuation.isLoading || lowStock.isLoading || integrity.isLoading || recipes.isLoading || batches.isLoading || reorder.isLoading || expired.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Inventory Management</p>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <Badge variant="secondary" className="w-fit">Scope: {scope}</Badge>
      </div>

      {view === "overview" && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-5"><Boxes className="mb-3 h-5 w-5" /><p className="text-sm text-muted-foreground">Inventory items</p><p className="text-2xl font-bold">{items.data?.meta.total ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-5"><Trash2 className="mb-3 h-5 w-5" /><p className="text-sm text-muted-foreground">Low stock</p><p className="text-2xl font-bold">{lowStock.data?.length ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-5"><ClipboardCheck className="mb-3 h-5 w-5" /><p className="text-sm text-muted-foreground">Integrity issues</p><p className="text-2xl font-bold">{integrity.data?.rows.length ?? 0}</p></CardContent></Card>
          <Card><CardContent className="p-5"><PackagePlus className="mb-3 h-5 w-5" /><p className="text-sm text-muted-foreground">Stock value</p><p className="text-2xl font-bold">{money(valuation.data?.total_value)}</p></CardContent></Card>
        </div>
      )}

      {view === "items" && canManageInventory(scope) && <ItemForm scope={scope} />}
      {view === "adjustments" && canAdjustStock(scope) && <AdjustmentForm scope={scope} mode="adjust" />}
      {view === "waste" && canAdjustStock(scope) && <AdjustmentForm scope={scope} mode="waste" />}
      {view === "recipes" && canManageInventory(scope) && <RecipeForm scope={scope} />}

      {view === "items" && (
        <div className="flex max-w-md items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" /><Input placeholder="Search inventory items" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      )}

      {loading && <Card><CardContent className="flex items-center gap-2 p-6 text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" /> Loading inventory data...</CardContent></Card>}

      {(view === "items" || view === "overview") && <SimpleTable headers={["Item", "Unit", "Stock", "Minimum", "Avg cost", "Status"]} rows={(items.data?.data ?? []).map((item) => [item.name, item.base_unit ?? item.unit, item.current_stock, item.minimum_quantity ?? item.reorder_level, money(item.average_purchase_price), item.is_active === false ? <Badge variant="secondary">Inactive</Badge> : <Badge>Active</Badge>])} />}
      {view === "movements" && <SimpleTable headers={["Item", "Type", "Quantity", "Unit cost", "Reason", "Date"]} rows={(movements.data?.data ?? []).map((row) => [row.inventory_item?.name ?? row.inventoryItem?.name ?? row.inventory_item_id, row.type ?? row.transaction_type, row.quantity, money(row.unit_cost), row.reason ?? row.note ?? "-", row.created_at ? new Date(row.created_at).toLocaleString() : "-"])} />}
      {view === "valuation" && <SimpleTable headers={["Item", "Stock", "Avg cost", "Value"]} rows={(valuation.data?.rows ?? []).map((row) => [row.name, row.current_stock, money(row.average_purchase_price), money(row.stock_value ?? row.value)])} />}
      {view === "low-stock" && <SimpleTable headers={["Item", "Stock", "Minimum", "Shortage"]} rows={(lowStock.data ?? []).map((row) => [row.name, row.current_stock, row.minimum_quantity ?? row.reorder_level, row.shortage ?? Math.max(0, Number(row.minimum_quantity ?? row.reorder_level ?? 0) - Number(row.current_stock ?? 0))])} />}
      {view === "recipe-integrity" && <SimpleTable headers={["Menu item", "Type", "Recipe", "Ingredients", "Issue"]} rows={(integrity.data?.rows ?? []).map((row) => [row.menu_item_name ?? row.name ?? row.menu_item_id ?? "-", row.menu_item_type ?? "-", row.recipe_id ? "Linked" : "Missing", row.ingredient_count ?? 0, row.issue ?? row.status ?? (row.missing_items?.join(", ") || "-")])} />}
      {view === "recipes" && <SimpleTable headers={["Menu item", "Recipe", "Ingredients"]} rows={(recipes.data?.data ?? []).map((row) => [row.menu_item?.name ?? row.menu_item_id, row.name ?? `Recipe #${row.id}`, row.recipe_items?.length ?? row.items?.length ?? 0])} />}
      {view === "batches" && <SimpleTable headers={["Item", "Batch", "Initial", "Remaining", "Cost", "Expiry", "Status"]} rows={(batches.data?.data ?? []).map((row) => [row.inventory_item?.name ?? row.inventoryItem?.name ?? row.inventory_item_id, row.batch_no ?? row.id, row.initial_qty, row.remaining_qty, money(row.purchase_price), row.expiry_date ?? "-", row.status ?? "-"])} />}
      {view === "reorder-suggestions" && <SimpleTable headers={["Item", "Stock", "Minimum", "Suggested qty"]} rows={(reorder.data ?? []).map((row: any) => [row.name ?? row.item_name ?? row.inventory_item?.name ?? "-", row.current_stock ?? row.stock ?? "-", row.minimum_quantity ?? row.reorder_level ?? "-", row.suggested_quantity ?? row.suggested_qty ?? row.shortage ?? "-"])} />}
      {view === "expired-items" && <SimpleTable headers={["Item", "Batch", "Remaining", "Expiry", "Status"]} rows={(expired.data ?? []).map((row: any) => [row.inventory_item?.name ?? row.inventoryItem?.name ?? row.name ?? "-", row.batch_no ?? row.id ?? "-", row.remaining_qty ?? row.quantity ?? "-", row.expiry_date ?? "-", row.status ?? "expired"])} />}
    </div>
  );
}
