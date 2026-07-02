"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Loader2,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  procurementService,
  type PurchaserDashboardData,
  type PurchaserDashboardRecentRequest,
} from "@/services/inventory-management/procurement.service";

/**
 * SAFE EMPTY STATE (must match service type)
 */
const emptyDashboard: PurchaserDashboardData = {
  kpis: {
    total_requests: 0,
    requests_this_week: 0,
    pending_validation: 0,
    validated: 0,
    manager_approved: 0,
    partially_received: 0,
    completed: 0,
    rejected: 0,
    monthly_cost: 0,
    low_stock_items: 0,
  },

  status_distribution: [],
  workflow: [],
  trend: [],
  recent_requests: [],

  alerts: {
    pending_validation: 0,
    pending_manager_approval: 0,
    approved_awaiting_receiving: 0,
    low_stock_items: 0,
    rejected_requests: 0,
  },
};

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatCompact(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));
}

/**
 * Safe status badge renderer
 */
function statusBadge(status: string) {
  const label = status.replace(/_/g, " ");

  if (["approved", "completed", "received"].includes(status)) {
    return <Badge>{label}</Badge>;
  }

  if (
    ["fb_validated", "food_validated", "partially_received"].includes(status)
  ) {
    return <Badge variant="secondary">{label}</Badge>;
  }

  if (["validation_rejected", "cancelled"].includes(status)) {
    return <Badge variant="destructive">{label}</Badge>;
  }

  return <Badge variant="outline">{label}</Badge>;
}

/**
 * SAFE item renderer (fixes missing API fields issue)
 */
function requestItems(row: PurchaserDashboardRecentRequest) {
  const anyRow = row as any;

  if (Array.isArray(anyRow.items)) {
    return `${anyRow.items.length} item${anyRow.items.length === 1 ? "" : "s"}`;
  }

  if (typeof anyRow.items_count === "number") {
    return `${anyRow.items_count} item${
      anyRow.items_count === 1 ? "" : "s"
    }`;
  }

  return "No items";
}

export default function PurchaserDashboardPage() {
  const [dashboard, setDashboard] =
    useState<PurchaserDashboardData>(emptyDashboard);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await procurementService.purchaserDashboard();

      setDashboard(data ?? emptyDashboard);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Unable to load purchaser dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const statusTotal = useMemo(() => {
    return dashboard.status_distribution.reduce(
      (sum, item) => sum + Number(item.value ?? 0),
      0
    );
  }, [dashboard.status_distribution]);

  const kpis = [
    {
      title: "Purchase Requests",
      value: dashboard.kpis.total_requests,
      caption: `+${dashboard.kpis.requests_this_week} this week`,
      icon: FileText,
    },
    {
      title: "Pending Validation",
      value: dashboard.kpis.pending_validation,
      caption: "F&B review",
      icon: ShieldCheck,
    },
    {
      title: "Manager Approved",
      value: dashboard.kpis.manager_approved,
      caption: "Ready to receive",
      icon: CheckCircle2,
    },
    {
      title: "Monthly Cost",
      value: formatCompact(dashboard.kpis.monthly_cost),
      caption: "ETB committed",
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">
              Procurement Control Center
            </Badge>
            <h1 className="text-2xl font-semibold">
              Purchaser Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Overview of procurement pipeline and supplier activity.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>

            <Button size="sm" asChild>
              <Link href="/dashboard/purchases/requests/create">
                New request <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* KPI */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardContent className="p-5">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {item.title}
                    </p>
                    <h2 className="text-3xl font-semibold">
                      {item.value}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {item.caption}
                    </p>
                  </div>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* STATUS + ALERTS */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Status Distribution
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {dashboard.status_distribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No data available.
              </p>
            ) : (
              dashboard.status_distribution.map((item) => {
                const value = Number(item.value ?? 0);
                const percent =
                  statusTotal > 0
                    ? Math.round((value / statusTotal) * 100)
                    : 0;

                return (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span>{value}</span>
                    </div>
                    <Progress value={percent} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div className="border rounded-xl p-3">
              <p className="font-medium">
                {dashboard.alerts.pending_validation} pending validation
              </p>
            </div>

            <div className="border rounded-xl p-3">
              <p className="font-medium">
                {dashboard.alerts.approved_awaiting_receiving} awaiting receiving
              </p>
            </div>

            <div className="border rounded-xl p-3">
              <p className="font-medium">
                {dashboard.alerts.low_stock_items} low stock items
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* RECENT REQUESTS */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {dashboard.recent_requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                dashboard.recent_requests.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.po_number ?? `PO-${row.id}`}
                    </TableCell>
                    <TableCell>{row.supplier}</TableCell>
                    <TableCell>{requestItems(row)}</TableCell>
                    <TableCell>
                      {formatMoney(row.amount)} ETB
                    </TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}