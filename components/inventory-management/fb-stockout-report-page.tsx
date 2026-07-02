"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Download, PackageMinus, RefreshCcw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBaseQuantity, formatMoney } from "@/lib/inventory-management";
import inventoryService from "@/services/inventory-management/inventory.service";
import type { InventoryTransaction } from "@/types/inventory-management/inventory.type";

type DepartmentFilter = "all" | "kitchen" | "bar";

function transactionDate(row: InventoryTransaction) {
  return row.created_at ? new Date(row.created_at) : null;
}

function dateValue(row: InventoryTransaction) {
  const date = transactionDate(row);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function itemName(row: InventoryTransaction) {
  const item = row.inventory_item ?? row.inventoryItem;
  return item?.sku ? `${item.name} (${item.sku})` : item?.name ?? `Item #${row.inventory_item_id}`;
}

function itemUnit(row: InventoryTransaction) {
  const item = row.inventory_item ?? row.inventoryItem;
  return item?.base_unit ?? "pcs";
}

function reportNote(row: InventoryTransaction) {
  return row.reason ?? row.note ?? row.reference_type ?? "—";
}

function detectDepartment(row: InventoryTransaction): "Kitchen" | "Bar" | "Unknown" {
  const source = [row.reason, row.note, row.reference_type].filter(Boolean).join(" ").toLowerCase();

  if (source.includes("kitchen")) return "Kitchen";
  if (source.includes("bar")) return "Bar";

  return "Unknown";
}

function isWithinDateRange(row: InventoryTransaction, from: string, to: string) {
  const date = transactionDate(row);
  if (!date || Number.isNaN(date.getTime())) return true;

  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (date < start) return false;
  }

  if (to) {
    const end = new Date(`${to}T23:59:59`);
    if (date > end) return false;
  }

  return true;
}

function downloadCsv(rows: InventoryTransaction[]) {
  const headers = ["Date", "Department", "Item", "Quantity", "Unit", "Unit Cost", "Total Cost", "Reason/Note", "Recorded By"];
  const csvRows = rows.map((row) => {
    const unitCost = Number(row.unit_cost ?? 0);
    const quantity = Number(row.quantity ?? 0);
    const createdBy = row.created_by_user?.name ?? "—";
    return [
      dateValue(row),
      detectDepartment(row),
      itemName(row),
      quantity,
      itemUnit(row),
      unitCost,
      unitCost * quantity,
      reportNote(row),
      createdBy,
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
  });

  const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kitchen-bar-stockout-report.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function FoodControllerStockoutReportPage() {
  const [department, setDepartment] = useState<DepartmentFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const query = useQuery({
    queryKey: ["inventory", "fb-controller", "stockout-report"],
    queryFn: () => inventoryService.transactions({ type: "out", per_page: 100 }, "food-controller"),
    staleTime: 30000,
    retry: false,
  });

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (query.data?.data ?? []).filter((row) => {
      const rowDepartment = detectDepartment(row).toLowerCase();
      const matchesDepartment = department === "all" || rowDepartment === department;
      const matchesSearch = !keyword || [itemName(row), reportNote(row), row.created_by_user?.name].filter(Boolean).join(" ").toLowerCase().includes(keyword);
      return matchesDepartment && matchesSearch && isWithinDateRange(row, dateFrom, dateTo);
    });
  }, [dateFrom, dateTo, department, query.data?.data, search]);

  const summary = useMemo(() => {
    return rows.reduce(
      (total, row) => {
        const rowDepartment = detectDepartment(row);
        const quantity = Number(row.quantity ?? 0);
        const value = quantity * Number(row.unit_cost ?? 0);
        total.quantity += quantity;
        total.value += value;
        if (rowDepartment === "Kitchen") total.kitchen += 1;
        if (rowDepartment === "Bar") total.bar += 1;
        return total;
      },
      { quantity: 0, value: 0, kitchen: 0, bar: 0 },
    );
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <PackageMinus className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Kitchen & Bar Stockout Report</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Food & Beverage Controller reviews issued stockout items for kitchen and bar departments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button type="button" onClick={() => downloadCsv(rows)} disabled={!rows.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Stockout Records</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{rows.length}</div><p className="text-xs text-muted-foreground">Filtered records</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Kitchen</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary.kitchen}</div><p className="text-xs text-muted-foreground">Kitchen stockout rows</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bar</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary.bar}</div><p className="text-xs text-muted-foreground">Bar stockout rows</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Estimated Value</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatMoney(summary.value)}</div><p className="text-xs text-muted-foreground">Based on transaction unit cost</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle>Stockout transactions</CardTitle>
              <CardDescription>Filter stockout records by department, item, recorded by, and date range.</CardDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-4 xl:w-[780px]">
              <div className="space-y-1">
                <Label>Department</Label>
                <Select value={department} onValueChange={(value) => setDepartment(value as DepartmentFilter)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Kitchen & Bar</SelectItem>
                    <SelectItem value="kitchen">Kitchen only</SelectItem>
                    <SelectItem value="bar">Bar only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>From</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>To</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Item or note..." />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading stockout report...</p>
          ) : rows.length ? (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Reason / Note</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const quantity = Number(row.quantity ?? 0);
                    const unitCost = Number(row.unit_cost ?? 0);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{dateValue(row)}</TableCell>
                        <TableCell><Badge variant="outline">{detectDepartment(row)}</Badge></TableCell>
                        <TableCell className="font-medium">{itemName(row)}</TableCell>
                        <TableCell>{formatBaseQuantity(quantity, itemUnit(row))}</TableCell>
                        <TableCell>{formatMoney(unitCost)} ETB</TableCell>
                        <TableCell>{formatMoney(quantity * unitCost)} ETB</TableCell>
                        <TableCell className="max-w-[260px] truncate">{reportNote(row)}</TableCell>
                        <TableCell>{row.created_by_user?.name ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No stockout records found</p>
              <p className="mt-1 text-sm text-muted-foreground">Kitchen and bar stockout transactions will appear here after stock keeper records stockout.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
