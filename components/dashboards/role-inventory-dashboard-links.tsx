"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  CookingPot,
  ExternalLink,
  FileSearch,
  Link2,
  Package,
  PackageCheck,
  PlusCircle,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

type RoleKey = "fb-controller" | "stock-keeper" | "purchaser" | "admin-manager";

export const inventoryDashboardLinks: Record<RoleKey, DashboardLink[]> = {
  "admin-manager": [
    { title: "Inventory Overview", description: "Stock KPIs, movements and valuation summary.", href: "/dashboard/inventory/overview", icon: BarChart3, badge: "Dashboard" },
    { title: "Inventory Items", description: "View and manage all master stock items.", href: "/dashboard/inventory/items", icon: Package },
    { title: "Stock Movements", description: "Audit all in/out/adjust/waste transactions.", href: "/dashboard/inventory/movements", icon: ClipboardList },
    { title: "Stock Valuation", description: "Inventory value report and costing totals.", href: "/dashboard/inventory/valuation", icon: ReceiptText },
    { title: "Low Stock", description: "Items below minimum quantity.", href: "/dashboard/inventory/low-stock", icon: AlertTriangle },
    { title: "Recipe Integrity", description: "Find missing recipes and inventory links.", href: "/dashboard/inventory/recipe-integrity", icon: FileSearch },
    { title: "FIFO / LIFO Valuation", description: "Compare valuation methods from batches.", href: "/dashboard/inventory/valuation-methods", icon: Boxes, badge: "Enterprise" },
    { title: "Expiry Alerts", description: "Expired and soon-expiring batches.", href: "/dashboard/inventory/expiry-alerts", icon: AlertTriangle, badge: "Enterprise" },
    { title: "Purchase Suggestions", description: "Auto-generate purchase need from low stock.", href: "/dashboard/inventory/purchase-suggestions", icon: Sparkles, badge: "AI" },
    { title: "Stock Forecast", description: "Forecast days-left from stock movement history.", href: "/dashboard/inventory/forecast", icon: TrendingUp, badge: "Forecast" },
  ],
  "fb-controller": [
    { title: "Inventory Items", description: "Create/update ingredient and packaged stock items.", href: "/dashboard/inventory/items", icon: Package },
    { title: "Recipes", description: "Create/update menu item recipes.", href: "/dashboard/inventory/recipes", icon: CookingPot },
    { title: "Recipe Drag-Drop", description: "Build recipe ingredients with drag/drop ordering.", href: "/dashboard/inventory/recipe-dnd", icon: ClipboardList, badge: "New" },
    { title: "Drink Auto-Link", description: "Link packaged drinks directly to inventory stock.", href: "/dashboard/inventory/drink-links", icon: Wine, badge: "Direct" },
    { title: "Low Stock", description: "Review low-stock ingredients and supplies.", href: "/dashboard/inventory/low-stock", icon: AlertTriangle },
    { title: "Reorder Suggestions", description: "Recommended reorder quantities for low stock.", href: "/dashboard/inventory/reorder-suggestions", icon: Sparkles },
    { title: "Recipe Integrity", description: "Diagnose missing recipes and inventory links.", href: "/dashboard/inventory/recipe-integrity", icon: FileSearch },
    { title: "Expired Items", description: "List expired stock batches and products.", href: "/dashboard/inventory/expired-items", icon: AlertTriangle },
    { title: "Expiry Alerts", description: "Batches expiring soon by risk window.", href: "/dashboard/inventory/expiry-alerts", icon: Boxes, badge: "Batch" },
    { title: "Purchase Suggestions", description: "Convert shortage insights into purchase needs.", href: "/dashboard/inventory/purchase-suggestions", icon: ShoppingCart },
  ],
  "stock-keeper": [
    { title: "Inventory Items", description: "View stock items and current balances.", href: "/dashboard/inventory/items", icon: Package },
    { title: "Batches", description: "View received batches, remaining qty and expiry.", href: "/dashboard/inventory/batches", icon: Boxes },
    { title: "Adjustments", description: "Record physical-count stock adjustment.", href: "/dashboard/inventory/adjustments", icon: PlusCircle },
    { title: "Waste / Damage", description: "Record damaged, wasted or unusable stock.", href: "/dashboard/inventory/waste", icon: AlertTriangle },
    { title: "Movements", description: "View all inventory movement transactions.", href: "/dashboard/inventory/movements", icon: ClipboardList },
    { title: "Expiry Alerts", description: "Prioritize expired and soon-expiring batches.", href: "/dashboard/inventory/expiry-alerts", icon: Boxes, badge: "Expiry" },
    { title: "Forecast", description: "Forecast stock risk from movement usage.", href: "/dashboard/inventory/forecast", icon: TrendingUp },
    { title: "Receive Stock", description: "Receive approved purchase orders into batches.", href: "/dashboard/purchases/receiving", icon: PackageCheck, badge: "Action" },
  ],
  purchaser: [
    { title: "Suppliers", description: "Select and manage suppliers for purchase orders.", href: "/dashboard/purchases/suppliers", icon: Truck },
    { title: "Purchase Requests", description: "Create and track purchase requests.", href: "/dashboard/purchases/requests", icon: ShoppingCart, badge: "Create" },
    { title: "Purchase Orders", description: "View pending and approved purchase orders.", href: "/dashboard/purchase-orders", icon: ReceiptText },
    { title: "Purchase Suggestions", description: "Auto-generated buy list from inventory shortage.", href: "/dashboard/inventory/purchase-suggestions", icon: Sparkles, badge: "Suggested" },
    { title: "Inventory Items", description: "Read-only item list for purchase planning.", href: "/dashboard/inventory/items", icon: Package },
  ],
};

export function RoleInventoryDashboardLinks({ role, title = "Inventory workspace", description = "Open the pages assigned to this role." }: { role: RoleKey; title?: string; description?: string }) {
  const links = inventoryDashboardLinks[role];

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="secondary">{links.length} shortcuts</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="group rounded-2xl border bg-background p-4 transition hover:border-primary/60 hover:bg-muted/40">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold leading-none">{link.title}</p>
                      {link.badge && <Badge variant="outline" className="text-[10px]">{link.badge}</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
                    <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs">
                      <span>Open <ExternalLink className="ml-1 h-3 w-3" /></span>
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
