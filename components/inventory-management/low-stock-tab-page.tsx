"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBaseQuantity, formatMoney } from "@/lib/inventory-management";
import { useLowStockQuery } from "@/hooks/inventory-management";
import type { BaseUnit, LowStockRow } from "@/types/inventory-management";

type LowStockAlertRow = LowStockRow & {
  low_stock_level?: "critical" | "warning" | string | null;
  shortage?: number | string | null;
  shortage_percent?: number | string | null;
};

function normalizeUnit(value?: string | null): BaseUnit {
  if (value === "kg" || value === "L" || value === "pcs") return value;
  return "pcs";
}

function itemUnit(item?: { base_unit?: string | null; unit?: string | null }): BaseUnit {
  return normalizeUnit(item?.base_unit ?? item?.unit);
}

function alertLevel(row: LowStockAlertRow) {
  if (row.low_stock_level === "critical" || row.low_stock_level === "warning") return row.low_stock_level;

  const current = Number(row.current_stock ?? 0);
  const minimum = Number(row.minimum_quantity ?? 0);
  return minimum > 0 && current <= minimum * 0.5 ? "critical" : "warning";
}

function shortage(row: LowStockAlertRow) {
  const explicitShortage = Number(row.shortage ?? Number.NaN);
  if (Number.isFinite(explicitShortage)) return Math.max(explicitShortage, 0);
  return Math.max(Number(row.minimum_quantity ?? 0) - Number(row.current_stock ?? 0), 0);
}

function ShortageLevelBadge({ level }: { level: "critical" | "warning" }) {
  if (level === "critical") {
    return <Badge variant="destructive">Critical</Badge>;
  }

  return <Badge variant="secondary">Warning</Badge>;
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium">No low stock items</p>
      <p className="mt-1 text-sm text-muted-foreground">All inventory items are currently above their minimum quantity.</p>
    </div>
  );
}

export function LowStockTabPage() {
  const query = useLowStockQuery();
  const rows = (query.data ?? [])
    .filter((row) => Number(row.current_stock ?? 0) <= Number(row.minimum_quantity ?? 0)) as LowStockAlertRow[];

  const criticalCount = rows.filter((row) => alertLevel(row) === "critical").length;
  const warningCount = rows.filter((row) => alertLevel(row) === "warning").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total low stock</p>
            <p className="mt-1 text-2xl font-bold">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Critical</p>
            <p className="mt-1 text-2xl font-bold text-destructive">{criticalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Warning</p>
            <p className="mt-1 text-2xl font-bold">{warningCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>
                Only items with current stock less than or equal to minimum quantity are shown. Critical means stock is at or below 50% of minimum.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading low stock alerts...</p>
          ) : rows.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Base unit</TableHead>
                    <TableHead>Current stock</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Shortage</TableHead>
                    <TableHead>Avg price</TableHead>
                    <TableHead>Alert level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const unit = itemUnit(row);
                    const level = alertLevel(row);

                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.sku ?? "No SKU"}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline">{unit}</Badge></TableCell>
                        <TableCell>{formatBaseQuantity(row.current_stock, unit)}</TableCell>
                        <TableCell>{formatBaseQuantity(row.minimum_quantity, unit)}</TableCell>
                        <TableCell>{formatBaseQuantity(shortage(row), unit)}</TableCell>
                        <TableCell>{formatMoney(row.average_purchase_price)} ETB</TableCell>
                        <TableCell><ShortageLevelBadge level={level} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
