"use client";

import Link from "next/link";
import { BarChart3, Package, ShoppingCart, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const moduleCards = [
  {
    title: "Inventory Module",
    description: "Open the manager inventory workspace for stock, purchase requests, reports, and recipe checks.",
    href: "/dashboard/cafeteria-manager/inventory",
    icon: Package,
  },
  {
    title: "Menu Module",
    description: "Menu overview and manager actions will be added here later.",
    href: "/dashboard/modules/menu",
    icon: Utensils,
  },
  {
    title: "Order Module",
    description: "Order overview and manager actions will be added here later.",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "Reports Module",
    description: "Operational and financial reports will be expanded here later.",
    href: "/dashboard/modules/reports",
    icon: BarChart3,
  },
];

export default function CafeteriaManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cafeteria Manager Dashboard</h1>
        <p className="text-muted-foreground">Main control center for manager modules. Open each module screen from the cards below.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map((item) => {
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
