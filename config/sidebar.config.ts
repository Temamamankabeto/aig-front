import {
  BarChart3,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Warehouse,
  Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { dashboardConfig, normalizeRole, type AppRoleKey } from "@/config/dashboard.config";

export type SidebarChildItem = {
  label: string;
  href: string;
  permission?: string;
};

export type SidebarItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  permission?: string;
  children?: SidebarChildItem[];
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export type RoleSidebar = {
  title: string;
  icon: LucideIcon;
  sections: SidebarSection[];
};

const s = (title: string, items: SidebarItem[]): SidebarSection => ({ title, items });

const dashboardItem = (role: AppRoleKey): SidebarItem => ({
  label: "Dashboard",
  href: dashboardConfig[role].route,
  icon: LayoutDashboard,
});

const item = (label: string, href: string, icon: LucideIcon): SidebarItem => ({
  label,
  href,
  icon,
});

const group = (label: string, icon: LucideIcon, children: SidebarChildItem[]): SidebarItem => ({
  label,
  icon,
  children,
});

const roleSidebar = (
  role: AppRoleKey,
  icon: LucideIcon,
  menuItems: SidebarItem[],
  includeDashboard = true,
): RoleSidebar => ({
  title: dashboardConfig[role].roleName,
  icon,
  sections: [
    ...(includeDashboard ? [s("Main", [dashboardItem(role)])] : []),
    s("Menu", menuItems),
  ],
});

const orderBase = "/dashboard/order-management";

const cashCreditReportChildren: SidebarChildItem[] = [
  { label: "Cash Sales", href: "/dashboard/modules/reports/cash-sales" },
  { label: "Credit Sales", href: "/dashboard/modules/reports/credit-sales" },
];

export const sidebarConfig: Record<AppRoleKey, RoleSidebar> = {
  "cafeteria-manager": roleSidebar("cafeteria-manager", Store, [
    item("Users", "/dashboard/users", Users),
    item("Table Management", "/dashboard/modules/tables", Store),
    item("Credit Account", `${orderBase}/credit-accounts`, CreditCard),
    item("Purchase Request", "/dashboard/purchases/requests", Truck),
    item("Order List", `${orderBase}/orders`, ShoppingCart),
    group("Report", BarChart3, cashCreditReportChildren),
    group("Setting", Settings, [{ label: "Audit Log", href: "/dashboard/audit-logs" }]),
  ]),

  "fb-controller": roleSidebar("fb-controller", ClipboardList, [
    item("Menu Management", "/dashboard/modules/menu", ClipboardList),
    item("Inventory Items", "/dashboard/inventory/items", Warehouse),
    group("Report", BarChart3, cashCreditReportChildren),
  ]),

  "finance-manager": roleSidebar("finance-manager", BarChart3, [
    group("Report", BarChart3, cashCreditReportChildren),
  ]),

  "stock-keeper": roleSidebar("stock-keeper", Warehouse, [
    item("Request Purchase", "/dashboard/purchases/requests", Truck),
    item("Inventory Items", "/dashboard/inventory/items", Warehouse),
    item("Record Stockout", "/dashboard/inventory/stockout", ClipboardList),
  ]),

  purchaser: roleSidebar("purchaser", Truck, [
    item("Purchase Request", "/dashboard/purchases/requests", Truck),
  ]),

  cashier: roleSidebar(
    "cashier",
    CreditCard,
    [
      item("Orders", `${orderBase}/pos/orders`, ShoppingCart),
      item("Sales", "/dashboard/order-management/orders/sold-items", BarChart3),
    ],
    false,
  ),

  waiter: roleSidebar(
    "waiter",
    Users,
    [item("My Orders", `${orderBase}/orders`, ShoppingCart)],
    false,
  ),

  "kitchen-staff": roleSidebar("kitchen-staff", ChefHat, [
    item("Kitchen Order", "/dashboard/modules/kitchen/tickets", ChefHat),
  ]),

  barman: roleSidebar("barman", Wine, [
    item("Bar Order", "/dashboard/modules/bar/tickets", Wine),
  ]),

  customer: roleSidebar("customer", Users, [
    item("Public Menu", "/dashboard/modules/public/menu", ShoppingCart),
    item("My Orders", "/dashboard/modules/customer/orders", ShoppingCart),
  ]),
};

export function getSidebarForRole(role?: string | null): RoleSidebar {
  return sidebarConfig[normalizeRole(role)];
}

export function filterSidebarByPermissions(roleSidebar: RoleSidebar, permissions: string[] = []) {
  return roleSidebar.sections
    .map((section) => ({
      ...section,
      items: section.items
        .map((sidebarItem) => {
          const children = sidebarItem.children?.filter((child) => !child.permission || permissions.includes(child.permission));

          if (sidebarItem.children) {
            return children?.length ? { ...sidebarItem, children } : null;
          }

          return !sidebarItem.permission || permissions.includes(sidebarItem.permission) ? sidebarItem : null;
        })
        .filter(Boolean) as SidebarItem[],
    }))
    .filter((section) => section.items.length > 0);
}
