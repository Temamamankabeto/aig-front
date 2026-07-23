"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, PackageOpen, ReceiptText, ShoppingBasket } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type Period = "today" | "this_week" | "this_month" | "this_year" | "custom";

type CashSalesRow = {
  menu_item_id: number;
  item_name: string;
  category_name?: string | null;
  type?: string | null;
  total_orders: number;
  total_quantity: number;
  average_unit_price: number;
  total_sales: number;
};

type CashSalesResponse = {
  success: boolean;
  message: string;
  data: CashSalesRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary: {
      distinct_items: number;
      total_orders: number;
      total_quantity: number;
      total_sales: number;
    };
  };
};

const money = (value: unknown) =>
  Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CashSalesReportPage() {
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    period: "today" as Period,
    date_from: "",
    date_to: "",
    page: 1,
    per_page: 25,
  });

  const reportQuery = useQuery({
    queryKey: ["food-controller", "reports", "cash-sales", filters],
    queryFn: async () => {
      const response = await api.get<CashSalesResponse>(
        "/food-controller/reports/cash-sales",
        { params: filters },
      );
      return response.data;
    },
  });

  const rows = reportQuery.data?.data ?? [];
  const meta = reportQuery.data?.meta;
  const summary = meta?.summary ?? {
    distinct_items: 0,
    total_orders: 0,
    total_quantity: 0,
    total_sales: 0,
  };

  const updateFilters = (patch: Partial<typeof filters>) =>
    setFilters((current) => ({ ...current, ...patch, page: 1 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cash Sales Report</h1>
        <p className="text-muted-foreground">
          Each menu item is grouped by item ID across all filtered cash orders.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <PackageOpen className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Distinct Items</p>
              <p className="text-2xl font-bold">{summary.distinct_items}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <ReceiptText className="h-8 w-8 text-violet-600" />
            <div>
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{summary.total_orders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <ShoppingBasket className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-sm text-muted-foreground">Quantity Sold</p>
              <p className="text-2xl font-bold">{money(summary.total_quantity)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 p-5">
            <Banknote className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Cash Sales</p>
              <p className="text-2xl font-bold">{money(summary.total_sales)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Filtered Item Sales</CardTitle>
          <CardDescription>
            Quantity and price are summed for the same menu item from different orders.
          </CardDescription>

          <div className="grid gap-2 pt-2 md:grid-cols-3 xl:grid-cols-5">
            <Input
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Search item or category"
            />

            <Select
              value={filters.type}
              onValueChange={(type) => updateFilters({ type })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Item type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All item types</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="drink">Drink</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.period}
              onValueChange={(period: Period) => updateFilters({ period })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This week</SelectItem>
                <SelectItem value="this_month">This month</SelectItem>
                <SelectItem value="this_year">This year</SelectItem>
                <SelectItem value="custom">Custom interval</SelectItem>
              </SelectContent>
            </Select>

            {filters.period === "custom" && (
              <>
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(event) =>
                    updateFilters({ date_from: event.target.value })
                  }
                  aria-label="Start date"
                />
                <Input
                  type="date"
                  value={filters.date_to}
                  min={filters.date_from || undefined}
                  onChange={(event) =>
                    updateFilters({ date_to: event.target.value })
                  }
                  aria-label="End date"
                />
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {reportQuery.isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {reportQuery.error instanceof Error
                ? reportQuery.error.message
                : "Unable to load the cash sales report."}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Average Price</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                      Loading cash sales...
                    </TableCell>
                  </TableRow>
                ) : rows.length ? (
                  <>
                    {rows.map((row) => (
                      <TableRow key={row.menu_item_id}>
                        <TableCell className="font-mono">{row.menu_item_id}</TableCell>
                        <TableCell>{row.category_name ?? "Uncategorized"}</TableCell>
                        <TableCell className="font-medium">{row.item_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {row.type ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{row.total_orders}</TableCell>
                        <TableCell className="text-right">{money(row.total_quantity)}</TableCell>
                        <TableCell className="text-right">{money(row.average_unit_price)}</TableCell>
                        <TableCell className="text-right font-semibold">{money(row.total_sales)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4}>Filtered Summary</TableCell>
                      <TableCell className="text-right">{summary.total_orders}</TableCell>
                      <TableCell className="text-right">{money(summary.total_quantity)}</TableCell>
                      <TableCell className="text-right">—</TableCell>
                      <TableCell className="text-right">{money(summary.total_sales)}</TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                      No cash sales found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1} ·{" "}
              {meta?.total ?? 0} grouped items
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={(meta?.current_page ?? 1) <= 1 || reportQuery.isFetching}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }))
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={
                  (meta?.current_page ?? 1) >= (meta?.last_page ?? 1) ||
                  reportQuery.isFetching
                }
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
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
