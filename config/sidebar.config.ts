import {
  BarChart3,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
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

const roleMenu = (label: string, icon: LucideIcon, children: SidebarChildItem[]): SidebarItem => ({
  label,
  icon,
  children,
});

const roleSidebar = (
  role: AppRoleKey,
  icon: LucideIcon,
  menuIcon: LucideIcon,
  children: SidebarChildItem[],
): RoleSidebar => ({
  title: dashboardConfig[role].roleName,
  icon,
  sections: [
    s("Main", [dashboardItem(role)]),
    s("Menu", [roleMenu(`${dashboardConfig[role].roleName} Menu`, menuIcon, children)]),
  ],
});

const orderBase = "/dashboard/order-management";

export const sidebarConfig: Record<AppRoleKey, RoleSidebar> = {
  "cafeteria-manager": roleSidebar("cafeteria-manager", Store, Store, [
    { label: "Users", href: "/dashboard/users", permission: "users.read" },
    { label: "Audit Logs", href: "/dashboard/audit-logs", permission: "audit.read" },
    { label: "Menu Management", href: "/dashboard/modules/menu", permission: "menu.read" },
    { label: "Table Management", href: "/dashboard/modules/tables", permission: "tables.read" },
    { label: "All Orders", href: `${orderBase}/orders`, permission: "orders.read" },
    { label: "Create Order", href: `${orderBase}/orders/create`, permission: "orders.create" },
    { label: "Credit Orders", href: `${orderBase}/credit-orders` },
    { label: "Credit Accounts", href: `${orderBase}/credit-accounts` },
    { label: "Catering Packages", href: `${orderBase}/catering/packages`, permission: "packages.read" },
    { label: "Package Orders", href: `${orderBase}/catering/package-orders`, permission: "package.orders.read" },
    { label: "Reports", href: "/dashboard/modules/reports", permission: "reports.inventory.read" },
    { label: "Inventory Overview", href: "/dashboard/inventory/overview", permission: "inventory.read" },
    { label: "Purchase Requests", href: "/dashboard/purchases/requests", permission: "purchase_orders.approve" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
    { label: "Settings", href: "/dashboard/modules/settings" },
  ]),

  "fb-controller": roleSidebar("fb-controller", ClipboardList, ClipboardList, [
    { label: "Menu Management", href: "/dashboard/modules/menu", permission: "menu.read" },
    { label: "Inventory Items", href: "/dashboard/inventory/items", permission: "inventory.read" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
  ]),

  "finance-manager": roleSidebar("finance-manager", BarChart3, BarChart3, [
    { label: "Payments", href: "/dashboard/modules/payments", permission: "payments.read" },
    { label: "Bills", href: "/dashboard/modules/bills", permission: "bills.read" },
    { label: "Cash Shifts", href: "/dashboard/modules/cash-shifts", permission: "cash_shift.read" },
    { label: "Finance Reports", href: "/dashboard/modules/reports/finance", permission: "reports.financial.read" },
    { label: "Credit Orders", href: `${orderBase}/credit-orders` },
    { label: "Credit Accounts", href: `${orderBase}/credit-accounts` },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
  ]),

  "stock-keeper": roleSidebar("stock-keeper", Warehouse, Warehouse, [
    { label: "Inventory Items", href: "/dashboard/inventory/items", permission: "inventory.read" },
    { label: "Receive Ordered Items", href: "/dashboard/purchases/receiving", permission: "stock.receive" },
    { label: "Adjustments", href: "/dashboard/inventory/adjustments", permission: "inventory.adjustments.create" },
    { label: "Waste / Damage", href: "/dashboard/inventory/waste", permission: "inventory.waste.create" },
    { label: "Stock Movements", href: "/dashboard/inventory/movements", permission: "inventory.movements.read" },
    { label: "Batches", href: "/dashboard/inventory/batches", permission: "inventory.batches.read" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
  ]),

  purchaser: roleSidebar("purchaser", Truck, Truck, [
    { label: "Suppliers", href: "/dashboard/purchases/suppliers", permission: "suppliers.read" },
    { label: "Purchase Requests", href: "/dashboard/purchases/requests", permission: "purchase_orders.read" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
  ]),

  cashier: roleSidebar("cashier", CreditCard, CreditCard, [
    { label: "POS Orders", href: `${orderBase}/pos/orders` },
    { label: "Create POS Order", href: `${orderBase}/pos/orders/create` },
    { label: "All Orders", href: `${orderBase}/orders` },
    { label: "Ordered Items", href: `${orderBase}/orders/sold-items` },
    { label: "Bills", href: "/dashboard/modules/bills" },
    { label: "Payments", href: "/dashboard/modules/cashier/payments" },
    { label: "Receipts", href: "/dashboard/modules/cashier/receipts" },
    { label: "Credit Orders", href: `${orderBase}/credit-orders` },
    { label: "Credit Accounts", href: `${orderBase}/credit-accounts` },
    { label: "Shift Report", href: "/dashboard/modules/cashier/shift" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
  ]),

  "kitchen-staff": roleSidebar("kitchen-staff", ChefHat, ChefHat, [
    { label: "Kitchen Tickets", href: "/dashboard/modules/kitchen/tickets" },
    { label: "Preparing", href: "/dashboard/modules/kitchen/preparing" },
    { label: "Ready Orders", href: "/dashboard/modules/kitchen/ready" },
    { label: "Served Items", href: "/dashboard/modules/kitchen/served" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
  ]),

  barman: roleSidebar("barman", Wine, Wine, [
    { label: "Bar Tickets", href: "/dashboard/modules/bar/tickets" },
    { label: "Preparing Drinks", href: "/dashboard/modules/bar/preparing" },
    { label: "Ready Drinks", href: "/dashboard/modules/bar/ready" },
    { label: "Served Drinks", href: "/dashboard/modules/bar/served" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
  ]),

  waiter: roleSidebar("waiter", Users, Users, [
    { label: "Tables", href: "/dashboard/modules/waiter/tables" },
    { label: "Menu", href: "/dashboard/modules/waiter/menu" },
    { label: "My Orders", href: `${orderBase}/orders` },
    { label: "Create Order", href: `${orderBase}/orders/create` },
    { label: "Ordered Items", href: `${orderBase}/orders/sold-items` },
    { label: "Confirmed Orders", href: "/dashboard/modules/waiter/confirmed" },
    { label: "Ready Orders", href: "/dashboard/modules/waiter/ready" },
    { label: "Served Orders", href: "/dashboard/modules/waiter/served" },
    { label: "Cancelable Orders", href: "/dashboard/modules/waiter/cancelable" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
  ]),

  customer: roleSidebar("customer", Users, ShoppingCart, [
    { label: "Public Menu", href: "/dashboard/modules/public/menu" },
    { label: "My Orders", href: "/dashboard/modules/customer/orders" },
    { label: "My Bills", href: "/dashboard/modules/customer/bills" },
    { label: "Notifications", href: "/dashboard/modules/notifications" },
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
        .map((item) => {
          const children = item.children?.filter((child) => !child.permission || permissions.includes(child.permission));

          if (item.children) {
            return children?.length ? { ...item, children } : null;
          }

          return !item.permission || permissions.includes(item.permission) ? item : null;
        })
        .filter(Boolean) as SidebarItem[],
    }))
    .filter((section) => section.items.length > 0);
}
