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
  recent_requests: [],
  trend: [],
  alerts: {
    pending_validation: 0,
    pending_manager_approval: 0,
    approved_awaiting_receiving: 0,
    low_stock_items: 0,
    rejected_requests: 0,
  },
};

function formatMoney(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCompact(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));
}

function statusBadge(status: string) {
  const label = status.replace(/_/g, " ");

  if (["approved", "completed", "received"].includes(status)) {
    return <Badge>{label}</Badge>;
  }

  if (["fb_validated", "food_validated", "partially_received"].includes(status)) {
    return <Badge variant="secondary">{label}</Badge>;
  }

  if (["validation_rejected", "cancelled"].includes(status)) {
    return <Badge variant="destructive">{label}</Badge>;
  }

  return <Badge variant="outline">{label}</Badge>;
}

function requestItems(row: PurchaserDashboardRecentRequest) {
  if (row.items) return row.items;
  if (row.items_count) return `${row.items_count} item${row.items_count === 1 ? "" : "s"}`;
  return "No items";
}

export default function PurchaserDashboardPage() {
  const [dashboard, setDashboard] = useState<PurchaserDashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await procurementService.purchaserDashboard();
      setDashboard(data ?? emptyDashboard);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to load purchaser dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const statusTotal = useMemo(
    () => dashboard.status_distribution.reduce((sum, item) => sum + Number(item.value ?? 0), 0),
    [dashboard.status_distribution]
  );

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
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">Procurement Control Center</Badge>
            <h1 className="text-2xl font-semibold tracking-tight">Purchaser Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Dynamic overview for purchase requests, supplier activity, approval pipeline, and receiving readiness.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={loadDashboard} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh requests
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/purchases/requests/create">
                New request <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.title}</p>
                    <h2 className="mt-3 text-3xl font-semibold">{item.value}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" /> Purchase status distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.status_distribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No purchase request status data yet.</p>
            ) : (
              dashboard.status_distribution.map((item) => {
                const value = Number(item.value ?? 0);
                const percent = statusTotal > 0 ? Math.round((value / statusTotal) * 100) : 0;
                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-medium">{value}</span>
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
              <AlertTriangle className="h-4 w-4" /> Procurement alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border p-3">
              <p className="font-medium">{dashboard.alerts.pending_validation} requests awaiting F&B validation</p>
              <p className="text-muted-foreground">Submitted requests before manager approval.</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="font-medium">{dashboard.alerts.approved_awaiting_receiving} approved orders ready for receiving</p>
              <p className="text-muted-foreground">Coordinate receiving with stock keeper.</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="font-medium">{dashboard.alerts.low_stock_items} low stock items</p>
              <p className="text-muted-foreground">Create purchase requests where needed.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent purchase requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recent_requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No purchase requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  dashboard.recent_requests.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.po_number ?? `PO-${row.id}`}</TableCell>
                      <TableCell>{row.supplier}</TableCell>
                      <TableCell>{requestItems(row)}</TableCell>
                      <TableCell>{formatMoney(row.amount)} ETB</TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild className="justify-between">
              <Link href="/dashboard/purchases/requests/create">Create request <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/purchases/requests">View requests <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/dashboard/inventory/items">Receiving dashboard <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Procurement workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {dashboard.workflow.map((step, index) => {
              const icons = [FileText, ShieldCheck, CheckCircle2, PackageCheck];
              const Icon = icons[index] ?? FileText;
              return (
                <div key={step.label} className="rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5" />
                    <Badge variant="outline">{step.value}</Badge>
                  </div>
                  <p className="mt-4 font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">Step {index + 1} of procurement lifecycle</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
