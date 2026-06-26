"use client";

import { FormEvent, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useCloseShiftMutation,
  useCreateShiftMovementMutation,
  useCurrentShiftQuery,
  useOpenShiftMutation,
  useShiftMovementsQuery,
  useShiftsQuery,
} from "@/hooks/shift-management/use-shifts";
import type { CashShiftMovement, ShiftMovementType } from "@/types/shift-management/shift.type";

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function dateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function movementLabel(type: ShiftMovementType) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeMovements(payload: unknown): CashShiftMovement[] {
  if (Array.isArray(payload)) return payload as CashShiftMovement[];
  const data = (payload as { data?: unknown })?.data;
  if (Array.isArray(data)) return data as CashShiftMovement[];
  const nested = (data as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as CashShiftMovement[]) : [];
}

export default function ShiftManagementPage() {
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("0");
  const [movementType, setMovementType] = useState<ShiftMovementType>("opening_adjustment");
  const [movementAmount, setMovementAmount] = useState("0");
  const [movementNote, setMovementNote] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");

  const currentQuery = useCurrentShiftQuery();
  const currentShift = currentQuery.data?.data ?? null;
  const currentSummary = currentShift?.summary;
  const shiftsQuery = useShiftsQuery({ status, per_page: 20 });
  const movementsQuery = useShiftMovementsQuery(currentShift?.id);
  const movements = useMemo(() => normalizeMovements(movementsQuery.data), [movementsQuery.data]);

  const openShift = useOpenShiftMutation(() => {
    setOpeningCash("0");
  });
  const closeShift = useCloseShiftMutation(() => {
    setClosingCash("0");
  });
  const createMovement = useCreateShiftMovementMutation(() => {
    setMovementAmount("0");
    setMovementNote("");
  });

  function handleOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openShift.mutate({ opening_cash: Number(openingCash) });
  }

  function handleClose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentShift?.id) return;
    closeShift.mutate({ id: currentShift.id, closing_cash: Number(closingCash) });
  }

  function handleMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentShift?.id) return;
    createMovement.mutate({
      shiftId: currentShift.id,
      type: movementType,
      amount: Number(movementAmount),
      note: movementNote || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Shift Management</h1>
          <p className="text-muted-foreground">
            Open shift, record cash movements, close shift, and reconcile cashier cash.
          </p>
        </div>
        <Badge variant={currentShift ? "default" : "secondary"}>
          {currentShift ? `Open shift #${currentShift.id}` : "No open shift"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Opening Cash</CardDescription></CardHeader>
          <CardContent className="text-2xl font-bold">{money(currentShift?.opening_cash)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Cash Payments</CardDescription></CardHeader>
          <CardContent className="text-2xl font-bold">{money(currentSummary?.cash_payments)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Expected Cash</CardDescription></CardHeader>
          <CardContent className="text-2xl font-bold">{money(currentSummary?.expected_cash)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total Payments</CardDescription></CardHeader>
          <CardContent className="text-2xl font-bold">{money(currentSummary?.total_payments)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{currentShift ? "Close Current Shift" : "Open New Shift"}</CardTitle>
            <CardDescription>
              {currentShift ? "Enter actual cash counted in drawer." : "Enter starting cash in drawer."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!currentShift ? (
              <form onSubmit={handleOpen} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opening_cash">Opening Cash</Label>
                  <Input id="opening_cash" type="number" min="0" step="0.01" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} required />
                </div>
                <Button type="submit" disabled={openShift.isPending}>Open Shift</Button>
              </form>
            ) : (
              <form onSubmit={handleClose} className="space-y-4">
                <div className="grid gap-3 rounded-lg border p-4 text-sm md:grid-cols-2">
                  <div><span className="text-muted-foreground">Opened:</span> {dateTime(currentShift.opened_at)}</div>
                  <div><span className="text-muted-foreground">Cashier:</span> {currentShift.cashier?.name ?? currentShift.cashier_name ?? "-"}</div>
                  <div><span className="text-muted-foreground">Expected:</span> {money(currentSummary?.expected_cash)}</div>
                  <div><span className="text-muted-foreground">Payments:</span> {currentSummary?.payments_count ?? 0}</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing_cash">Closing Cash</Label>
                  <Input id="closing_cash" type="number" min="0" step="0.01" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} required />
                </div>
                <Button type="submit" disabled={closeShift.isPending}>Close Shift</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Movement</CardTitle>
            <CardDescription>Add cash drop, refund, paid-out, or opening adjustment.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMovement} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Movement Type</Label>
                  <Select value={movementType} onValueChange={(value) => setMovementType(value as ShiftMovementType)} disabled={!currentShift}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opening_adjustment">Opening Adjustment</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="paid_out">Paid Out</SelectItem>
                      <SelectItem value="cash_drop">Cash Drop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="movement_amount">Amount</Label>
                  <Input id="movement_amount" type="number" min="0.01" step="0.01" value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} disabled={!currentShift} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement_note">Note</Label>
                <Textarea id="movement_note" value={movementNote} onChange={(e) => setMovementNote(e.target.value)} disabled={!currentShift} placeholder="Reason or reference" />
              </div>
              <Button type="submit" disabled={!currentShift || createMovement.isPending}>Save Movement</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Shift Movements</CardTitle>
          <CardDescription>Cash adjustments recorded during the open shift.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No movements found.</TableCell></TableRow>
              ) : movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{movementLabel(movement.type)}</TableCell>
                  <TableCell>{money(movement.amount)}</TableCell>
                  <TableCell>{movement.creator?.name ?? "-"}</TableCell>
                  <TableCell>{movement.note ?? "-"}</TableCell>
                  <TableCell>{dateTime(movement.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Shift History</CardTitle>
            <CardDescription>Recent cashier shifts and reconciliation result.</CardDescription>
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as "all" | "open" | "closed")}>
            <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Closing</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Opened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(shiftsQuery.data?.data ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No shifts found.</TableCell></TableRow>
              ) : (shiftsQuery.data?.data ?? []).map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>#{shift.id}</TableCell>
                  <TableCell>{shift.cashier_name ?? shift.cashier?.name ?? "-"}</TableCell>
                  <TableCell><Badge variant={shift.status === "open" ? "default" : "secondary"}>{shift.status}</Badge></TableCell>
                  <TableCell>{money(shift.opening_cash)}</TableCell>
                  <TableCell>{money(shift.expected_cash ?? shift.summary?.expected_cash)}</TableCell>
                  <TableCell>{shift.closing_cash === null ? "-" : money(shift.closing_cash)}</TableCell>
                  <TableCell>{shift.variance === null ? "-" : money(shift.variance)}</TableCell>
                  <TableCell>{dateTime(shift.opened_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
