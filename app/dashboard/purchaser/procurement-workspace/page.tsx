"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardList, Package, Truck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { procurementService } from "@/services/inventory-management/procurement.service";
import inventoryService from "@/services/inventory-management/inventory.service";

const actionCards = [
  { title: "Suppliers", description: "Open supplier records used for purchase orders.", href: "/dashboard/purchases/suppliers", icon: Users },
  { title: "Purchase Requests", description: "Create, review, submit, and correct purchase requests.", href: "/dashboard/purchases/requests", icon: ClipboardList },
  { title: "Inventory Items", description: "View available stock items before preparing purchase orders.", href: "/dashboard/inventory/items", icon: Package },
];

export default function PurchaserProcurementWorkspacePage() {
  const rejected = useQuery({ queryKey: ["purchaser-workspace", "purchase", "validation_rejected"], queryFn: () => procurementService.purchaseOrders({ status: "validation_rejected", per_page: 1 }, "purchaser"), staleTime: 30000, retry: false });
  const draft = useQuery({ queryKey: ["purchaser-workspace", "purchase", "draft"], queryFn: () => procurementService.purchaseOrders({ status: "draft", per_page: 1 }, "purchaser"), staleTime: 30000, retry: false });
  const submitted = useQuery({ queryKey: ["purchaser-workspace", "purchase", "submitted"], queryFn: () => procurementService.purchaseOrders({ status: "submitted", per_page: 1 }, "purchaser"), staleTime: 30000, retry: false });
  const items = useQuery({ queryKey: ["purchaser-workspace", "inventory", "items"], queryFn: () => inventoryService.items({ per_page: 1 }, "purchaser"), staleTime: 30000, retry: false });
  const rejectedCount = rejected.data?.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchaser Procurement Workspace</h1>
        <p className="text-muted-foreground">Central purchasing workspace for suppliers, purchase requests, corrections, and stock item reference.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Rejected Requests</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent className="space-y-4"><div><div className="text-3xl font-bold">{rejected.isLoading ? "..." : rejectedCount}</div><p className="mt-1 text-xs text-muted-foreground">Requests returned by F&B Controller for correction.</p></div><Button asChild size="sm" className="w-full" variant={rejectedCount > 0 ? "default" : "outline"}><Link href="/dashboard/purchases/requests">Fix requests</Link></Button></CardContent>
        </Card>
        <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Draft Requests</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{draft.isLoading ? "..." : draft.data?.meta.total ?? 0}</div><p className="mt-1 text-xs text-muted-foreground">Purchase requests not submitted yet.</p></CardContent></Card>
        <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Submitted Requests</CardTitle><Truck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{submitted.isLoading ? "..." : submitted.data?.meta.total ?? 0}</div><p className="mt-1 text-xs text-muted-foreground">Requests waiting F&B validation.</p></CardContent></Card>
        <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Items</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{items.isLoading ? "..." : items.data?.meta.total ?? 0}</div><p className="mt-1 text-xs text-muted-foreground">Items available for purchase request lines.</p></CardContent></Card>
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
