import { BarChart3, ClipboardList, Coffee, CreditCard, LayoutDashboard, PackageCheck, ShoppingCart, Store, Truck, Users, Warehouse, Wine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppRoleKey =
  | "cafeteria-manager"
  | "fb-controller"
  | "finance-manager"
  | "stock-keeper"
  | "purchaser"
  | "cashier"
  | "kitchen-staff"
  | "barman"
  | "waiter"
  | "customer";

export type DashboardDefinition = {
  key: AppRoleKey;
  roleName: string;
  title: string;
  subtitle: string;
  route: string;
  icon: LucideIcon;
};

export const roleHome: Record<AppRoleKey, string> = {
  "cafeteria-manager": "/dashboard/cafeteria-manager",
  "fb-controller": "/dashboard/fb-controller",
  "finance-manager": "/dashboard/finance-manager",
  "stock-keeper": "/dashboard/stock-keeper",
  purchaser: "/dashboard/purchaser",
  cashier: "/dashboard/cashier",
  "kitchen-staff": "/dashboard/kitchen-staff",
  barman: "/dashboard/barman",
  waiter: "/dashboard/waiter",
  customer: "/dashboard/customer",
};

export const dashboardConfig: Record<AppRoleKey, DashboardDefinition> = {
  "cafeteria-manager": {
    key: "cafeteria-manager",
    roleName: "Cafeteria Manager",
    title: "Cafeteria Manager Dashboard",
    subtitle: "Empty control center for cafeteria operations, staff, sales, and reports.",
    route: roleHome["cafeteria-manager"],
    icon: Store,
  },
  "fb-controller": {
    key: "fb-controller",
    roleName: "F & B Controller",
    title: "F & B Controller Dashboard",
    subtitle: "Empty dashboard for menu costing, inventory control, recipes, and stock reports.",
    route: roleHome["fb-controller"],
    icon: ClipboardList,
  },
  "finance-manager": {
    key: "finance-manager",
    roleName: "Finance Manager",
    title: "Finance Manager Dashboard",
    subtitle: "Empty dashboard for payments, shifts, settlement, and finance reports.",
    route: roleHome["finance-manager"],
    icon: BarChart3,
  },
  "stock-keeper": {
    key: "stock-keeper",
    roleName: "Stock Keeper",
    title: "Stock Keeper Dashboard",
    subtitle: "Empty dashboard for receiving, stock balances, movement, and low-stock alerts.",
    route: roleHome["stock-keeper"],
    icon: Warehouse,
  },
  purchaser: {
    key: "purchaser",
    roleName: "Purchaser",
    title: "Purchaser Dashboard",
    subtitle: "Empty dashboard for suppliers, purchase orders, receiving, and procurement tracking.",
    route: roleHome.purchaser,
    icon: Truck,
  },
  cashier: {
    key: "cashier",
    roleName: "Cashier",
    title: "Cashier Dashboard",
    subtitle: "Empty dashboard for POS orders, payments, receipts, and cash shifts.",
    route: roleHome.cashier,
    icon: CreditCard,
  },
  "kitchen-staff": {
    key: "kitchen-staff",
    roleName: "Kitchen Staff",
    title: "Kitchen Staff Dashboard",
    subtitle: "Empty dashboard for kitchen tickets, preparation status, and ready orders.",
    route: roleHome["kitchen-staff"],
    icon: Coffee,
  },
  barman: {
    key: "barman",
    roleName: "Barman",
    title: "Barman Dashboard",
    subtitle: "Empty dashboard for bar tickets, drink preparation, and ready orders.",
    route: roleHome.barman,
    icon: Wine,
  },
  waiter: {
    key: "waiter",
    roleName: "Waiter",
    title: "Waiter Dashboard",
    subtitle: "Empty dashboard for table service, customer orders, and served items.",
    route: roleHome.waiter,
    icon: Users,
  },
  customer: {
    key: "customer",
    roleName: "Customer",
    title: "Customer Dashboard",
    subtitle: "Empty dashboard for public menu, orders, bills, and payment status.",
    route: roleHome.customer,
    icon: ShoppingCart,
  },
};

export const dashboardList = Object.values(dashboardConfig);

export function normalizeRole(role?: string | null): AppRoleKey {
  const value = String(role ?? "").toLowerCase().replace(/&/g, "and").replace(/_/g, " ").replace(/-/g, " ").trim();
  if (value.includes("f") && value.includes("b") && value.includes("controller")) return "fb-controller";
  if (value.includes("finance")) return "finance-manager";
  if (value.includes("stock") || value.includes("store keeper") || value.includes("storekeeper")) return "stock-keeper";
  if (value.includes("purchase") || value.includes("purchaser")) return "purchaser";
  if (value.includes("cashier")) return "cashier";
  if (value.includes("kitchen")) return "kitchen-staff";
  if (value.includes("bar") || value.includes("barman")) return "barman";
  if (value.includes("waiter")) return "waiter";
  if (value.includes("customer")) return "customer";
  return "cafeteria-manager";
}

export function getDashboardForRole(role?: string | null) {
  return dashboardConfig[normalizeRole(role)];
}
