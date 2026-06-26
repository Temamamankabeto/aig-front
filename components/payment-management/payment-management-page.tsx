"use client";

import { useMemo, useState } from "react";
import { CreditCard, RefreshCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApprovePaymentMutation, useFailPaymentMutation, usePaymentsQuery, useReturnPaymentMutation } from "@/hooks/payment-management/use-payments";
import type { PaymentFilters, PaymentMethod, PaymentStatus } from "@/types/payment-management/payment.type";

type Props = {
  scope?: "cashier" | "admin";
};

function money(value: unknown) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
}

function statusVariant(status?: string) {
  if (status === "paid") return "default";
  if (status === "submitted") return "secondary";
  if (status === "failed" || status === "returned") return "destructive";
  return "outline";
}

export function PaymentManagementPage({ scope = "admin" }: Props) {
  const [filters, setFilters] = useState<PaymentFilters>({ per_page: 20, status: "all", method: "all" });
  const { data, isLoading, isFetching, refetch } = usePaymentsQuery(filters, scope);
  const approve = useApprovePaymentMutation();
  const returnPayment = useReturnPaymentMutation();
  const fail = useFailPaymentMutation();

  const payments = data?.data ?? [];
  const totals = useMemo(() => {
    return payments.reduce(
      (acc, p) => {
        acc.count += 1;
        acc.amount += Number(p.amount ?? 0);
        if (p.status === "paid") acc.paid += Number(p.amount ?? 0);
        if (p.status === "submitted") acc.submitted += Number(p.amount ?? 0);
        return acc;
      },
      { count: 0, amount: 0, paid: 0, submitted: 0 },
    );
  }, [payments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">Track bill payments, cashier receipts, approvals, and settlement status.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total Records</CardDescription><CardTitle>{totals.count}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Amount</CardDescription><CardTitle>{money(totals.amount)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Paid Amount</CardDescription><CardTitle>{money(totals.paid)}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Submitted</CardDescription><CardTitle>{money(totals.submitted)}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payments</CardTitle>
          <CardDescription>Cash payments require an open cashier shift. Non-cash payments can use references.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search order, customer, reference..." value={filters.search ?? ""} onChange={(e) => setFilters((v) => ({ ...v, search: e.target.value }))} />
            </div>
            <Select value={filters.method ?? "all"} onValueChange={(method) => setFilters((v) => ({ ...v, method: method as PaymentMethod | "all" }))}>
              <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status ?? "all"} onValueChange={(status) => setFilters((v) => ({ ...v, status: status as PaymentStatus | "all" }))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>Bill / Order</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Loading payments...</TableCell></TableRow>
                ) : payments.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No payments found.</TableCell></TableRow>
                ) : payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">#{payment.id}<div className="text-xs text-muted-foreground">{payment.reference || "No reference"}</div></TableCell>
                    <TableCell>
                      <div>{payment.bill?.bill_number ?? `Bill #${payment.bill_id}`}</div>
                      <div className="text-xs text-muted-foreground">{payment.bill?.order?.order_number ?? ""} {payment.bill?.order?.customer_name ? `• ${payment.bill.order.customer_name}` : ""}</div>
                    </TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell>{money(payment.amount)}</TableCell>
                    <TableCell><Badge variant={statusVariant(payment.status) as any}>{payment.status}</Badge></TableCell>
                    <TableCell>{payment.receiver?.name ?? "-"}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      {scope !== "cashier" && payment.status === "submitted" ? (
                        <>
                          <Button size="sm" onClick={() => approve.mutate(payment.id)} disabled={approve.isPending}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => returnPayment.mutate(payment.id)} disabled={returnPayment.isPending}>Return</Button>
                          <Button size="sm" variant="destructive" onClick={() => fail.mutate(payment.id)} disabled={fail.isPending}>Fail</Button>
                        </>
                      ) : <span className="text-xs text-muted-foreground">No action</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
