"use client";

import Link from "next/link";
import { AlertTriangle, BarChart3, ClipboardList, Package, PackageSearch, Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inventoryCards = [
  {
    title: "Inventory Overview",
    description: "Stock summary, recent movements, valuation snapshot, and alerts.",
    href: "/dashboard/inventory/overview",
    icon: Warehouse,
  },
  {
    title: "Inventory Items",
    description: "Manage stock items using base SI units (g, ml, pc).",
    href: "/dashboard/inventory/items",
    icon: Package,
  },
  {
    title: "Stock Movements",
    description: "Review adjustments, transfers, waste, and stock flow history.",
    href: "/dashboard/inventory/movements",
    icon: ClipboardList,
  },
  {
    title: "Stock Valuation",
    description: "Analyze inventory value by item and total stock worth.",
    href: "/dashboard/inventory/valuation",
    icon: BarChart3,
  },
  {
    title: "Low Stock Report",
    description: "Items below minimum quantity requiring purchase planning.",
    href: "/dashboard/inventory/low-stock",
    icon: AlertTriangle,
  },
  {
    title: "Recipe Integrity",
    description: "Missing recipes and inventory linkage diagnostics.",
    href: "/dashboard/inventory/recipe-integrity",
    icon: PackageSearch,
  },
];

export default function ManagerInventoryModulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manager Inventory Module</h1>
        <p className="text-muted-foreground">Central inventory workspace for cafeteria manager stock supervision and reporting.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {inventoryCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.href} className="rounded-2xl transition hover:border-primary/50 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="min-h-10 text-xs text-muted-foreground">{item.description}</p>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={item.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
