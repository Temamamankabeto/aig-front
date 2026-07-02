"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { printCustomerOrderTicket, printOrderBill as printOrderBillDocument } from "@/components/order-management/order-print-utils";
import { useMenuItemsQuery } from "@/hooks/queries/menu-management";
import { useTablesQuery } from "@/hooks/queries/table-management";
import {
  useCreditAccountsQuery,
  useCreditOrdersQuery,
  useOrderQuery,
  useOrdersQuery,
  usePrepTicketsQuery,
  useWaitersLiteQuery,
} from "@/hooks/queries/order-management";
import {
  useApproveCreditOrderMutation,
  useConfirmOrderMutation,
  useCreateCreditAccountMutation,
  useUpdateCreditAccountMutation,
  useToggleCreditAccountMutation,
  useCreateOrderMutation,
  useRequestCancelOrderMutation,
  useServeOrderMutation,
  useSettleCreditOrderMutation,
  usePrepTicketActionMutation,
  useAddOrderItemMutation,
  useUpdateOrderItemMutation,
  useRemoveOrderItemMutation,
  usePrintOrderBillMutation,
  useRecordBillPaymentMutation,
  useConvertBillToCreditMutation,
} from "@/hooks/mutations/order-management";
import type {
  CreditAccount,
  CreditOrder,
  Order,
  OrderItemPayload,
} from "@/types/order-management";

type Scope = "admin" | "waiter" | "cashier";
type Period = "today" | "this_week" | "this_month" | "this_year" | "custom";

