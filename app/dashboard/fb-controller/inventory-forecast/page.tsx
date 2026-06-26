"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardList, DollarSign, PackageCheck, ShieldCheck, Trash2, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBaseQuantity, formatMoney, formatNumber } from "@/lib/inventory-management";
import inventoryService from "@/services/inventory-management/inventory.service";
import { procurementService } from "@/services/inventory-management/procurement.service";
import type { InventoryItem, MenuItemOption, Recipe, RecipeIngredient } from "@/types/inventory-management";

type IconType = typeof ShieldCheck;

function MetricCard({ title, value, description, href, action, icon: Icon }: { title: string; value: number | string; description: string; href: string; action: string; icon: IconType }) {
  const n = typeof value === "number" ? value : Number(value || 0);
  return <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent className="space-y-4"><div><div className="text-3xl font-bold">{value}</div><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Button asChild size="sm" className="w-full" variant={n > 0 ? "default" : "outline"}><Link href={href}>{action}</Link></Button></CardContent></Card>;
}

function unit(item?: Pick<InventoryItem, "base_unit" | "unit"> | null) {
  return item?.base_unit ?? item?.unit ?? "pc";
}
function ingItem(ing: RecipeIngredient) { return ing.inventory_item ?? ing.inventoryItem ?? null; }
function recipeItems(recipe: Recipe) { return recipe.items ?? recipe.recipe_items ?? []; }
function days7() {
  const f = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  return Array.from({ length: 7 }).map((_, i) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (6 - i)); return { key: d.toISOString().slice(0, 10), label: f.format(d), quantity: 0 }; });
}

