"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, CreditCard, Loader2, RefreshCw, ShieldAlert, ShoppingCart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import orderService from "@/services/order-management/order.service";

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function date(value?: string) {
  return value ? new Date(value).toLocaleString() : "—";
}

function ScanContent() {
  const searchParams = useSearchParams();
  const [manualRefresh, setManualRefresh] = useState(0);

  const rawCard = useMemo(() => {
    const fromUrl = searchParams.get("card") || searchParams.get("card_number") || "";
    if (fromUrl) return fromUrl;

    const accountId = searchParams.get("account_id");
    const userId = searchParams.get("authorized_user_id") || searchParams.get("credit_account_user_id");

    if (accountId) {
      const params = new URLSearchParams({ account_id: accountId });
      if (userId) params.set("authorized_user_id", userId);
      return params.toString();
    }

    return "";
  }, [searchParams]);

  const query = useQuery({
    queryKey: ["credit-card-scan", rawCard, manualRefresh],
    queryFn: () => orderService.scanCreditCard(rawCard),
    enabled: Boolean(rawCard),
  });

  const data = query.data?.data;
  const limit = Number(data?.credit_limit ?? 0);
  const used = Number(data?.used_credit ?? 0);
  const remaining = Number(data?.remaining_credit ?? 0);
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const canCreateOrder = data?.is_active && remaining > 0;

  if (!rawCard) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/order-management/credit-accounts">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to credit accounts
          </Link>
        </Button>

        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Invalid scan link
            </CardTitle>
            <CardDescription>The QR code did not include a valid credit card reference.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/order-management/credit-accounts">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to credit accounts
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Credit Card Scan Result</h1>
            <p className="text-muted-foreground">Live account balance and authorization details from the scanned QR code.</p>
          </div>
        </div>

        <Button variant="outline" onClick={() => setManualRefresh((value) => value + 1)} disabled={query.isFetching}>
          {query.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh balance
        </Button>
      </div>

      {query.isLoading && (
        <Card className="rounded-2xl">
          <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading credit information...
          </CardContent>
        </Card>
      )}

      {query.isError && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" /> Unable to load card
            </CardTitle>
            <CardDescription>{query.error?.message || "The scanned card could not be validated."}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {data && (
        <>
          <Card className="overflow-hidden rounded-3xl border shadow-sm">
            <div className="bg-primary px-6 py-5 text-primary-foreground">
              <p className="text-xs uppercase tracking-[0.3em] opacity-80">Restaurant Credit Account</p>
              <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{data.account_name}</h2>
                  <p className="text-sm opacity-80">Card No: {data.card_no}</p>
                </div>
                <Badge variant={canCreateOrder ? "secondary" : "destructive"}>{canCreateOrder ? "ACTIVE CREDIT" : "NOT AVAILABLE"}</Badge>
              </div>
            </div>

            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardDescription>Credit Limit</CardDescription>
                  <CardTitle>{money(limit)} ETB</CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardDescription>Used Credit</CardDescription>
                  <CardTitle>{money(used)} ETB</CardTitle>
                </CardHeader>
              </Card>
              <Card className="rounded-2xl border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardDescription>Remaining Credit</CardDescription>
                  <CardTitle className="text-primary">{money(remaining)} ETB</CardTitle>
                </CardHeader>
              </Card>
              <div className="space-y-2 md:col-span-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Credit utilization</span>
                  <span>{percent}% used</span>
                </div>
                <Progress value={percent} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Authorized Users
                </CardTitle>
                <CardDescription>Users allowed to consume credit from this account.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.authorized_users?.length ? data.authorized_users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.phone || "—"}</TableCell>
                          <TableCell>{user.employee_id || "—"}</TableCell>
                          <TableCell><Badge variant={user.is_active ? "outline" : "destructive"}>{user.is_active ? "Active" : "Disabled"}</Badge></TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No authorized users found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Next Action
                </CardTitle>
                <CardDescription>Create a credit order only when remaining credit is available.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border p-4 text-sm">
                  <div className="flex items-center justify-between"><span>Status</span><strong className="capitalize">{data.status}</strong></div>
                  <div className="mt-2 flex items-center justify-between"><span>Credit enabled</span><strong>{data.is_credit_enabled ? "Yes" : "No"}</strong></div>
                  <div className="mt-2 flex items-center justify-between"><span>Remaining</span><strong>{money(remaining)} ETB</strong></div>
                </div>

                <Button className="w-full" disabled={!canCreateOrder} asChild={canCreateOrder}>
                  {canCreateOrder ? (
                    <Link href={`/dashboard/order-management/credit-orders?credit_account_id=${data.account_id}`}>
                      <ShoppingCart className="mr-2 h-4 w-4" /> Create Credit Order
                    </Link>
                  ) : (
                    <span><ShieldAlert className="mr-2 h-4 w-4" /> Credit Not Available</span>
                  )}
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/order-management/credit-accounts/${data.account_id}`}>
                    <BadgeCheck className="mr-2 h-4 w-4" /> View Account Detail
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Recent Credit Orders</CardTitle>
              <CardDescription>Latest transactions for this credit account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent_credit_orders?.length ? data.recent_credit_orders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.credit_reference || `#${order.id}`}</TableCell>
                        <TableCell>{order.used_by_name || order.authorized_user?.full_name || "—"}</TableCell>
                        <TableCell>{money(order.amount ?? order.bill?.total ?? 0)} ETB</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{order.status}</Badge></TableCell>
                        <TableCell>{date(order.created_at)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No recent credit orders found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function CreditCardScanPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading scan result...</div>}>
      <ScanContent />
    </Suspense>
  );
}