function money(v: unknown) {
  return Number(v ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function activeAgreements(account?: CreditAccount | null): any[] {
  const value = account as any;
  if (Array.isArray(value?.active_agreements)) return value.active_agreements;
  if (Array.isArray(value?.activeAgreements)) return value.activeAgreements;
  if (Array.isArray(value?.agreements)) {
    const today = new Date().toISOString().slice(0, 10);
    return value.agreements.filter((agreement: any) => String(agreement.status ?? "active") === "active" && String(agreement.start_date ?? "").slice(0, 10) <= today && String(agreement.end_date ?? "").slice(0, 10) >= today);
  }
  return [];
}

function date(v?: string) {
  return v ? new Date(v).toLocaleString() : "—";
}

function isInsideCustomDateRange(
  value: unknown,
  filters: { period?: Period; date_from?: string; date_to?: string },
) {
  if (filters.period !== "custom") return true;
  if (!filters.date_from && !filters.date_to) return true;
  if (!value) return false;

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return false;

  const day = parsed.toISOString().slice(0, 10);
  if (filters.date_from && day < filters.date_from) return false;
  if (filters.date_to && day > filters.date_to) return false;
  return true;
}

function imageUrlFromMenu(item: any) {
  const raw =
    item?.image_url ||
    item?.image_path ||
    item?.image ||
    item?.photo_url ||
    item?.photo ||
    item?.menu_item?.image_url ||
    item?.menu_item?.image_path ||
    item?.menuItem?.image_url ||
    item?.menuItem?.image_path ||
    "";
  if (!raw) return "";
  if (String(raw).startsWith("http")) return String(raw);
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  const cleaned = String(raw).replace(/^\//, "");
  return base ? `${base}/${cleaned}` : `/${cleaned}`;
}

function statusVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (
    [
      "completed",
      "served",
      "ready",
      "credit_approved",
      "fully_settled",
      "paid",
    ].includes(status ?? "")
  )
    return "default";
  if (
    ["cancelled", "blocked", "overdue", "void", "failed"].includes(status ?? "")
  )
    return "destructive";
  if (
    [
      "pending",
      "confirmed",
      "credit_pending",
      "partially_settled",
      "partial",
      "issued",
    ].includes(status ?? "")
  )
    return "secondary";
  return "outline";
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <Badge variant={statusVariant(status ?? undefined)} className="capitalize">
      {(status ?? "unknown").replace(/_/g, " ")}
    </Badge>
  );
}

function lineItemsCount(order: Order) {
  return order.items?.length ?? order.order_items?.length ?? 0;
}

function normalizeOrderResponse(data: unknown): Order | undefined {
  const value = data as any;
  return value?.data?.order ?? value?.data ?? value?.order ?? value;
}

function normalizeOrderItems(order?: Order) {
  const value = order as any;
  return (
    value?.items ??
    value?.order_items ??
    value?.data?.items ??
    value?.data?.order_items ??
    []
  );
}

function canConfirmOrder(status?: string | null) {
  return ["pending"].includes(String(status ?? "").toLowerCase());
}

function canServeOrder(status?: string | null) {
  return ["ready"].includes(String(status ?? "").toLowerCase());
}

function canRequestCancelOrder(status?: string | null) {
  return ["pending", "confirmed", "in_progress", "ready"].includes(
    String(status ?? "").toLowerCase(),
  );
}

export function OrdersPage({
  scope = "admin",
  title = "Orders",
  createHref = "/dashboard/order-management/orders/create",
}: {
  scope?: Scope;
  title?: string;
  createHref?: string;
}) {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 10,
    search: "",
    status: "all",
    order_type: "all",
    payment_status: "all",
    payment_type: "all",
    period: "today" as Period,
    date_from: "",
    date_to: "",
  });

  const query = useOrdersQuery(
    filters,
    scope === "cashier" ? "cashier" : scope === "waiter" ? "waiter" : "admin",
  );
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const report = (meta as any)?.report;
  const filteredRows = useMemo(
    () => rows.filter((order: Order) => isInsideCustomDateRange((order as any).created_at ?? (order as any).createdAt, filters)),
    [rows, filters.period, filters.date_from, filters.date_to],
  );

  const confirm = useConfirmOrderMutation();
  const serve = useServeOrderMutation();
  const cancel = useRequestCancelOrderMutation();

  const totals = useMemo(
    () => ({
      total: report?.total_orders ?? filteredRows.length,
      totalCost:
        report?.total_cost ??
        filteredRows.reduce(
          (sum, order) => sum + Number(order.total ?? order.total_amount ?? 0),
          0,
        ),
      confirmed: filteredRows.filter((o) => o.status === "confirmed").length,
      ready: filteredRows.filter((o) => o.status === "ready").length,
    }),
    [filteredRows, report],
  );

  const updateFilter = (patch: Partial<typeof filters>) =>
    setFilters((current) => ({ ...current, ...patch, page: 1 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            Create, track, confirm, serve, and cancel restaurant orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/order-management/orders/sold-items">See ordered items</Link>
          </Button>
          <Button asChild>
            <Link href={createHref}>
              <Plus className="mr-2 h-4 w-4" />
              New order
            </Link>
          </Button>
        </div>
      </div>

      {scope !== "cashier" && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription>Total orders</CardDescription>
              <CardTitle>{totals.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription>Confirmed</CardDescription>
              <CardTitle>{totals.confirmed}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription>Ready</CardDescription>
              <CardTitle>{totals.ready}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription>Total cost</CardDescription>
              <CardTitle>{money(totals.totalCost)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Order list and report</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 md:w-72"
                placeholder="Search order/customer"
                value={filters.search}
                onChange={(e) => updateFilter({ search: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            <Select
              value={filters.period}
              onValueChange={(period: Period) => updateFilter({ period })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This week</SelectItem>
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="this_year">This year</SelectItem>
                <SelectItem value="custom">Custom interval</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(status) => updateFilter({ status })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order status" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "all",
                  "confirmed",
                  "in_progress",
                  "ready",
                  "served",
                  "completed",
                  "cancel_requested",
                  "cancelled",
                ].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.order_type}
              onValueChange={(order_type) => updateFilter({ order_type })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="dine_in">Dine in</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.payment_status}
              onValueChange={(payment_status) =>
                updateFilter({ payment_status })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment status</SelectItem>
                <SelectItem value="issued">Unpaid / issued</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="credit">Credit pending</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.payment_type}
              onValueChange={(payment_type) =>
                updateFilter({ payment_type })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment types</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>

            {filters.period === "custom" && (
              <>
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => updateFilter({ date_from: e.target.value })}
                />
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => updateFilter({ date_to: e.target.value })}
                />
              </>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order number</TableHead>
                  <TableHead>Order type</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Waiter name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment status</TableHead>
                  <TableHead>Cost per order</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length ? (
                  filteredRows.map((order: Order) => {
                    const detailHref = scope === "cashier"
                      ? `/dashboard/order-management/pos/orders/${order.id}`
                      : `/dashboard/order-management/orders/${order.id}`;
                    const waiterName =
                      (order as any).waiter?.name ??
                      (order as any).waiter_name ??
                      (order as any).assigned_waiter?.name ??
                      (order as any).created_by?.name ??
                      (order as any).creator?.name ??
                      "—";

                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link href={detailHref} className="font-medium hover:underline">
                            {order.order_number ?? `#${order.id}`}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {lineItemsCount(order)} items
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {String((order as any).order_type ?? "—").replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          {order.table?.table_number ?? order.table?.name ?? "No table"}
                        </TableCell>
                        <TableCell>{waiterName}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.bill?.status ?? (order as any).payment_status ?? "issued"} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {money(order.total ?? order.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Open order actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={detailHref}>Detail</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={(meta?.current_page ?? 1) <= 1}
                onClick={() =>
                  setFilters({
                    ...filters,
                    page: Math.max(1, filters.page - 1),
                  })
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)}
                onClick={() =>
                  setFilters({ ...filters, page: filters.page + 1 })
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SoldItemsReportPage({ scope = "waiter" }: { scope?: Scope }) {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 50,
    search: "",
    status: "all",
    order_type: "all",
    payment_status: "all",
    payment_type: "all",
    period: "today" as Period,
    date_from: "",
    date_to: "",
  });

  const query = useOrdersQuery(
    filters,
    scope === "cashier" ? "cashier" : scope === "waiter" ? "waiter" : "admin",
  );
  const orders = query.data?.data ?? [];
  const meta = query.data?.meta;

  const rows = useMemo(() => {
    return orders
      .flatMap((order: Order) => {
        const bill = (order as any).bill ?? (order as any).billing ?? null;
        const paymentStatus = bill?.status ?? (order as any).payment_status ?? "issued";
        return normalizeOrderItems(order).map((item: any) => {
          const menu = item.menu_item ?? item.menuItem ?? item.menu ?? {};
          const qty = Number(item.quantity ?? 0);
          const unit = Number(item.unit_price ?? item.price ?? menu.price ?? 0);
          return {
            key: `${order.id}-${item.id ?? item.menu_item_id ?? menu.id ?? Math.random()}`,
            orderId: order.id,
            orderNumber: order.order_number ?? `#${order.id}`,
            orderType: order.order_type ?? "—",
            paymentStatus,
            orderStatus: order.status,
            createdAt: (order as any).created_at ?? (order as any).createdAt,
            itemName: menu.name ?? item.name ?? item.menu_item_name ?? item.menu_item_id ?? "Menu item",
            image: imageUrlFromMenu(menu || item),
            qty,
            unit,
            total: Number(item.total_price ?? item.line_total ?? qty * unit),
          };
        });
      })
      .filter((row) => isInsideCustomDateRange(row.createdAt, filters));
  }, [orders, filters.period, filters.date_from, filters.date_to]);

  const totals = useMemo(
    () => ({
      quantity: rows.reduce((sum, row) => sum + row.qty, 0),
      total: rows.reduce((sum, row) => sum + row.total, 0),
      paid: rows.filter((row) => String(row.paymentStatus).toLowerCase() === "paid").length,
      unpaid: rows.filter((row) => String(row.paymentStatus).toLowerCase() !== "paid").length,
    }),
    [rows],
  );

  const updateFilter = (patch: Partial<typeof filters>) =>
    setFilters((current) => ({ ...current, ...patch, page: 1 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ordered items report</h1>
          <p className="text-muted-foreground">
            View sold/ordered menu items by today, week, month, year, or custom date interval.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/order-management/orders">See orders</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/order-management/orders/create">
              <Plus className="mr-2 h-4 w-4" />
              New order
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Total item rows</CardDescription>
            <CardTitle>{rows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Total quantity</CardDescription>
            <CardTitle>{totals.quantity}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Total cost</CardDescription>
            <CardTitle>{money(totals.total)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Paid / not paid</CardDescription>
            <CardTitle>{totals.paid} / {totals.unpaid}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Ordered item list</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 md:w-72"
                placeholder="Search order/item/customer"
                value={filters.search}
                onChange={(e) => updateFilter({ search: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            <Select value={filters.period} onValueChange={(period: Period) => updateFilter({ period })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This week</SelectItem>
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="this_year">This year</SelectItem>
                <SelectItem value="custom">Custom interval</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(status) => updateFilter({ status })}>
              <SelectTrigger><SelectValue placeholder="Order status" /></SelectTrigger>
              <SelectContent>
                {["all", "confirmed", "in_progress", "ready", "served", "completed", "cancel_requested", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.order_type} onValueChange={(order_type) => updateFilter({ order_type })}>
              <SelectTrigger><SelectValue placeholder="Order type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="dine_in">Dine in</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.payment_status} onValueChange={(payment_status) => updateFilter({ payment_status })}>
              <SelectTrigger><SelectValue placeholder="Payment status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment status</SelectItem>
                <SelectItem value="issued">Not paid / issued</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="credit">Credit pending</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.payment_type} onValueChange={(payment_type) => updateFilter({ payment_type })}>
              <SelectTrigger><SelectValue placeholder="Payment filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment types</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>

            {filters.period === "custom" && (
              <>
                <Input type="date" value={filters.date_from} onChange={(e) => updateFilter({ date_from: e.target.value })} />
                <Input type="date" value={filters.date_to} onChange={(e) => updateFilter({ date_to: e.target.value })} />
              </>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order number</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Payment status</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total price</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading ordered items...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <Link className="font-medium hover:underline" href={`/dashboard/order-management/orders/${row.orderId}`}>
                          {row.orderNumber}
                        </Link>
                        <div className="mt-1"><StatusBadge status={row.orderStatus} /></div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                            {row.image ? (
                              <img src={row.image} alt={row.itemName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">No image</div>
                            )}
                          </div>
                          <span className="font-medium">{row.itemName}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={String(row.paymentStatus).toLowerCase() === "paid" ? "paid" : "credit"} /></TableCell>
                      <TableCell>{row.qty}</TableCell>
                      <TableCell>{money(row.unit)}</TableCell>
                      <TableCell className="font-medium">{money(row.total)}</TableCell>
                      <TableCell>{date(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No ordered items found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={(meta?.current_page ?? 1) <= 1} onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}>Previous</Button>
              <Button variant="outline" disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CreateOrderPage({
  scope = "waiter",
  title = "Create order",
}: {
  scope?: "waiter" | "cashier";
  title?: string;
}) {
  const initialPayload = {
    table_id: "",
    waiter_id: "",
    order_type: scope === "cashier" ? "takeaway" : "dine_in",
    payment_type: "cash",
    credit_account_id: "",
    credit_notes: "",
    notes: "",
  };
  const [payload, setPayload] = useState(initialPayload);
  const [items, setItems] = useState<OrderItemPayload[]>([]);
  const [menuSearch, setMenuSearch] = useState("");

  const menuQuery = useMenuItemsQuery(
    {
      per_page: 200,
      available: 1,
      is_available: 1,
      active: 1,
      is_active: 1,
      search: menuSearch,
    },
    scope === "cashier" ? "cashier" : "waiter",
  );
  const tablesQuery = useTablesQuery(
    { per_page: 100, status: "available", is_active: 1 },
    scope === "cashier" ? "cashier" : "waiter",
  );
  const waitersQuery = useWaitersLiteQuery();
  const creditAccountsQuery = useCreditAccountsQuery({ per_page: 100, status: "active" });
  const create = useCreateOrderMutation(scope, () => {
    setItems([]);
    setPayload(initialPayload);
  });

  const menuItems = menuQuery.data?.data ?? [];
  const tables = tablesQuery.data?.data ?? [];
  const waiters = waitersQuery.data ?? [];
  const creditAccounts = creditAccountsQuery.data?.data ?? [];
  const isCredit = scope === "cashier" && payload.payment_type === "credit";
  const selectedCreditAccount = creditAccounts.find((account) => String(account.id) === String(payload.credit_account_id));
  const selectedActiveAgreements = activeAgreements(selectedCreditAccount);
  const selectedAgreement = selectedActiveAgreements[0];
  const hasActiveAgreement = !isCredit || Boolean(selectedAgreement);
  const needsTable = payload.order_type === "dine_in";

  const total = items.reduce((sum, item) => {
    const menu = menuItems.find(
      (m) => String(m.id) === String(item.menu_item_id),
    );
    return sum + Number(menu?.price ?? 0) * item.quantity;
  }, 0);

  const canSubmit =
    items.length > 0 &&
    (!needsTable || Boolean(payload.table_id)) &&
    (scope !== "cashier" || Boolean(payload.waiter_id)) &&
    (!isCredit || (Boolean(payload.credit_account_id) && hasActiveAgreement));

  function menuImage(item: any) {
    const raw =
      item.image_url ||
      item.image_path ||
      item.image ||
      item.photo_url ||
      item.photo ||
      "";
    if (!raw) return "";
    if (String(raw).startsWith("http")) return String(raw);
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "")
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");
    const cleaned = String(raw).replace(/^\//, "");
    return base ? `${base}/${cleaned}` : `/${cleaned}`;
  }

  function addItem(id: string | number) {
    const exists = items.find((i) => String(i.menu_item_id) === String(id));
    setItems(
      exists
        ? items.map((i) =>
            String(i.menu_item_id) === String(id)
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...items, { menu_item_id: id, quantity: 1 }],
    );
  }

  function updateQty(id: string | number, quantity: number) {
    setItems(
      items.map((item) =>
        String(item.menu_item_id) === String(id)
          ? { ...item, quantity: Math.max(1, quantity || 1) }
          : item,
      ),
    );
  }

  function removeItem(id: string | number) {
    setItems(items.filter((item) => String(item.menu_item_id) !== String(id)));
  }

  function submit() {
    create.mutate({
      order_type: payload.order_type as "dine_in" | "takeaway",
      table_id: needsTable ? payload.table_id : null,
      waiter_id: scope === "cashier" ? payload.waiter_id : undefined,
      payment_type: isCredit ? "credit" : "cash",
      credit_account_id: isCredit ? payload.credit_account_id : undefined,
      credit_notes: isCredit ? payload.credit_notes || payload.notes || undefined : undefined,
      notes: payload.notes,
      items,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          {scope === "cashier"
            ? "Cashier can create dine-in or takeaway orders, select the responsible waiter, and create credit orders only when the account has an active agreement."
            : "Waiter orders support dine-in and takeaway only. Payment is recorded later by the cashier."}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Order information</CardTitle>
              <CardDescription>
                {scope === "cashier"
                  ? "Select waiter and credit account only when this order is sold on credit."
                  : "No customer name, phone, or payment type is required during order creation."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Order type</Label>
                <Select
                  value={payload.order_type}
                  onValueChange={(order_type) =>
                    setPayload({
                      ...payload,
                      order_type,
                      table_id:
                        order_type === "dine_in" ? payload.table_id : "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine_in">Dine in</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scope === "cashier" && (
                <div className="grid gap-2">
                  <Label>Responsible waiter</Label>
                  <Select value={payload.waiter_id || undefined} onValueChange={(waiter_id) => setPayload({ ...payload, waiter_id })}>
                    <SelectTrigger><SelectValue placeholder={waitersQuery.isLoading ? "Loading waiters..." : "Choose waiter"} /></SelectTrigger>
                    <SelectContent>
                      {waiters.length ? waiters.map((waiter) => (
                        <SelectItem key={waiter.id} value={String(waiter.id)}>{waiter.name ?? waiter.email ?? `Waiter ${waiter.id}`}</SelectItem>
                      )) : <SelectItem value="no-waiters" disabled>No waiter users found</SelectItem>}
                    </SelectContent>
                  </Select>
                  {waitersQuery.isError && <p className="text-xs text-destructive">Could not load waiters. Check /cashier/waiters-lite permission.</p>}
                </div>
              )}

              {needsTable && (
                <div className="grid gap-2">
                  <Label>Table</Label>
                  <Select
                    value={payload.table_id || undefined}
                    onValueChange={(table_id) =>
                      setPayload({ ...payload, table_id })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          tablesQuery.isLoading
                            ? "Loading tables..."
                            : needsTable
                              ? "Choose table"
                              : "Not required"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.length ? (
                        tables.map((table) => (
                          <SelectItem key={table.id} value={String(table.id)}>
                            {table.table_number ??
                              table.name ??
                              `Table ${table.id}`}
                            {table.capacity ? ` • ${table.capacity} seats` : ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-tables" disabled>
                          No available tables found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {tablesQuery.isError && (
                    <p className="text-xs text-destructive">
                      Could not load tables. Check waiter table permission.
                    </p>
                  )}
                </div>
              )}

              {scope === "cashier" && (
                <>
                  <div className="grid gap-2">
                    <Label>Payment type</Label>
                    <Select value={payload.payment_type} onValueChange={(payment_type) => setPayload({ ...payload, payment_type, credit_account_id: payment_type === "credit" ? payload.credit_account_id : "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isCredit && (
                    <div className="grid gap-2">
                      <Label>Credit account</Label>
                      <Select value={payload.credit_account_id || undefined} onValueChange={(credit_account_id) => setPayload({ ...payload, credit_account_id })}>
                        <SelectTrigger><SelectValue placeholder={creditAccountsQuery.isLoading ? "Loading credit accounts..." : "Choose credit account"} /></SelectTrigger>
                        <SelectContent>
                          {creditAccounts.length ? creditAccounts.map((account) => {
                            const activeAgreementCount = activeAgreements(account).length;
                            return (
                              <SelectItem key={account.id} value={String(account.id)}>
                                {account.name} • {account.account_type === "single" ? "Single" : "Bulky"} • {activeAgreementCount ? `${activeAgreementCount} active agreement` : "No active agreement"}
                              </SelectItem>
                            );
                          }) : <SelectItem value="no-credit-accounts" disabled>No active credit accounts found</SelectItem>}
                        </SelectContent>
                      </Select>
                      {selectedCreditAccount && (
                        <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                          <div className="flex justify-between"><span>Active agreement</span><strong>{selectedAgreement?.meal_type ?? "Not available"}</strong></div>
                          <div className="flex justify-between"><span>Agreement date</span><strong>{selectedAgreement ? `${String(selectedAgreement.start_date).slice(0, 10)} → ${String(selectedAgreement.end_date).slice(0, 10)}` : "—"}</strong></div>
                          <div className="flex justify-between"><span>Current cart total</span><strong>{money(total)}</strong></div>
                        </div>
                      )}
                      {isCredit && selectedCreditAccount && !selectedAgreement && (
                        <p className="text-xs text-destructive">Credit order is not allowed because this account has no active agreement.</p>
                      )}
                      {creditAccountsQuery.isError && <p className="text-xs text-destructive">Could not load credit accounts. Check credit.accounts.read permission.</p>}
                    </div>
                  )}

                </>
              )}

              <div className="grid gap-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={payload.notes}
                  onChange={(e) =>
                    setPayload({ ...payload, notes: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Menu items</CardTitle>
              <CardDescription>
                All available food and drink items are displayed as cards with
                images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search food or drink"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
              </div>
              {menuQuery.isError && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  Could not load menu items. Check waiter/cashier menu
                  permissions.
                </p>
              )}
              {menuQuery.isLoading ? (
                <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
                  Loading menu items...
                </p>
              ) : menuItems.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {menuItems.map((m) => {
                    const selected = items.find(
                      (item) => String(item.menu_item_id) === String(m.id),
                    );
                    const image = menuImage(m);
                    return (
                      <Card key={m.id} className="overflow-hidden rounded-2xl">
                        <div className="aspect-[4/3] bg-muted">
                          {image ? (
                            <img
                              src={image}
                              alt={m.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <CardContent className="space-y-3 p-4">
                          <div>
                            <div className="line-clamp-1 font-semibold">
                              {m.name}
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-sm text-muted-foreground">
                              <span className="capitalize">
                                {m.type ?? "menu"}
                              </span>
                              <span className="font-medium text-foreground">
                                {money(m.price)}
                              </span>
                            </div>
                            {m.description && (
                              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                {m.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            className="w-full"
                            variant={selected ? "secondary" : "default"}
                            onClick={() => addItem(m.id)}
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {selected
                              ? `Add more (${selected.quantity})`
                              : "Add to cart"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No menu items found.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-2xl xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </CardTitle>
            <CardDescription>
              {items.length} selected item{items.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length ? (
              <div className="space-y-3">
                {items.map((item) => {
                  const menu = menuItems.find(
                    (m) => String(m.id) === String(item.menu_item_id),
                  );
                  const lineTotal = Number(menu?.price ?? 0) * item.quantity;
                  return (
                    <div
                      key={String(item.menu_item_id)}
                      className="rounded-xl border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {menu?.name ?? item.menu_item_id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {money(menu?.price)} × {item.quantity} ={" "}
                            {money(lineTotal)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.menu_item_id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updateQty(item.menu_item_id, item.quantity - 1)
                          }
                        >
                          -
                        </Button>
                        <Input
                          className="w-20 text-center"
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQty(item.menu_item_id, Number(e.target.value))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updateQty(item.menu_item_id, item.quantity + 1)
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                No items in cart yet.
              </p>
            )}

            <div className="rounded-xl bg-muted p-4">
              <div className="flex justify-between">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>
            {needsTable && !payload.table_id && (
              <p className="text-xs text-muted-foreground">
                Select a table before creating a dine-in order.
              </p>
            )}
            {scope === "cashier" && !payload.waiter_id && (
              <p className="text-xs text-muted-foreground">Select the responsible waiter before creating the order.</p>
            )}
            {isCredit && !payload.credit_account_id && (
              <p className="text-xs text-muted-foreground">Select a credit account before creating a credit order.</p>
            )}
            {isCredit && selectedCreditAccount && !selectedAgreement && (
              <p className="text-xs text-destructive">Credit order is not allowed because this account has no active agreement.</p>
            )}
            <Button
              className="w-full"
              disabled={!canSubmit || create.isPending}
              onClick={submit}
            >
              {create.isPending ? "Creating..." : "Submit order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function OrderDetailPage({
  id,
  scope = "waiter",
}: {
  id: string;
  scope?: Scope;
}) {
  const query = useOrderQuery(id, scope);
  const confirm = useConfirmOrderMutation();
  const serve = useServeOrderMutation();
  const addItemMutation = useAddOrderItemMutation();
  const updateItemMutation = useUpdateOrderItemMutation();
  const removeItemMutation = useRemoveOrderItemMutation();
  const printBillMutation = usePrintOrderBillMutation();

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [itemPayload, setItemPayload] = useState({
    menu_item_id: "",
    quantity: 1,
    notes: "",
  });
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [billPayload, setBillPayload] = useState({
    customer_name: "Guest",
    customer_tin: "",
    payment_method: "cash",
  });

  const order = normalizeOrderResponse(query.data);
  const items = normalizeOrderItems(order);
  const status = order?.status;
  const bill = (order as any)?.bill ?? (order as any)?.billing ?? null;
  const paymentStatus = bill?.status ?? (order as any)?.payment_status ?? "issued";
  const orderType = String(order?.order_type ?? "—").replace(/_/g, " ");
  const orderTotal =
    order?.total ??
    order?.total_amount ??
    bill?.total ??
    bill?.total_amount ??
    items.reduce(
      (sum: number, item: any) =>
        sum +
        Number(
          item.total_price ??
            item.line_total ??
            Number(item.unit_price ?? item.price ?? 0) * Number(item.quantity ?? 0),
        ),
      0,
    );

  const billLocked = Boolean(
    (order as any)?.bill_printed_at ||
      (order as any)?.bill_locked ||
      (order as any)?.locked_at ||
      bill?.printed_at ||
      bill?.is_printed ||
      bill?.printed ||
      ["paid", "credit", "void", "refunded"].includes(String(paymentStatus).toLowerCase()),
  );

  const menuQuery = useMenuItemsQuery(
    {
      per_page: 200,
      available: 1,
      is_available: 1,
      active: 1,
      is_active: 1,
      search: itemSearch,
    },
    scope === "cashier" ? "cashier" : "waiter",
  );
  const menuItems = menuQuery.data?.data ?? [];

  function itemTitle(item: any) {
    return (
      item.menu_item?.name ??
      item.menuItem?.name ??
      item.name ??
      item.menu_item_name ??
      item.menu_item_id ??
      "Menu item"
    );
  }

  function openAddItemDialog() {
    if (billLocked) return;
    setEditingItem(null);
    setItemPayload({ menu_item_id: "", quantity: 1, notes: "" });
    setItemDialogOpen(true);
  }

  function openEditItemDialog(item: any) {
    if (billLocked) return;
    setEditingItem(item);
    setItemPayload({
      menu_item_id: String(item.menu_item_id ?? item.menu_item?.id ?? item.menuItem?.id ?? ""),
      quantity: Number(item.quantity ?? 1),
      notes: item.notes ?? item.note ?? "",
    });
    setItemDialogOpen(true);
  }

  function submitItemForm() {
    if (!order?.id || billLocked) return;

    if (editingItem) {
      const itemId = editingItem.id ?? editingItem.order_item_id;
      if (!itemId) return;
      updateItemMutation.mutate(
        {
          orderId: order.id,
          itemId,
          payload: {
            quantity: Math.max(1, Number(itemPayload.quantity || 1)),
            notes: itemPayload.notes || null,
          },
        },
        {
          onSuccess: () => {
            setItemDialogOpen(false);
            query.refetch();
          },
        },
      );
      return;
    }

    if (!itemPayload.menu_item_id) return;
    addItemMutation.mutate(
      {
        orderId: order.id,
        payload: {
          menu_item_id: itemPayload.menu_item_id,
          quantity: Math.max(1, Number(itemPayload.quantity || 1)),
          notes: itemPayload.notes || null,
        },
      },
      {
        onSuccess: () => {
          setItemDialogOpen(false);
          query.refetch();
        },
      },
    );
  }

  function removeItem(item: any) {
    if (!order?.id || billLocked) return;
    const itemId = item.id ?? item.order_item_id;
    if (!itemId) return;
    if (!window.confirm("Remove this order item?")) return;
    removeItemMutation.mutate(
      { orderId: order.id, itemId },
      { onSuccess: () => query.refetch() },
    );
  }

  function handlePrintBill() {
    if (!order?.id || billLocked) return;
    printBillMutation.mutate(
      {
        orderId: order.id,
        payload: {
          customer_name: billPayload.customer_name || "Guest",
          customer_tin: billPayload.customer_tin || null,
          payment_method: billPayload.payment_method,
        },
      },
      {
        onSuccess: (response: any) => {
          const printedOrder = normalizeOrderResponse(response) ?? order;
          printOrderBillDocument(printedOrder as any);
          setBillDialogOpen(false);
          query.refetch();
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order {order?.order_number ?? id}
          </h1>
          <p className="text-muted-foreground">
            Print order ticket, print bill, and manage items before the bill is printed.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/order-management/pos/orders">Back to POS orders</Link>
        </Button>
      </div>

      {query.isLoading && (
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading order details...
          </CardContent>
        </Card>
      )}

      {query.isError && (
        <Card className="rounded-2xl border-destructive/30">
          <CardContent className="p-6 text-sm text-destructive">
            Could not load this order. Check the order detail endpoint and permission.
          </CardContent>
        </Card>
      )}

      {!query.isLoading && order && (
        <>
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>
                    {billLocked
                      ? "Bill is printed or locked. Items are read-only and no actions are available."
                      : "Add, edit, or remove items before printing the bill."}
                  </CardDescription>
                </div>

                {!billLocked && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => printCustomerOrderTicket(order as any)}>
                      Print order ticket
                    </Button>
                    <Button size="sm" onClick={() => setBillDialogOpen(true)}>
                      Print bill
                    </Button>
                    <Button size="sm" variant="outline" onClick={openAddItemDialog}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add more item
                    </Button>
                    {canConfirmOrder(status) && (
                      <Button size="sm" variant="outline" disabled={confirm.isPending} onClick={() => confirm.mutate(order.id)}>
                        Confirm
                      </Button>
                    )}
                    {canServeOrder(status) && (
                      <Button size="sm" variant="outline" disabled={serve.isPending} onClick={() => serve.mutate(order.id)}>
                        Mark served
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Order status</Label>
                  <div className="mt-1"><StatusBadge status={status} /></div>
                </div>
                <div>
                  <Label>Order type</Label>
                  <p className="mt-1 capitalize">{orderType}</p>
                </div>
                <div>
                  <Label>Payment status</Label>
                  <div className="mt-1"><StatusBadge status={paymentStatus} /></div>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="mt-1 font-semibold">{money(orderTotal)}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Order type</TableHead>
                      <TableHead>Payment status</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit price</TableHead>
                      <TableHead>Item status</TableHead>
                      <TableHead>Total</TableHead>
                      {!billLocked && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length ? (
                      items.map((item: any) => {
                        const total =
                          item.total_price ??
                          item.line_total ??
                          Number(item.unit_price ?? item.price ?? 0) * Number(item.quantity ?? 0);

                        return (
                          <TableRow key={item.id ?? `${item.menu_item_id}-${item.name}`}>
                            <TableCell>
                              <div className="font-medium">{itemTitle(item)}</div>
                              {(item.notes || item.note) && (
                                <div className="mt-1 text-xs text-muted-foreground">{item.notes ?? item.note}</div>
                              )}
                            </TableCell>
                            <TableCell className="capitalize">{orderType}</TableCell>
                            <TableCell><StatusBadge status={paymentStatus} /></TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{money(item.unit_price ?? item.price)}</TableCell>
                            <TableCell><StatusBadge status={item.item_status ?? item.status} /></TableCell>
                            <TableCell className="font-medium">{money(total)}</TableCell>
                            {!billLocked && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openEditItemDialog(item)}>
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => removeItem(item)}>
                                    Remove
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={billLocked ? 7 : 8} className="h-24 text-center text-muted-foreground">
                          No items found for this order.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit order item" : "Add more item"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                {!editingItem && (
                  <div className="grid gap-2">
                    <Label>Search menu</Label>
                    <Input value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} placeholder="Search food or drink" />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>Menu item</Label>
                  <Select
                    disabled={Boolean(editingItem)}
                    value={itemPayload.menu_item_id || undefined}
                    onValueChange={(menu_item_id) => setItemPayload({ ...itemPayload, menu_item_id })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={menuQuery.isLoading ? "Loading menu..." : "Choose menu item"} />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.length ? (
                        menuItems.map((menu) => (
                          <SelectItem key={menu.id} value={String(menu.id)}>
                            {menu.name} - {money(menu.price)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-menu-items" disabled>No menu items found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={itemPayload.quantity}
                    onChange={(event) => setItemPayload({ ...itemPayload, quantity: Number(event.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea value={itemPayload.notes} onChange={(event) => setItemPayload({ ...itemPayload, notes: event.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
                  <Button
                    disabled={
                      billLocked ||
                      (!editingItem && !itemPayload.menu_item_id) ||
                      itemPayload.quantity <= 0 ||
                      addItemMutation.isPending ||
                      updateItemMutation.isPending
                    }
                    onClick={submitItemForm}
                  >
                    {editingItem ? "Update item" : "Add item"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Print bill</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Customer name</Label>
                  <Input value={billPayload.customer_name} onChange={(event) => setBillPayload({ ...billPayload, customer_name: event.target.value })} placeholder="Guest" />
                </div>
                <div className="grid gap-2">
                  <Label>TIN number optional</Label>
                  <Input value={billPayload.customer_tin} onChange={(event) => setBillPayload({ ...billPayload, customer_tin: event.target.value })} placeholder="Optional customer TIN" />
                </div>
                <div className="grid gap-2">
                  <Label>Payment method</Label>
                  <Select value={billPayload.payment_method} onValueChange={(payment_method) => setBillPayload({ ...billPayload, payment_method })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                      <SelectItem value="transfer">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setBillDialogOpen(false)}>Cancel</Button>
                  <Button disabled={printBillMutation.isPending || billLocked} onClick={handlePrintBill}>
                    {printBillMutation.isPending ? "Printing..." : "Print bill"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

export function CreditAccountsPage() {
  type CreditForm = {
    name: string;
    account_type: string;
    credit_limit: number;
    is_credit_enabled: boolean;
    requires_approval: boolean;
    settlement_cycle: string;
    status: string;
  };

  const emptyPayload: CreditForm = {
    name: "",
    account_type: "customer",
    credit_limit: 0,
    is_credit_enabled: true,
    requires_approval: false,
    settlement_cycle: "monthly",
    status: "active",
  };

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [payload, setPayload] = useState<CreditForm>(emptyPayload);
  const [filters, setFilters] = useState({ page: 1, per_page: 10, search: "", account_type: "all", status: "all" });

  const query = useCreditAccountsQuery(filters);
  const createAccount = useCreateCreditAccountMutation(closeForm);
  const updateAccount = useUpdateCreditAccountMutation(closeForm);
  const toggleAccount = useToggleCreditAccountMutation();
  const accounts = query.data?.data ?? [];
  const meta = query.data?.meta;

  const summary = useMemo(() => {
    const limit = accounts.reduce((sum, account) => sum + Number(account.credit_limit ?? 0), 0);
    const balance = accounts.reduce((sum, account) => sum + Number(account.current_balance ?? 0), 0);
    const active = accounts.filter((account) => String(account.status ?? "active") === "active" && Boolean(Number(account.is_credit_enabled ?? 1))).length;
    const blocked = accounts.filter((account) => String(account.status ?? "") === "blocked" || !Boolean(Number(account.is_credit_enabled ?? 1))).length;
    return { limit, balance, active, blocked };
  }, [accounts]);

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setPayload(emptyPayload);
  }

  function openCreate() {
    setEditingId(null);
    setPayload(emptyPayload);
    setOpen(true);
  }

  function openEdit(account: any) {
    setEditingId(account.id);
    setPayload({
      name: account.name ?? "",
      account_type: account.account_type ?? "customer",
      credit_limit: Number(account.credit_limit ?? 0),
      is_credit_enabled: Boolean(Number(account.is_credit_enabled ?? 1)),
      requires_approval: Boolean(Number(account.requires_approval ?? 0)),
      settlement_cycle: account.settlement_cycle ?? "monthly",
      status: account.status ?? "active",
    });
    setOpen(true);
  }

  function submitAccount() {
    const body = { ...payload, credit_limit: Number(payload.credit_limit ?? 0) };
    if (editingId) updateAccount.mutate({ id: editingId, payload: body });
    else createAccount.mutate(body);
  }

  function updateFilter(patch: Partial<typeof filters>) {
    setFilters((current) => ({ ...current, ...patch, page: 1 }));
  }

  const saving = createAccount.isPending || updateAccount.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Accounts</h1>
          <p className="text-muted-foreground">Create and manage customer, staff, student, and organization credit accounts used during cashier credit settlement.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New credit account</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl"><CardHeader className="pb-2"><CardDescription>Active accounts</CardDescription><CardTitle>{summary.active}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader className="pb-2"><CardDescription>Blocked / disabled</CardDescription><CardTitle>{summary.blocked}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader className="pb-2"><CardDescription>Total credit limit</CardDescription><CardTitle>{money(summary.limit)}</CardTitle></CardHeader></Card>
        <Card className="rounded-2xl"><CardHeader className="pb-2"><CardDescription>Outstanding balance</CardDescription><CardTitle>{money(summary.balance)}</CardTitle></CardHeader></Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Credit account list</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 md:w-72" placeholder="Search account name" value={filters.search} onChange={(event) => updateFilter({ search: event.target.value })} />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Select value={filters.account_type} onValueChange={(account_type) => updateFilter({ account_type })}>
              <SelectTrigger><SelectValue placeholder="Account type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(status) => updateFilter({ status })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setFilters({ page: 1, per_page: 10, search: "", account_type: "all", status: "all" })}>Reset filters</Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading credit accounts...</TableCell></TableRow>
                ) : accounts.length ? (
                  accounts.map((account) => {
                    const limit = Number(account.credit_limit ?? 0);
                    const balance = Number(account.current_balance ?? 0);
                    const enabled = Boolean(Number(account.is_credit_enabled ?? 1));
                    return (
                      <TableRow key={account.id}>
                        <TableCell><div className="font-medium">{account.name}</div><div className="text-xs text-muted-foreground">Created {date(account.created_at)}</div></TableCell>
                        <TableCell className="capitalize">{account.account_type ?? "customer"}</TableCell>
                        <TableCell>{money(limit)}</TableCell>
                        <TableCell>{money(balance)}</TableCell>
                        <TableCell>{money(Math.max(0, limit - balance))}</TableCell>
                        <TableCell className="capitalize">{String(account.settlement_cycle ?? "monthly").replace(/_/g, " ")}</TableCell>
                        <TableCell><div className="flex flex-col gap-1"><StatusBadge status={account.status ?? (enabled ? "active" : "blocked")} /><span className="text-xs text-muted-foreground">{enabled ? "Credit enabled" : "Credit disabled"}</span></div></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(account)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleAccount.mutate(account.id)}>{enabled ? "Disable credit" : "Enable credit"}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No credit accounts found. Create one to allow credit settlement.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1}</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={(meta?.current_page ?? 1) <= 1} onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}>Previous</Button>
              <Button variant="outline" disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : closeForm())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit credit account" : "Create credit account"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2"><Label>Account name</Label><Input value={payload.name} onChange={(event) => setPayload({ ...payload, name: event.target.value })} placeholder="Example: ICT Department, Staff Meal Account" /></div>
            <div className="grid gap-2"><Label>Account type</Label><Select value={payload.account_type} onValueChange={(account_type) => setPayload({ ...payload, account_type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bulky">Bulky</SelectItem><SelectItem value="single">Single</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Agreement value</Label><Input type="number" min={0} value={payload.credit_limit} onChange={(event) => setPayload({ ...payload, credit_limit: Number(event.target.value) })} /></div>
            <div className="grid gap-2"><Label>Representative phone</Label><Select value={payload.settlement_cycle} onValueChange={(settlement_cycle) => setPayload({ ...payload, settlement_cycle })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Status</Label><Select value={payload.status} onValueChange={(status) => setPayload({ ...payload, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Credit enabled</Label><Select value={payload.is_credit_enabled ? "yes" : "no"} onValueChange={(value) => setPayload({ ...payload, is_credit_enabled: value === "yes" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Credit enabled</Label><Select value={payload.requires_approval ? "yes" : "no"} onValueChange={(value) => setPayload({ ...payload, requires_approval: value === "yes" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent></Select></div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2"><Button variant="outline" onClick={closeForm}>Cancel</Button><Button disabled={!payload.name || saving} onClick={submitAccount}>{saving ? "Saving..." : editingId ? "Update account" : "Save account"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CreditOrdersPage() {
  const [settle, setSettle] = useState<CreditOrder | null>(null);
  const [amount, setAmount] = useState(0);
  const [filters, setFilters] = useState({
    per_page: 20,
    credit_account_id: "all",
    status: "all",
    search: "",
  });

  const accountsQuery = useCreditAccountsQuery({ per_page: 200, status: "active" });
  const query = useCreditOrdersQuery(filters);
  const approve = useApproveCreditOrderMutation();
  const settlement = useSettleCreditOrderMutation(() => setSettle(null));
  const rows = query.data?.data ?? [];

  function updateFilter(patch: Partial<typeof filters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Orders</h1>
          <p className="text-muted-foreground">
            View cashier-created credit orders, filter by credit account, approve, and record settlements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/credit-accounts">Credit accounts</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/order-management/pos/orders/create">
              <Plus className="mr-2 h-4 w-4" />
              New cashier order
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter the credit order list by credit account, status, or reference.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Credit account</Label>
            <Select
              value={filters.credit_account_id}
              onValueChange={(credit_account_id) => updateFilter({ credit_account_id })}
            >
              <SelectTrigger>
                <SelectValue placeholder={accountsQuery.isLoading ? "Loading accounts..." : "All credit accounts"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All credit accounts</SelectItem>
                {(accountsQuery.data?.data ?? []).map((account) => {
                  return (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(status) => updateFilter({ status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="credit_pending">Pending approval</SelectItem>
                <SelectItem value="credit_approved">Approved</SelectItem>
                <SelectItem value="partially_settled">Partially settled</SelectItem>
                <SelectItem value="fully_settled">Fully settled</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Search</Label>
            <Input
              value={filters.search}
              onChange={(e) => updateFilter({ search: e.target.value })}
              placeholder="Search reference or account"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">Loading credit orders...</TableCell></TableRow>
              ) : rows.length ? (
                rows.map((c) => {
                  const account = c.credit_account ?? c.account;
                  const status = String(c.status ?? "").toLowerCase();
                  const canApprove = ["pending", "credit_pending"].includes(status);
                  const canSettle = !["fully_settled", "cancelled", "rejected"].includes(status) && Number(c.remaining_amount ?? 0) > 0;

                  return (
                    <TableRow key={c.id}>
                      <TableCell>{c.credit_reference ?? c.order?.order_number ?? c.id}</TableCell>
                      <TableCell>{account?.name ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell>{money(c.total_amount)}</TableCell>
                      <TableCell>{money(c.paid_amount)}</TableCell>
                      <TableCell>{money(c.remaining_amount)}</TableCell>
                      <TableCell>{date(c.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {canApprove && (
                          <Button size="sm" variant="outline" disabled={approve.isPending} onClick={() => approve.mutate(c.id)}>
                            Approve
                          </Button>
                        )}
                        {canSettle && (
                          <Button
                            className="ml-2"
                            size="sm"
                            onClick={() => {
                              setSettle(c);
                              setAmount(Number(c.remaining_amount ?? 0));
                            }}
                          >
                            Settle
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No credit orders found for the selected filters. Cashier creates credit orders directly from POS order creation.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!settle} onOpenChange={(o) => !o && setSettle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle credit order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                max={Number(settle?.remaining_amount ?? 0)}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <Button
              disabled={!settle || amount <= 0 || settlement.isPending}
              onClick={() =>
                settle &&
                settlement.mutate({
                  id: settle.id,
                  payload: { amount, payment_method: "cash" },
                })
              }
            >
              Save settlement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PrepTicketsPage({ kind = "kitchen" }: { kind?: "kitchen" | "bar" }) {
  const [filters, setFilters] = useState({ status: "all", scope: "today", per_page: 30 });
  const query = usePrepTicketsQuery(kind, filters);
  const action = usePrepTicketActionMutation();
  const rows = query.data?.data ?? [];
  const title = kind === "kitchen" ? "Kitchen Tickets" : "Bar Tickets";

  function ticketName(ticket: any) {
    return ticket.menu_item?.name ?? ticket.order_item?.menu_item?.name ?? ticket.order_item?.name ?? ticket.item_name ?? "Ticket item";
  }

  function canAccept(status?: string) { return ["pending", "confirmed"].includes(String(status ?? "").toLowerCase()); }
  function canReady(status?: string) { return ["preparing"].includes(String(status ?? "").toLowerCase()); }
  function canServed(status?: string) { return ["ready"].includes(String(status ?? "").toLowerCase()); }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">Accept confirmed tickets, mark preparation ready, and close served items.</p>
        </div>
        <div className="flex gap-2">
          <Select value={filters.scope} onValueChange={(scope) => setFilters({ ...filters, scope })}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="all_open">All open</SelectItem></SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{["all", "confirmed", "preparing", "ready", "served", "rejected", "delayed"].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total", rows.length],
          ["Confirmed", rows.filter((r: any) => r.status === "confirmed" || r.status === "pending").length],
          ["Preparing", rows.filter((r: any) => r.status === "preparing").length],
          ["Ready", rows.filter((r: any) => r.status === "ready").length],
        ].map(([label, value]) => <Card key={String(label)} className="rounded-2xl"><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle>{value}</CardTitle></CardHeader></Card>)}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader><TableRow><TableHead>Ticket</TableHead><TableHead>Order</TableHead><TableHead>Item</TableHead><TableHead>Waiter/Table</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {query.isLoading ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading tickets...</TableCell></TableRow> : rows.length ? rows.map((ticket: any) => {
                  const status = String(ticket.status ?? "confirmed").toLowerCase();
                  return <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticket_number ?? `#${ticket.id}`}</TableCell>
                    <TableCell>{ticket.order?.order_number ?? ticket.order_id ?? "—"}</TableCell>
                    <TableCell>{ticketName(ticket)}<div className="text-xs text-muted-foreground">Qty: {ticket.order_item?.quantity ?? ticket.quantity ?? 1}</div></TableCell>
                    <TableCell>{ticket.waiter?.name ?? ticket.order?.waiter?.name ?? "—"}<div className="text-xs text-muted-foreground">{ticket.table?.table_number ?? ticket.order?.table?.table_number ?? "No table"}</div></TableCell>
                    <TableCell><StatusBadge status={status} /></TableCell>
                    <TableCell>{date(ticket.created_at)}</TableCell>
                    <TableCell className="text-right"><div className="flex justify-end gap-2">
                      {canAccept(status) && <Button size="sm" onClick={() => action.mutate({ kind, id: ticket.id, action: "accept" })}>Accept</Button>}
                      {canReady(status) && <Button size="sm" onClick={() => action.mutate({ kind, id: ticket.id, action: "ready" })}>Ready</Button>}
                      {canServed(status) && <Button size="sm" variant="outline" onClick={() => action.mutate({ kind, id: ticket.id, action: "served" })}>Served</Button>}
                      {!canAccept(status) && !canReady(status) && !canServed(status) && <Button size="sm" variant="ghost" disabled>No action</Button>}
                    </div></TableCell>
                  </TableRow>;
                }) : <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function useOrderScopeForRole(): Scope {
  const [scope, setScope] = useState<Scope>("admin");
  useEffect(() => {
    try {
      const roles = JSON.parse(localStorage.getItem("roles") || "[]").map((role: string) => String(role).toLowerCase());
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const roleText = [...roles, String(user?.role ?? "")].join(" ");
      setScope(roleText.includes("waiter") ? "waiter" : roleText.includes("cashier") ? "cashier" : "admin");
    } catch {
      setScope("admin");
    }
  }, []);
  return scope;
}

export function RoleAwareOrdersPage() {
  const scope = useOrderScopeForRole();
  return <OrdersPage scope={scope} title={scope === "cashier" ? "POS Orders" : scope === "waiter" ? "My Orders" : "Order Management"} createHref={scope === "cashier" ? "/dashboard/order-management/pos/orders/create" : "/dashboard/order-management/orders/create"} />;
}

export function RoleAwareCreateOrderPage() {
  const scope = useOrderScopeForRole();
  return <CreateOrderPage scope={scope === "cashier" ? "cashier" : "waiter"} title={scope === "cashier" ? "Create POS Order" : "Create Order"} />;
}

export function RoleAwareOrderDetailPage({ id }: { id: string }) {
  const scope = useOrderScopeForRole();
  return <OrderDetailPage id={id} scope={scope} />;
}
