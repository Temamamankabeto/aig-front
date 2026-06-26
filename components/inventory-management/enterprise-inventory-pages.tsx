"use client";

import { DragEvent, FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Boxes, GripVertical, Link2, PackageSearch, ShoppingCart, Sparkles, TrendingUp, Wine } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { formatBaseQuantity, formatMoney } from "@/lib/inventory-management";
import { authService } from "@/services/auth/auth.service";
import { normalizeRole } from "@/config/dashboard.config";
import inventoryService, { type InventoryRoleScope } from "@/services/inventory-management/inventory.service";
import type { InventoryBatch, InventoryItem, InventoryTransaction, MenuItemOption, RecipeIngredient } from "@/types/inventory-management";

type EnterpriseView = "drink-links" | "recipe-dnd" | "valuation-methods" | "expiry-alerts" | "purchase-suggestions" | "forecast";

type EnterpriseProps = { view: EnterpriseView };

type IngredientDraft = RecipeIngredient & { label: string; order: number };

function scopeFromRole(): InventoryRoleScope {
  const roles = authService.getStoredRoles();
  const user = authService.getStoredUser();
  const roleKey = normalizeRole(roles[0] ?? user?.role ?? "cafeteria-manager");
  if (roleKey === "fb-controller") return "food-controller";
  if (roleKey === "stock-keeper") return "stock-keeper";
  if (roleKey === "purchaser") return "purchaser";
  return "admin";
}

function itemUnit(item?: Pick<InventoryItem, "base_unit" | "unit"> | null) {
  return item?.base_unit ?? item?.unit ?? "pc";
}

function itemName(item?: Pick<InventoryItem, "name" | "sku"> | null) {
  if (!item) return "—";
  return item.sku ? `${item.name} (${item.sku})` : item.name;
}

function titleCase(value: string) {
  return value.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function Header({ title, description, icon: Icon }: { title: string; description: string; icon: typeof Boxes }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="secondary" className="w-fit">Enterprise inventory</Badge>
    </div>
  );
}

