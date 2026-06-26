"use client";

import Link from "next/link";
import { AlertTriangle, BarChart3, ClipboardCheck, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBarList, ChartContainer } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBaseQuantity, formatMoney, formatNumber } from "@/lib/inventory-management";
import { useLowStockQuery, useRecipeIntegrityQuery, useStockValuationQuery } from "@/hooks/inventory-management";
import type { InventoryItem, RecipeIntegrityRow, StockValuationRow } from "@/types/inventory-management";

function pageTitle(icon: typeof BarChart3, title: string, description: string) {
  const Icon = icon;
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard/inventory/overview">Back to inventory overview</Link>
      </Button>
    </div>
  );
}

function itemUnit(item?: Pick<InventoryItem, "base_unit" | "unit"> | null) {
  return item?.base_unit ?? item?.unit ?? "pc";
}

function itemName(item?: Pick<InventoryItem, "name" | "sku"> | null) {
  if (!item) return "—";
  return item.sku ? `${item.name} (${item.sku})` : item.name;
}

function EmptyReport({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function InventoryValuationReportPage() {
  const query = useStockValuationQuery("admin");
  const rows = query.data?.rows ?? [];
  const totalValue = query.data?.total_value ?? rows.reduce((sum, row) => sum + Number(row.stock_value ?? row.value ?? 0), 0);
  const chartData = rows
    .map((row) => ({ label: itemName(row), value: Number(row.stock_value ?? row.value ?? 0) }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {pageTitle(BarChart3, "Stock Valuation", "Manager view of inventory value by item and total stock value.")}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total stock value</p>
            <p className="mt-1 text-2xl font-bold">{formatMoney(totalValue)} ETB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Valued items</p>
            <p className="mt-1 text-2xl font-bold">{formatNumber(rows.length, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Highest value item</p>
            <p className="mt-1 truncate text-2xl font-bold">{chartData[0]?.label ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <ChartContainer title="Top stock value items" description="The highest-value inventory items based on backend stock valuation.">
        <ChartBarList data={chartData} valueFormatter={(value) => `${formatMoney(value)} ETB`} emptyLabel={query.isLoading ? "Loading valuation chart..." : "No valuation data"} />
      </ChartContainer>

      <Card>
        <CardHeader>
          <CardTitle>Valuation table</CardTitle>
          <CardDescription>Current stock multiplied by average purchase price.</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? <p className="text-sm text-muted-foreground">Loading valuation...</p> : rows.length ? <ValuationTable rows={rows} /> : <EmptyReport title="No valuation data" description="Stock valuation rows will appear after inventory items and prices exist." />}
        </CardContent>
      </Card>
    </div>
  );
}

function ValuationTable({ rows }: { rows: StockValuationRow[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Current stock</TableHead>
            <TableHead>Avg price</TableHead>
            <TableHead className="text-right">Stock value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.sku ?? "No SKU"}</p></TableCell>
              <TableCell>{formatBaseQuantity(row.current_stock, itemUnit(row))}</TableCell>
              <TableCell>{formatMoney(row.average_purchase_price)} ETB</TableCell>
              <TableCell className="text-right font-medium">{formatMoney(row.stock_value ?? row.value ?? 0)} ETB</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function InventoryLowStockReportPage() {
  const query = useLowStockQuery("admin");
  const rows = query.data ?? [];
  const chartData = rows
    .map((row) => ({ label: itemName(row), value: Number(row.shortage ?? Math.max(0, Number(row.minimum_quantity ?? 0) - Number(row.current_stock ?? 0))) }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {pageTitle(AlertTriangle, "Low Stock Report", "Manager view of items below minimum quantity and shortage risk.")}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Low-stock items</p><p className="mt-1 text-2xl font-bold">{formatNumber(rows.length, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Largest shortage</p><p className="mt-1 text-2xl font-bold">{chartData[0] ? formatNumber(chartData[0].value) : "0"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Priority item</p><p className="mt-1 truncate text-2xl font-bold">{chartData[0]?.label ?? "—"}</p></CardContent></Card>
      </div>

      <ChartContainer title="Shortage by item" description="Items with the largest difference between minimum quantity and current stock.">
        <ChartBarList data={chartData} valueFormatter={(value) => formatNumber(value)} emptyLabel={query.isLoading ? "Loading low-stock chart..." : "No low-stock shortage"} />
      </ChartContainer>

      <Card>
        <CardHeader><CardTitle>Low-stock table</CardTitle><CardDescription>Items that need manager attention or purchase planning.</CardDescription></CardHeader>
        <CardContent>
          {query.isLoading ? <p className="text-sm text-muted-foreground">Loading low-stock report...</p> : rows.length ? <LowStockTable rows={rows} /> : <EmptyReport title="No low-stock items" description="All inventory items are currently above their minimum quantity." />}
        </CardContent>
      </Card>
    </div>
  );
}

function LowStockTable({ rows }: { rows: InventoryItem[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Current</TableHead><TableHead>Minimum</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((row) => {
            const shortage = Math.max(0, Number(row.minimum_quantity ?? 0) - Number(row.current_stock ?? 0));
            return <TableRow key={row.id}><TableCell><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.sku ?? "No SKU"}</p></TableCell><TableCell>{formatBaseQuantity(row.current_stock, itemUnit(row))}</TableCell><TableCell>{formatBaseQuantity(row.minimum_quantity, itemUnit(row))}</TableCell><TableCell><Badge variant="destructive">Short by {formatBaseQuantity(shortage, itemUnit(row))}</Badge></TableCell></TableRow>;
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function InventoryRecipeIntegrityReportPage() {
  const query = useRecipeIntegrityQuery("admin");
  const rows = query.data?.rows ?? [];
  const summary = query.data?.summary ?? {};
  const issueCount = rows.length;

  return (
    <div className="space-y-6">
      {pageTitle(PackageSearch, "Recipe Integrity Report", "Manager view of menu items with missing recipes, missing links, or tracking issues.")}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Integrity rows</p><p className="mt-1 text-2xl font-bold">{formatNumber(issueCount, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Summary groups</p><p className="mt-1 text-2xl font-bold">{formatNumber(Object.keys(summary).length, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Manager action</p><p className="mt-1 text-2xl font-bold">Review</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recipe integrity issues</CardTitle><CardDescription>Use this before approving menus or purchasing decisions.</CardDescription></CardHeader>
        <CardContent>
          {query.isLoading ? <p className="text-sm text-muted-foreground">Loading recipe integrity...</p> : rows.length ? <RecipeIntegrityTable rows={rows} /> : <EmptyReport title="No recipe integrity issues" description="No missing recipe or inventory link issue was returned by the backend." />}
        </CardContent>
      </Card>
    </div>
  );
}

function RecipeIntegrityTable({ rows }: { rows: RecipeIntegrityRow[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Menu item</TableHead><TableHead>Type</TableHead><TableHead>Recipe</TableHead><TableHead>Ingredients</TableHead><TableHead>Issue</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id ?? row.menu_item_id ?? index}>
              <TableCell><p className="font-medium">{row.menu_item_name ?? row.name ?? "—"}</p><p className="text-xs text-muted-foreground">Menu ID: {row.menu_item_id ?? "—"}</p></TableCell>
              <TableCell>{row.menu_item_type ?? row.inventory_tracking_mode ?? "—"}</TableCell>
              <TableCell>{row.recipe_id ? <Badge variant="secondary">Linked</Badge> : <Badge variant="destructive">Missing</Badge>}</TableCell>
              <TableCell>{row.ingredient_count ?? "—"}</TableCell>
              <TableCell className="max-w-[280px] truncate">{row.issue ?? (row.missing_items?.length ? row.missing_items.join(", ") : "Review required")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
