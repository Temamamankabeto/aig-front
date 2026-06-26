"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Package,
  PackageCheck,
  RefreshCcw,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { useInventoryBatches, useInventoryItems, useInventoryTransactions } from "@/hooks/inventory-management/useInventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartBarList, ChartContainer } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryItem, InventoryTransaction } from "@/types/inventory-management";

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB`;
}

function stockLevel(item: InventoryItem): number {
  const minimum = Math.max(numberValue(item.minimum_quantity), 1);
  return Math.min(100, Math.round((numberValue(item.current_stock) / minimum) * 100));
}

function transactionLabel(row: InventoryTransaction): string {
  return String(row.transaction_type ?? row.type ?? "movement").replaceAll("_", " ");
}

export default function StockKeeperDashboardPage() {
  const itemsQuery = useInventoryItems({ per_page: 100 }, "stock-keeper");
  const transactionsQuery = useInventoryTransactions({ per_page: 8 }, "stock-keeper");
  const batchesQuery = useInventoryBatches({ per_page: 100 }, "stock-keeper");

  const items = itemsQuery.data?.data ?? [];
  const transactions = transactionsQuery.data?.data ?? [];
  const batches = batchesQuery.data?.data ?? [];
  const loading = itemsQuery.isLoading || transactionsQuery.isLoading || batchesQuery.isLoading;

  const activeItems = items.filter((item) => item.is_active !== false).length;
  const lowStockItems = items.filter((item) => numberValue(item.current_stock) <= numberValue(item.minimum_quantity)).length;
  const outOfStockItems = items.filter((item) => numberValue(item.current_stock) <= 0).length;
  const totalValue = items.reduce(
    (sum, item) => sum + numberValue(item.current_stock) * numberValue(item.average_purchase_price),
    0,
  );
  const availableBatches = batches.filter((batch) => numberValue(batch.remaining_qty) > 0).length;
  const healthyPercent = items.length ? Math.round(((items.length - lowStockItems) / items.length) * 100) : 0;

  const topStock = [...items]
    .sort((a, b) => numberValue(b.current_stock) - numberValue(a.current_stock))
    .slice(0, 5)
    .map((item) => ({
      label: item.name,
      value: numberValue(item.current_stock),
      suffix: ` ${item.base_unit}`,
    }));

  const riskItems = [...items]
    .sort((a, b) => stockLevel(a) - stockLevel(b))
    .slice(0, 5);

  const quickActions = [
    {
      title: "Manage Inventory",
      description: "Items, receiving, adjustments, waste, movements, and batches in one workspace.",
      href: "/dashboard/inventory/items",
      icon: Warehouse,
    },
    {
      title: "Receive Stock",
      description: "Receive manager-approved purchase orders into inventory.",
      href: "/dashboard/inventory/items?tab=receiving",
      icon: PackageCheck,
    },
    {
      title: "Stock Movements",
      description: "Audit recent stock-in, stock-out, adjustment, and waste records.",
      href: "/dashboard/inventory/items?tab=movements",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            Store keeper operational dashboard
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Stock Keeper Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Live inventory performance, low-stock risk, batch availability, and movement overview.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory/items">Open Inventory Workspace</Link>
          </Button>
          <Button
            type="button"
            onClick={() => {
              itemsQuery.refetch();
              transactionsQuery.refetch();
              batchesQuery.refetch();
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-28" /> : <div className="text-2xl font-bold">{money(totalValue)}</div>}
            <p className="mt-1 text-xs text-muted-foreground">Based on current stock and average price.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{activeItems}</div>}
            <p className="mt-1 text-xs text-muted-foreground">Total active stock items available.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{lowStockItems}</div>}
            <p className="mt-1 text-xs text-muted-foreground">{outOfStockItems} item(s) currently out of stock.</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Batches</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{availableBatches}</div>}
            <p className="mt-1 text-xs text-muted-foreground">Batches with remaining quantity.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartContainer title="Stock balance by item" description="Highest available stock quantity by base unit.">
          <ChartBarList data={topStock} emptyLabel="No inventory balance available" />
        </ChartContainer>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-sm">
              Stock Health
              <Badge variant="outline">{healthyPercent}% healthy</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={healthyPercent} />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border bg-card p-3">
                <div className="font-bold">{items.length}</div>
                <div className="text-muted-foreground">Items</div>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <div className="font-bold">{lowStockItems}</div>
                <div className="text-muted-foreground">Low</div>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <div className="font-bold">{outOfStockItems}</div>
                <div className="text-muted-foreground">Empty</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm">Recent Stock Movements</CardTitle>
              <p className="text-xs text-muted-foreground">Latest inventory transactions recorded by store operations.</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/inventory/items?tab=movements">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Item</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Qty</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3" colSpan={4}><Skeleton className="h-4 w-full" /></td>
                      </tr>
                    ))
                  ) : transactions.length ? (
                    transactions.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{row.inventory_item?.name ?? row.inventoryItem?.name ?? "Inventory item"}</td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{transactionLabel(row)}</td>
                        <td className="px-4 py-3">{numberValue(row.quantity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>No stock movements recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Low Stock Watchlist</CardTitle>
            <p className="text-xs text-muted-foreground">Items closest to their minimum quantity.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)
            ) : riskItems.length ? (
              riskItems.map((item) => {
                const level = stockLevel(item);
                return (
                  <div key={item.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant={level <= 100 ? "outline" : "secondary"}>{numberValue(item.current_stock)} {item.base_unit}</Badge>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Progress value={Math.min(level, 100)} />
                      <p className="text-xs text-muted-foreground">Minimum: {numberValue(item.minimum_quantity)} {item.base_unit}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No inventory items found.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="rounded-2xl shadow-sm transition hover:border-primary/40 hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <Button asChild variant="ghost" className="w-full justify-between">
                  <Link href={item.href}>
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
