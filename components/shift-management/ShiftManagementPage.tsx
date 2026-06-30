"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
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
import { orderService } from "@/services/order-management";
import {
  useCloseShiftMutation,
  useCreateShiftMovementMutation,
  useCurrentShiftQuery,
  useOpenShiftMutation,
  useShiftMovementsQuery,
  useShiftsQuery,
} from "@/hooks/shift-management/use-shifts";
import type {
  CashShift,
  CashShiftMovement,
  ShiftMovementType,
} from "@/types/shift-management/shift.type";

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function dateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function movementLabel(type: ShiftMovementType | string) {
  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeMovements(payload: unknown): CashShiftMovement[] {
  if (Array.isArray(payload)) return payload as CashShiftMovement[];
  const data = (payload as { data?: unknown })?.data;
  if (Array.isArray(data)) return data as CashShiftMovement[];
  const nested = (data as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as CashShiftMovement[]) : [];
}

function normalizeOrderItems(order?: any) {
  return (
    order?.items ??
    order?.order_items ??
    order?.data?.items ??
    order?.data?.order_items ??
    []
  );
}

function paymentRowsFromPayments(rows: any[]) {
  return rows.map((row: any) => ({
    key: row.id ?? `${row.payment_id}-${row.item_id}`,
    receiptNo: row.bill_number ?? row.receipt_no ?? row.reference ?? `PAY-${row.payment_id ?? "—"}`,
    orderId: row.order_id,
    orderNumber: row.order_number ?? `#${row.order_id ?? "—"}`,
    itemName: row.item_name ?? "Menu Item",
    qty: Number(row.quantity ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    lineTotal: Number(row.total ?? row.line_total ?? 0),
    method: row.payment_method ?? row.method ?? "—",
    paidAt: row.paid_at ?? row.created_at,
  }));
}

function paymentTotals(rows: ReturnType<typeof paymentRowsFromPayments>) {
  return rows.reduce(
    (acc, row) => {
      acc.qty += Number(row.qty ?? 0);
      acc.total += Number(row.lineTotal ?? 0);
      return acc;
    },
    { qty: 0, total: 0 },
  );
}

function SoldItemsTable({
  rows,
  loading,
  emptyMessage,
}: {
  rows: ReturnType<typeof paymentRowsFromPayments>;
  loading?: boolean;
  emptyMessage: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt / Order</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Paid At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                Loading sold items...
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>
                  <div className="font-medium">{row.receiptNo}</div>
                  {row.orderId ? (
                    <Link
                      className="text-xs text-muted-foreground hover:underline"
                      href={`/dashboard/order-management/pos/orders/${row.orderId}`}
                    >
                      {row.orderNumber}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {row.orderNumber}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{row.itemName}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell>{money(row.unitPrice)}</TableCell>
                <TableCell className="font-semibold">
                  {money(row.lineTotal)}
                </TableCell>
                <TableCell className="capitalize">
                  {String(row.method).replace(/_/g, " ")}
                </TableCell>
                <TableCell>{dateTime(row.paidAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function MovementsTable({ movements }: { movements: CashShiftMovement[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
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
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-20 text-center text-muted-foreground"
              >
                No movements found.
              </TableCell>
            </TableRow>
          ) : (
            movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{movementLabel(movement.type)}</TableCell>
                <TableCell>{money(movement.amount)}</TableCell>
                <TableCell>{movement.creator?.name ?? "-"}</TableCell>
                <TableCell>{movement.note ?? "-"}</TableCell>
                <TableCell>{dateTime(movement.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ShiftManagementPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("0");
  const [movementType, setMovementType] =
    useState<ShiftMovementType>("opening_adjustment");
  const [movementAmount, setMovementAmount] = useState("0");
  const [movementNote, setMovementNote] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const [closedSuccessfully, setClosedSuccessfully] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<
    number | string | null
  >(null);

  const currentQuery = useCurrentShiftQuery();
  const currentShift = currentQuery.data?.data ?? null;
  const currentSummary = currentShift?.summary;

  const shiftsQuery = useShiftsQuery({ status, per_page: 20 });
  const shifts = shiftsQuery.data?.data ?? [];

  const selectedShift = useMemo<CashShift | null>(() => {
    if (!selectedShiftId) return null;
    const historyShift = shifts.find(
      (shift) => String(shift.id) === String(selectedShiftId),
    );
    if (historyShift) return historyShift;
    if (currentShift && String(currentShift.id) === String(selectedShiftId))
      return currentShift;
    return null;
  }, [currentShift, selectedShiftId, shifts]);

  const currentMovementsQuery = useShiftMovementsQuery(currentShift?.id);
  const currentMovements = useMemo(
    () => normalizeMovements(currentMovementsQuery.data),
    [currentMovementsQuery.data],
  );

  const selectedMovementsQuery = useShiftMovementsQuery(selectedShift?.id);
  const selectedMovements = useMemo(
    () => normalizeMovements(selectedMovementsQuery.data),
    [selectedMovementsQuery.data],
  );

  const soldItemsQuery = useQuery({
    queryKey: ["cashier-current-shift-sold-items", currentShift?.id],
    queryFn: () =>
      orderService.cashierSoldItems({
        cash_shift_id: currentShift?.id,
        per_page: 500,
      } as any),
    enabled: Boolean(currentShift?.id),
  });

  const selectedSoldItemsQuery = useQuery({
    queryKey: ["cashier-shift-detail-sold-items", selectedShift?.id],
    queryFn: () =>
      orderService.cashierSoldItems({
        cash_shift_id: selectedShift?.id,
        per_page: 500,
      } as any),
    enabled: Boolean(selectedShift?.id),
  });

  const soldRows = useMemo(
    () => paymentRowsFromPayments(soldItemsQuery.data?.data ?? []),
    [soldItemsQuery.data],
  );

  const selectedSoldRows = useMemo(
    () => paymentRowsFromPayments(selectedSoldItemsQuery.data?.data ?? []),
    [selectedSoldItemsQuery.data],
  );

  const selectedTotals = useMemo(
    () => paymentTotals(selectedSoldRows),
    [selectedSoldRows],
  );

  const openShift = useOpenShiftMutation(() => {
    setOpeningCash("0");
    setClosedSuccessfully(false);
  });

  const closeShift = useCloseShiftMutation(() => {
    setClosingCash("0");
    setClosedSuccessfully(true);
    toast.success("Shift successfully closed");
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
    closeShift.mutate({
      id: currentShift.id,
      closing_cash: Number(closingCash),
    });
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
          {!embedded && (
            <h1 className="text-2xl font-bold tracking-tight">
              Cash Shift Management
            </h1>
          )}
          <p className="text-muted-foreground">
            Open shift, record all payment methods, review sold items, and close
            cashier reconciliation.
          </p>
        </div>
        <Badge variant={currentShift ? "default" : "secondary"}>
          {currentShift ? `Open shift #${currentShift.id}` : "No open shift"}
        </Badge>
      </div>

      {!currentShift && closedSuccessfully && (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-950">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Shift successfully closed.</p>
              <p className="text-sm">
                The sold-items list is hidden. Open a new shift to start
                recording the next cashier session.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Opening Cash</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {money(currentShift?.opening_cash)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cash Payments</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {money(currentSummary?.cash_payments)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>All Payment Methods</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {money(currentSummary?.total_payments)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expected Cash</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {money(currentSummary?.expected_cash)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {currentShift ? "Close Current Shift" : "Open New Shift"}
            </CardTitle>
            <CardDescription>
              {currentShift
                ? "Enter actual cash counted in drawer. All payment methods remain recorded in the shift report."
                : "Enter starting cash in drawer before receiving payments."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!currentShift ? (
              <form onSubmit={handleOpen} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opening_cash">Opening Cash</Label>
                  <Input
                    id="opening_cash"
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={openShift.isPending}>
                  Open Shift
                </Button>
              </form>
            ) : (
              <form onSubmit={handleClose} className="space-y-4">
                <div className="grid gap-3 rounded-lg border p-4 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Opened:</span>{" "}
                    {dateTime(currentShift.opened_at)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cashier:</span>{" "}
                    {currentShift.cashier?.name ??
                      currentShift.cashier_name ??
                      "-"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Expected cash:
                    </span>{" "}
                    {money(currentSummary?.expected_cash)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payments:</span>{" "}
                    {currentSummary?.payments_count ?? 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Card:</span>{" "}
                    {money(currentSummary?.card_payments)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Mobile/Transfer:
                    </span>{" "}
                    {money(
                      Number(currentSummary?.mobile_payments ?? 0) +
                        Number(currentSummary?.transfer_payments ?? 0),
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing_cash">Closing Cash</Label>
                  <Input
                    id="closing_cash"
                    type="number"
                    min="0"
                    step="0.01"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={closeShift.isPending}>
                  Close Shift
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Movement</CardTitle>
            <CardDescription>
              Add cash drop, refund, paid-out, or opening adjustment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMovement} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Movement Type</Label>
                  <Select
                    value={movementType}
                    onValueChange={(value) =>
                      setMovementType(value as ShiftMovementType)
                    }
                    disabled={!currentShift}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opening_adjustment">
                        Opening Adjustment
                      </SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="paid_out">Paid Out</SelectItem>
                      <SelectItem value="cash_drop">Cash Drop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="movement_amount">Amount</Label>
                  <Input
                    id="movement_amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    disabled={!currentShift}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement_note">Note</Label>
                <Textarea
                  id="movement_note"
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  disabled={!currentShift}
                  placeholder="Reason or reference"
                />
              </div>
              <Button
                type="submit"
                disabled={!currentShift || createMovement.isPending}
              >
                Save Movement
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {currentShift ? (
        <Card>
          <CardHeader>
            <CardTitle>Sold Items Before Shift Close</CardTitle>
            <CardDescription>
              All paid items recorded by this cashier during the current open
              shift. Includes cash, card, mobile, and transfer payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SoldItemsTable
              rows={soldRows}
              loading={soldItemsQuery.isLoading}
              emptyMessage="No paid items recorded in this open shift yet."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Open shift required</CardTitle>
            <CardDescription>
              Open a new shift to start recording payments and view sold items
              for the session.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {currentShift && (
        <Card>
          <CardHeader>
            <CardTitle>Current Shift Movements</CardTitle>
            <CardDescription>
              Cash adjustments recorded during the open shift.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MovementsTable movements={currentMovements} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Shift History</CardTitle>
            <CardDescription>
              Recent cashier sessions. Open a detail row to review sold items
              and movements.
            </CardDescription>
          </div>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as "all" | "open" | "closed")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opening</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Closing</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No shifts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell>#{shift.id}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            shift.status === "open" ? "default" : "secondary"
                          }
                        >
                          {shift.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{money(shift.opening_cash)}</TableCell>
                      <TableCell>{money(shift.expected_cash)}</TableCell>
                      <TableCell>{money(shift.closing_cash)}</TableCell>
                      <TableCell>{money(shift.variance)}</TableCell>
                      <TableCell>{dateTime(shift.opened_at)}</TableCell>
                      <TableCell>{dateTime(shift.closed_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant={
                            String(selectedShiftId) === String(shift.id)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedShiftId(shift.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedShift && (
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Closed Shift Detail #{selectedShift.id}</CardTitle>
                <CardDescription>
                  Complete cashier shift information, sold items, and movements
                  for this session.
                </CardDescription>
              </div>
              <Badge
                variant={
                  selectedShift.status === "open" ? "default" : "secondary"
                }
              >
                {selectedShift.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Cashier</p>
                <p className="font-semibold">
                  {selectedShift.cashier?.name ??
                    selectedShift.cashier_name ??
                    "-"}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Opening Cash</p>
                <p className="font-semibold">
                  {money(selectedShift.opening_cash)}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Closing Cash</p>
                <p className="font-semibold">
                  {money(selectedShift.closing_cash)}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Variance</p>
                <p className="font-semibold">{money(selectedShift.variance)}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Expected Cash</p>
                <p className="font-semibold">
                  {money(
                    selectedShift.expected_cash ??
                      selectedShift.summary?.expected_cash,
                  )}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Sold Items</p>
                <p className="font-semibold">{selectedTotals.qty}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Sold Amount</p>
                <p className="font-semibold">{money(selectedTotals.total)}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Opened / Closed</p>
                <p className="text-sm font-semibold">
                  {dateTime(selectedShift.opened_at)} →{" "}
                  {dateTime(selectedShift.closed_at)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Sold Items for this Shift</h3>
                <p className="text-sm text-muted-foreground">
                  All paid items recorded under this shift, including all
                  payment methods.
                </p>
              </div>
              <SoldItemsTable
                rows={selectedSoldRows}
                loading={selectedSoldItemsQuery.isLoading}
                emptyMessage="No sold items found for this shift."
              />
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Shift Movements</h3>
                <p className="text-sm text-muted-foreground">
                  Opening adjustments, refunds, paid-outs, and cash drops
                  recorded in this shift.
                </p>
              </div>
              <MovementsTable movements={selectedMovements} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