export default function FBControllerInventoryForecastPage() {
  const pendingValidation = useQuery({ queryKey: ["fb-forecast", "submitted"], queryFn: () => procurementService.purchaseOrders({ status: "submitted", per_page: 1 }, "food-controller"), staleTime: 30000, retry: false });
  const lowStock = useQuery({ queryKey: ["fb-forecast", "low-stock"], queryFn: () => inventoryService.lowStock("food-controller"), staleTime: 30000, retry: false });
  const recipeIntegrity = useQuery({ queryKey: ["fb-forecast", "recipe-integrity"], queryFn: () => inventoryService.recipeIntegrity("food-controller"), staleTime: 30000, retry: false });
  const unreceivedOrders = useQuery({ queryKey: ["fb-forecast", "approved"], queryFn: () => procurementService.purchaseOrders({ status: "approved", per_page: 1 }, "food-controller"), staleTime: 30000, retry: false });
  const valuation = useQuery({ queryKey: ["fb-forecast", "valuation"], queryFn: () => inventoryService.stockValuation("food-controller"), staleTime: 30000, retry: false });
  const outTx = useQuery({ queryKey: ["fb-forecast", "out-transactions"], queryFn: () => inventoryService.transactions({ type: "out", per_page: 100 }, "food-controller"), staleTime: 30000, retry: false });
  const wasteTx = useQuery({ queryKey: ["fb-forecast", "waste-transactions"], queryFn: () => inventoryService.transactions({ type: "waste", per_page: 100 }, "food-controller"), staleTime: 30000, retry: false });
  const recipes = useQuery({ queryKey: ["fb-forecast", "recipes"], queryFn: () => inventoryService.recipes({ per_page: 100 }, "food-controller"), staleTime: 30000, retry: false });
  const menuItems = useQuery({ queryKey: ["fb-forecast", "menu-items"], queryFn: () => inventoryService.menuItems({ per_page: 200, is_active: true }, "food-controller"), staleTime: 30000, retry: false });

  const integrityIssues = useMemo(() => {
    const s = recipeIntegrity.data?.summary ?? {};
    return Object.values(s).reduce((sum, v) => sum + Number(v ?? 0), 0) || recipeIntegrity.data?.rows?.length || 0;
  }, [recipeIntegrity.data]);

  const critical = useMemo(() => [...(lowStock.data ?? [])].sort((a, b) => Number(a.current_stock ?? 0) / Math.max(Number(a.minimum_quantity ?? 1), 1) - Number(b.current_stock ?? 0) / Math.max(Number(b.minimum_quantity ?? 1), 1)).slice(0, 5), [lowStock.data]);

  const weekly = useMemo(() => {
    const rows = days7(); const m = new Map(rows.map(r => [r.key, r]));
    for (const t of outTx.data?.data ?? []) { if (!t.created_at) continue; const r = m.get(new Date(t.created_at).toISOString().slice(0, 10)); if (r) r.quantity += Math.abs(Number(t.quantity ?? 0)); }
    const max = Math.max(...rows.map(r => r.quantity), 1);
    return rows.map(r => ({ ...r, percent: Math.round((r.quantity / max) * 100) }));
  }, [outTx.data]);

  const waste = useMemo(() => {
    const rows = wasteTx.data?.data ?? [];
    const value = rows.reduce((sum, t) => sum + Math.abs(Number(t.quantity ?? 0)) * Number(t.unit_cost ?? t.inventory_item?.average_purchase_price ?? t.inventoryItem?.average_purchase_price ?? 0), 0);
    return { count: rows.length, value, top: rows.slice(0, 5) };
  }, [wasteTx.data]);

  const profitability = useMemo(() => {
    const menu = new Map<number, MenuItemOption>((menuItems.data?.data ?? []).map(i => [Number(i.id), i]));
    return (recipes.data?.data ?? []).map((r: Recipe) => {
      const m = menu.get(Number(r.menu_item_id));
      const cost = recipeItems(r).reduce((sum, ing) => sum + Number(ing.quantity ?? 0) * Number(ingItem(ing)?.average_purchase_price ?? 0), 0);
      const price = Number(m?.price ?? 0); const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
      return { id: r.id, name: m?.name ?? r.menu_item?.name ?? r.name ?? `Menu #${r.menu_item_id}`, price, cost, margin };
    }).filter(r => r.price > 0 || r.cost > 0).sort((a, b) => a.margin - b.margin).slice(0, 5);
  }, [recipes.data, menuItems.data]);

  return <div className="space-y-6"><div><h1 className="text-2xl font-bold tracking-tight">F & B Inventory Forecast</h1><p className="text-muted-foreground">Recipe integrity, stock analysis, alerts, waste control, and purchase validation workload.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Pending Validation" value={pendingValidation.isLoading ? "..." : pendingValidation.data?.meta.total ?? 0} description="Submitted purchase requests waiting for validation." href="/dashboard/purchases/validation" action="Open validation" icon={ShieldCheck} />
      <MetricCard title="Low Stock Alerts" value={lowStock.isLoading ? "..." : lowStock.data?.length ?? 0} description="Items at or below minimum quantity." href="/dashboard/inventory/low-stock" action="Review low stock" icon={AlertTriangle} />
      <MetricCard title="Recipe Integrity Issues" value={recipeIntegrity.isLoading ? "..." : integrityIssues} description="Missing recipes or inventory links." href="/dashboard/inventory/recipe-integrity" action="Fix recipes" icon={ClipboardList} />
      <MetricCard title="Unreceived Orders" value={unreceivedOrders.isLoading ? "..." : unreceivedOrders.data?.meta.total ?? 0} description="Approved orders waiting receiving." href="/dashboard/purchases/receiving" action="View receiving" icon={PackageCheck} />
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Stock Value</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{valuation.isLoading ? "..." : `${formatMoney(valuation.data?.total_value ?? 0)} ETB`}</div><p className="mt-1 text-xs text-muted-foreground">Current inventory value.</p></CardContent></Card><Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Waste This Period</CardTitle><Trash2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{wasteTx.isLoading ? "..." : `${formatMoney(waste.value)} ETB`}</div><p className="mt-1 text-xs text-muted-foreground">{waste.count} waste transactions.</p></CardContent></Card><Card className="rounded-2xl md:col-span-2"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Weekly Consumption Trend</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="space-y-3">{weekly.map(d => <div key={d.key} className="grid grid-cols-[44px_1fr_72px] items-center gap-3 text-sm"><span className="font-medium">{d.label}</span><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${d.percent}%` }} /></div><span className="text-right text-muted-foreground">{formatNumber(d.quantity)}</span></div>)}</div></CardContent></Card></div>
    <div className="grid gap-4 lg:grid-cols-3"><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Top 5 Critical Ingredients</CardTitle></CardHeader><CardContent>{critical.length ? <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Current</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{critical.map(i => <TableRow key={i.id}><TableCell className="font-medium">{i.name}</TableCell><TableCell>{formatBaseQuantity(i.current_stock, unit(i))}</TableCell><TableCell><Badge variant="destructive">Critical</Badge></TableCell></TableRow>)}</TableBody></Table> : <p className="text-sm text-muted-foreground">No critical items found.</p>}</CardContent></Card><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Top Waste Items</CardTitle></CardHeader><CardContent>{waste.top.length ? <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead></TableRow></TableHeader><TableBody>{waste.top.map(t => <TableRow key={t.id}><TableCell>{t.inventory_item?.name ?? t.inventoryItem?.name ?? `Item #${t.inventory_item_id}`}</TableCell><TableCell>{formatBaseQuantity(t.quantity, unit(t.inventory_item ?? t.inventoryItem))}</TableCell></TableRow>)}</TableBody></Table> : <p className="text-sm text-muted-foreground">No waste recorded.</p>}</CardContent></Card><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Menu Profitability</CardTitle></CardHeader><CardContent>{profitability.length ? <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Cost</TableHead><TableHead>Margin</TableHead></TableRow></TableHeader><TableBody>{profitability.map(r => <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{formatMoney(r.cost)}</TableCell><TableCell><Badge variant={r.margin <= 20 ? "destructive" : "secondary"}>{formatNumber(r.margin, 1)}%</Badge></TableCell></TableRow>)}</TableBody></Table> : <p className="text-sm text-muted-foreground">No recipe costing data yet.</p>}</CardContent></Card></div>
  </div>;
}
