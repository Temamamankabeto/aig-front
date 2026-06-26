"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Package, PackageCheck, SlidersHorizontal, Trash2, Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { procurementService } from "@/services/inventory-management/procurement.service";
import inventoryService from "@/services/inventory-management/inventory.service";

const actionCards = [
  { title: "Receive Ordered Items", description: "Receive approved purchase orders and create stock batches.", href: "/dashboard/purchases/receiving", icon: PackageCheck },
  { title: "Inventory Items", description: "View stock items and current quantities.", href: "/dashboard/inventory/items", icon: Package },
  { title: "Stock Movements", description: "Review all stock transactions and movement history.", href: "/dashboard/inventory/movements", icon: ClipboardList },
  { title: "Batches", description: "Track batch quantities, expiry dates, and availability.", href: "/dashboard/inventory/batches", icon: Warehouse },
  { title: "Adjustments", description: "Record physical count corrections and manual stock adjustments.", href: "/dashboard/inventory/adjustments", icon: SlidersHorizontal },
  { title: "Waste / Damage", description: "Record expired, damaged, or wasted stock.", href: "/dashboard/inventory/waste", icon: Trash2 },
];

export default function StockKeeperWorkspacePage() {
  const pendingReceiving = useQuery({
    queryKey: ["stock-workspace", "purchase", "approved"],
    queryFn: () => procurementService.purchaseOrders({ status: "approved", per_page: 1 }, "stock-keeper"),
    staleTime: 30000,
    retry: false,
  });

  const items = useQuery({
    queryKey: ["stock-workspace", "inventory", "items"],
    queryFn: () => inventoryService.items({ per_page: 1 }, "stock-keeper"),
    staleTime: 30000,
    retry: false,
  });

  const movements = useQuery({
    queryKey: ["stock-workspace", "inventory", "movements"],
    queryFn: () => inventoryService.transactions({ per_page: 1 }, "stock-keeper"),
    staleTime: 30000,
    retry: false,
  });

  const batches = useQuery({
    queryKey: ["stock-workspace", "inventory", "batches"],
    queryFn: () => inventoryService.batches({ per_page: 1 }, "stock-keeper"),
    staleTime: 30000,
    retry: false,
  });

  const pendingCount = pendingReceiving.data?.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock Keeper Workspace</h1>
        <p className="text-muted-foreground">Central workspace for receiving, stock balances, batches, movements, adjustments, and waste control.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Receiving</CardTitle><PackageCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent className="space-y-4"><div><div className="text-3xl font-bold">{pendingReceiving.isLoading ? "..." : pendingCount}</div><p className="mt-1 text-xs text-muted-foreground">Approved purchase orders waiting for stock receiving.</p></div><Button asChild size="sm" className="w-full" variant={pendingCount > 0 ? "default" : "outline"}><Link href="/dashboard/purchases/receiving">Receive stock</Link></Button></CardContent>
        </Card>
        <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Items</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{items.isLoading ? "..." : items.data?.meta.total ?? 0}</div><p className="mt-1 text-xs text-muted-foreground">Stock items visible to stock keeper.</p></CardContent></Card>
        <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Movements</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{movements.isLoading ? "..." : movements.data?.meta.total ?? 0}</div><p className="mt-1 text-xs text-muted-foreground">Recorded stock movement transactions.</p></CardContent></Card>
        <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Batches</CardTitle><Warehouse className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{batches.isLoading ? "..." : batches.data?.meta.total ?? 0}</div><p className="mt-1 text-xs text-muted-foreground">Received stock batches and expiry records.</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actionCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="rounded-2xl transition hover:border-primary/50 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{item.title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent className="space-y-4"><p className="min-h-10 text-xs text-muted-foreground">{item.description}</p><Button asChild size="sm" variant="outline" className="w-full"><Link href={item.href}>Open</Link></Button></CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