function Empty({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed p-8 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>;
}

function useInventoryScope() {
  return useMemo(() => scopeFromRole(), []);
}

function useInventoryItems(scope: InventoryRoleScope) {
  return useQuery({ queryKey: ["inventory", "enterprise", "items", scope], queryFn: () => inventoryService.items({ per_page: 200 }, scope) });
}

function useDrinkMenuItems(scope: InventoryRoleScope) {
  return useQuery({ queryKey: ["inventory", "enterprise", "drink-menu", scope], queryFn: () => inventoryService.menuItems({ per_page: 200, type: "drink", is_active: true }, scope) });
}

function useFoodMenuItems(scope: InventoryRoleScope) {
  return useQuery({ queryKey: ["inventory", "enterprise", "food-menu", scope], queryFn: () => inventoryService.menuItems({ per_page: 200, type: "food", is_active: true }, scope) });
}

function useBatches(scope: InventoryRoleScope) {
  return useQuery({ queryKey: ["inventory", "enterprise", "batches", scope], queryFn: () => inventoryService.batches({ per_page: 200 }, scope) });
}

function useMovements(scope: InventoryRoleScope) {
  return useQuery({ queryKey: ["inventory", "enterprise", "movements", scope], queryFn: () => inventoryService.transactions({ per_page: 300 }, scope) });
}

function DrinkAutoLinkPage({ scope }: { scope: InventoryRoleScope }) {
  const qc = useQueryClient();
  const drinks = useDrinkMenuItems(scope);
  const items = useInventoryItems(scope);
  const [menuItemId, setMenuItemId] = useState("");
  const [inventoryItemId, setInventoryItemId] = useState("");
  const selectedDrink = drinks.data?.data.find((row) => String(row.id) === menuItemId);
  const selectedInventory = items.data?.data.find((row) => String(row.id) === inventoryItemId);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        direct_inventory_item_id: Number(inventoryItemId),
        inventory_item_id: Number(inventoryItemId),
        inventory_tracking_mode: "direct",
        stock_deduction_mode: "direct",
        has_ingredients: false,
      };
      const response = await api.patch(`/${scope}/menu/items/${menuItemId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Packaged drink linked to inventory item");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setMenuItemId("");
      setInventoryItemId("");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to link drink"),
  });

  return (
    <div className="space-y-6">
      <Header title="Packaged Drink Inventory Auto-Link" description="Connect bottled or packaged drinks directly to one inventory item so stock deducts without a recipe." icon={Wine} />
      <div className="grid gap-4 lg:grid-cols-[430px_1fr]">
        <Card>
          <CardHeader><CardTitle>Auto-link drink</CardTitle><CardDescription>Use this for water, soda, juice, beer-free bottled drinks, and counted packaged items.</CardDescription></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
              <div className="space-y-2"><Label>Drink menu item</Label><Select value={menuItemId} onValueChange={setMenuItemId}><SelectTrigger><SelectValue placeholder="Select packaged drink" /></SelectTrigger><SelectContent>{(drinks.data?.data ?? []).map((drink) => <SelectItem key={drink.id} value={String(drink.id)}>{drink.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Direct inventory item</Label><Select value={inventoryItemId} onValueChange={setInventoryItemId}><SelectTrigger><SelectValue placeholder="Select stock item" /></SelectTrigger><SelectContent>{(items.data?.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{itemName(item)}</SelectItem>)}</SelectContent></Select></div>
              {selectedDrink && selectedInventory && <div className="rounded-xl bg-muted p-4 text-sm"><p><strong>{selectedDrink.name}</strong> will deduct from <strong>{selectedInventory.name}</strong>.</p><p className="mt-1 text-muted-foreground">Current stock: {formatBaseQuantity(selectedInventory.current_stock, itemUnit(selectedInventory))}</p></div>}
              <Button disabled={!menuItemId || !inventoryItemId || mutation.isPending} type="submit"><Link2 className="mr-2 h-4 w-4" />Link drink</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Packaged drinks</CardTitle><CardDescription>Available active drink menu items from Menu Management.</CardDescription></CardHeader>
          <CardContent>
            {(drinks.data?.data ?? []).length ? <Table><TableHeader><TableRow><TableHead>Drink</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{(drinks.data?.data ?? []).map((drink) => <TableRow key={drink.id}><TableCell>{drink.name}</TableCell><TableCell>{drink.category_name ?? drink.category?.name ?? "—"}</TableCell><TableCell>{formatMoney(drink.price)} ETB</TableCell><TableCell><Badge variant="secondary">Ready to link</Badge></TableCell></TableRow>)}</TableBody></Table> : <Empty title="No drink menu items" description="Create active drink items in Menu Management first." />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecipeDragDropPage({ scope }: { scope: InventoryRoleScope }) {
  const qc = useQueryClient();
  const menuItems = useFoodMenuItems(scope);
  const items = useInventoryItems(scope);
  const [menuItemId, setMenuItemId] = useState("");
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const selectedItem = items.data?.data.find((row) => String(row.id) === inventoryItemId);

  const save = useMutation({
    mutationFn: () => inventoryService.createRecipe({ menu_item_id: Number(menuItemId), items: ingredients.map((row) => ({ inventory_item_id: row.inventory_item_id, quantity: row.quantity })) }, scope),
    onSuccess: () => {
      toast.success("Recipe saved");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setMenuItemId("");
      setIngredients([]);
    },
    onError: (error: Error) => toast.error(error.message || "Unable to save recipe"),
  });

  function addIngredient() {
    if (!selectedItem || !quantity) return;
    setIngredients((current) => [...current, { inventory_item_id: selectedItem.id, quantity: Number(quantity), unit: itemUnit(selectedItem), base_unit: itemUnit(selectedItem), inventory_item: selectedItem, label: itemName(selectedItem), order: current.length + 1 }]);
    setInventoryItemId("");
    setQuantity("");
  }

  function drop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setIngredients((current) => {
      const next = [...current];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((row, index) => ({ ...row, order: index + 1 }));
    });
    setDragIndex(null);
  }

  return (
    <div className="space-y-6">
      <Header title="Recipe Ingredient Drag-Drop Editor" description="Create recipe ingredients, then drag rows to organize preparation/deduction order before saving." icon={GripVertical} />
      <div className="grid gap-4 lg:grid-cols-[430px_1fr]">
        <Card>
          <CardHeader><CardTitle>Recipe setup</CardTitle><CardDescription>Food menu items use recipe-based inventory deduction.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Food menu item</Label><Select value={menuItemId} onValueChange={setMenuItemId}><SelectTrigger><SelectValue placeholder="Select food item" /></SelectTrigger><SelectContent>{(menuItems.data?.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Ingredient</Label><Select value={inventoryItemId} onValueChange={setInventoryItemId}><SelectTrigger><SelectValue placeholder="Select ingredient" /></SelectTrigger><SelectContent>{(items.data?.data ?? []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{itemName(item)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-[1fr_auto] gap-2"><Input type="number" step="0.001" placeholder={selectedItem ? `Quantity in ${itemUnit(selectedItem)}` : "Quantity"} value={quantity} onChange={(event) => setQuantity(event.target.value)} /><Button type="button" onClick={addIngredient}>Add</Button></div>
            <Button className="w-full" disabled={!menuItemId || !ingredients.length || save.isPending} onClick={() => save.mutate()}>Save recipe</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ingredient order</CardTitle><CardDescription>Drag an ingredient row and drop it above another row.</CardDescription></CardHeader>
          <CardContent>
            {ingredients.length ? <div className="space-y-2">{ingredients.map((ingredient, index) => <div key={`${ingredient.inventory_item_id}-${index}`} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()} onDrop={() => drop(index)} className="flex items-center gap-3 rounded-xl border bg-background p-3 shadow-sm"><GripVertical className="h-4 w-4 text-muted-foreground" /><Badge variant="outline">{ingredient.order}</Badge><div className="min-w-0 flex-1"><p className="truncate font-medium">{ingredient.label}</p><p className="text-xs text-muted-foreground">{formatBaseQuantity(ingredient.quantity, ingredient.base_unit ?? ingredient.unit ?? "pc")}</p></div><Button variant="ghost" size="sm" onClick={() => setIngredients((current) => current.filter((_, i) => i !== index).map((row, i) => ({ ...row, order: i + 1 })))}>Remove</Button></div>)}</div> : <Empty title="No ingredients yet" description="Add ingredients on the left, then drag them to reorder." />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ValuationMethodsPage({ scope }: { scope: InventoryRoleScope }) {
  const batches = useBatches(scope);
  const [method, setMethod] = useState<"average" | "fifo" | "lifo">("fifo");
  const rows = useMemo(() => {
    const groups = new Map<string, { name: string; unit: string; batches: InventoryBatch[] }>();
    for (const batch of batches.data?.data ?? []) {
      const item = batch.inventory_item ?? batch.inventoryItem;
      const key = String(batch.inventory_item_id ?? item?.id ?? batch.id);
      const current = groups.get(key) ?? { name: itemName(item), unit: itemUnit(item), batches: [] };
      current.batches.push(batch);
      groups.set(key, current);
    }
    return Array.from(groups.values()).map((group) => {
      const sorted = [...group.batches].sort((a, b) => String(a.received_at ?? a.id).localeCompare(String(b.received_at ?? b.id)));
      const ordered = method === "lifo" ? sorted.reverse() : sorted;
      const qty = group.batches.reduce((sum, row) => sum + Number(row.remaining_qty ?? 0), 0);
      const value = method === "average"
        ? qty * (group.batches.reduce((sum, row) => sum + Number(row.purchase_price ?? 0), 0) / Math.max(group.batches.length, 1))
        : ordered.reduce((sum, row) => sum + Number(row.remaining_qty ?? 0) * Number(row.purchase_price ?? 0), 0);
      return { ...group, qty, value };
    });
  }, [batches.data, method]);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <div className="space-y-6">
      <Header title="FIFO / LIFO Valuation Toggle" description="Compare inventory value using average cost, FIFO, or LIFO based on received batches." icon={BarChart3} />
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card><CardHeader><CardTitle>Valuation method</CardTitle><CardDescription>Select costing method.</CardDescription></CardHeader><CardContent className="space-y-3"><Select value={method} onValueChange={(value) => setMethod(value as typeof method)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fifo">FIFO</SelectItem><SelectItem value="lifo">LIFO</SelectItem><SelectItem value="average">Average cost</SelectItem></SelectContent></Select><div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">Total value</p><p className="text-2xl font-bold">{formatMoney(total)} ETB</p></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Batch valuation</CardTitle><CardDescription>Client-side calculation from current batch remaining quantities.</CardDescription></CardHeader><CardContent>{rows.length ? <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Remaining</TableHead><TableHead>Batches</TableHead><TableHead>Value</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.name}><TableCell>{row.name}</TableCell><TableCell>{formatBaseQuantity(row.qty, row.unit)}</TableCell><TableCell>{row.batches.length}</TableCell><TableCell>{formatMoney(row.value)} ETB</TableCell></TableRow>)}</TableBody></Table> : <Empty title="No batches" description="Receive stock first to calculate FIFO/LIFO valuation." />}</CardContent></Card>
      </div>
    </div>
  );
}

function ExpiryAlertsPage({ scope }: { scope: InventoryRoleScope }) {
  const batches = useBatches(scope);
  const today = new Date();
  const rows = (batches.data?.data ?? []).filter((batch) => batch.expiry_date).map((batch) => {
    const expiry = new Date(batch.expiry_date as string);
    const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
    return { batch, days };
  }).sort((a, b) => a.days - b.days);

  return (
    <div className="space-y-6">
      <Header title="Batch Expiry Alerts" description="Prioritize soon-expiring and expired batches for kitchen/F&B review." icon={AlertTriangle} />
      <div className="grid gap-4 md:grid-cols-3"><Metric title="Expired" value={rows.filter((row) => row.days < 0).length} /><Metric title="Expiring in 7 days" value={rows.filter((row) => row.days >= 0 && row.days <= 7).length} /><Metric title="Expiring in 30 days" value={rows.filter((row) => row.days >= 0 && row.days <= 30).length} /></div>
      <Card><CardHeader><CardTitle>Expiry queue</CardTitle><CardDescription>Use FIFO issue and waste/damage actions for expired stock.</CardDescription></CardHeader><CardContent>{rows.length ? <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Batch</TableHead><TableHead>Remaining</TableHead><TableHead>Expiry</TableHead><TableHead>Alert</TableHead></TableRow></TableHeader><TableBody>{rows.map(({ batch, days }) => { const item = batch.inventory_item ?? batch.inventoryItem; return <TableRow key={batch.id}><TableCell>{itemName(item)}</TableCell><TableCell>{batch.batch_no ?? batch.id}</TableCell><TableCell>{formatBaseQuantity(batch.remaining_qty, itemUnit(item))}</TableCell><TableCell>{batch.expiry_date}</TableCell><TableCell><Badge variant={days < 0 ? "destructive" : days <= 7 ? "destructive" : days <= 30 ? "secondary" : "outline"}>{days < 0 ? `${Math.abs(days)} days expired` : `${days} days left`}</Badge></TableCell></TableRow>; })}</TableBody></Table> : <Empty title="No expiry dates" description="Batches with expiry dates will appear here." />}</CardContent></Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></CardContent></Card>;
}

function PurchaseSuggestionsPage({ scope }: { scope: InventoryRoleScope }) {
  const low = useQuery({ queryKey: ["inventory", "enterprise", "low", scope], queryFn: () => inventoryService.lowStock(scope) });
  const reorder = useQuery({ queryKey: ["inventory", "enterprise", "reorder", scope], queryFn: () => inventoryService.reorderSuggestions(scope) });
  const rows = (reorder.data?.length ? reorder.data : low.data ?? []).map((row: any) => {
    const min = Number(row.minimum_quantity ?? row.reorder_level ?? 0);
    const current = Number(row.current_stock ?? row.stock ?? 0);
    const suggested = Number(row.suggested_quantity ?? row.suggested_qty ?? row.shortage ?? Math.max(min * 2 - current, 0));
    return { ...row, min, current, suggested };
  });

  return (
    <div className="space-y-6">
      <Header title="Purchase Suggestion Auto-Generator" description="Generate purchase quantities from low stock, reorder levels, and backend reorder suggestions." icon={ShoppingCart} />
      <div className="grid gap-4 md:grid-cols-3"><Metric title="Suggested lines" value={rows.length} /><Metric title="Urgent lines" value={rows.filter((row: any) => row.current <= row.min).length} /><Metric title="Total suggested qty" value={rows.reduce((sum: number, row: any) => sum + Number(row.suggested ?? 0), 0).toFixed(2)} /></div>
      <Card><CardHeader><CardTitle>Auto-generated purchase list</CardTitle><CardDescription>Purchaser can copy these lines into a purchase request/PO.</CardDescription></CardHeader><CardContent>{rows.length ? <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Current</TableHead><TableHead>Minimum</TableHead><TableHead>Suggested qty</TableHead><TableHead>Priority</TableHead></TableRow></TableHeader><TableBody>{rows.map((row: any, index: number) => <TableRow key={row.id ?? row.inventory_item_id ?? index}><TableCell>{row.name ?? row.item_name ?? row.inventory_item?.name ?? "—"}</TableCell><TableCell>{row.current}</TableCell><TableCell>{row.min}</TableCell><TableCell className="font-semibold">{row.suggested}</TableCell><TableCell><Badge variant={row.current <= row.min ? "destructive" : "secondary"}>{row.current <= row.min ? "Buy now" : "Plan"}</Badge></TableCell></TableRow>)}</TableBody></Table> : <Empty title="No purchase suggestions" description="No low-stock or reorder suggestion data was returned." />}</CardContent></Card>
    </div>
  );
}

function ForecastPage({ scope }: { scope: InventoryRoleScope }) {
  const items = useInventoryItems(scope);
  const movements = useMovements(scope);
  const outRows = (movements.data?.data ?? []).filter((row: InventoryTransaction) => ["out", "waste", "transfer_out"].includes(String(row.type ?? row.transaction_type)));
  const byItem = new Map<string, { item?: InventoryItem | null; totalOut: number; stock: number; unit: string }>();
  for (const item of items.data?.data ?? []) byItem.set(String(item.id), { item, totalOut: 0, stock: Number(item.current_stock ?? 0), unit: itemUnit(item) });
  for (const move of outRows) {
    const item = move.inventory_item ?? move.inventoryItem;
    const key = String(move.inventory_item_id ?? item?.id ?? "unknown");
    const current = byItem.get(key) ?? { item, totalOut: 0, stock: Number(item?.current_stock ?? 0), unit: itemUnit(item) };
    current.totalOut += Math.abs(Number(move.quantity ?? 0));
    byItem.set(key, current);
  }
  const forecast = Array.from(byItem.values()).filter((row) => row.totalOut > 0 || row.stock > 0).map((row) => {
    const dailyUsage = row.totalOut / 30;
    const daysLeft = dailyUsage > 0 ? row.stock / dailyUsage : Infinity;
    return { ...row, dailyUsage, daysLeft };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="space-y-6">
      <Header title="Stock Forecasting Dashboard" description="Estimate daily usage and stock days-left from recent inventory OUT/WASTE/TRANSFER_OUT movements." icon={TrendingUp} />
      <div className="grid gap-4 md:grid-cols-3"><Metric title="Forecasted items" value={forecast.length} /><Metric title="Risk in 7 days" value={forecast.filter((row) => row.daysLeft <= 7).length} /><Metric title="Risk in 30 days" value={forecast.filter((row) => row.daysLeft <= 30).length} /></div>
      <Card><CardHeader><CardTitle>Consumption forecast</CardTitle><CardDescription>Uses the latest movement page data as a 30-day window approximation.</CardDescription></CardHeader><CardContent>{forecast.length ? <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Current stock</TableHead><TableHead>Avg daily usage</TableHead><TableHead>Days left</TableHead><TableHead>Risk</TableHead></TableRow></TableHeader><TableBody>{forecast.map((row, index) => <TableRow key={row.item?.id ?? index}><TableCell>{itemName(row.item)}</TableCell><TableCell>{formatBaseQuantity(row.stock, row.unit)}</TableCell><TableCell>{formatBaseQuantity(row.dailyUsage, row.unit)}</TableCell><TableCell>{Number.isFinite(row.daysLeft) ? row.daysLeft.toFixed(1) : "No usage"}</TableCell><TableCell><Badge variant={row.daysLeft <= 7 ? "destructive" : row.daysLeft <= 30 ? "secondary" : "outline"}>{row.daysLeft <= 7 ? "Critical" : row.daysLeft <= 30 ? "Watch" : "Healthy"}</Badge></TableCell></TableRow>)}</TableBody></Table> : <Empty title="No forecast data" description="Stock movements are needed before forecasting can calculate usage." />}</CardContent></Card>
    </div>
  );
}

export default function EnterpriseInventoryPage({ view }: EnterpriseProps) {
  const scope = useInventoryScope();
  if (view === "drink-links") return <DrinkAutoLinkPage scope={scope} />;
  if (view === "recipe-dnd") return <RecipeDragDropPage scope={scope} />;
  if (view === "valuation-methods") return <ValuationMethodsPage scope={scope} />;
  if (view === "expiry-alerts") return <ExpiryAlertsPage scope={scope} />;
  if (view === "purchase-suggestions") return <PurchaseSuggestionsPage scope={scope} />;
  if (view === "forecast") return <ForecastPage scope={scope} />;
  return <Header title={titleCase(view)} description="Enterprise inventory page" icon={PackageSearch} />;
}
