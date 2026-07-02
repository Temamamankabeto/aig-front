"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  FileText,
  MoreHorizontal,
  Printer,
  X,
} from "lucide-react";
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
import { shiftService } from "@/services/shift-management/shift.service";
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

function printShiftReport(report: any, kind: "X" | "Z") {
  const summary = report?.summary ?? {};
  const paymentRows = Array.isArray(report?.payment_method_breakdown)
    ? report.payment_method_breakdown
    : [];
  const categoryRows = Array.isArray(report?.category_sales)
    ? report.category_sales
    : [];
  const itemRows = Array.isArray(report?.item_sales) ? report.item_sales : [];

  const rowsHtml = (rows: any[], cols: string[]) =>
    rows.length
      ? rows
          .map(
            (row) =>
              `<tr>${cols
                .map((col) => `<td>${row?.[col] ?? "-"}</td>`)
                .join("")}</tr>`,
          )
          .join("")
      : `<tr><td colspan="${cols.length}">No data</td></tr>`;

  const html = `
  <html><head><title>${kind}-Report</title><style>
    body{font-family:Arial,sans-serif;padding:20px;color:#111}.center{text-align:center}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.box{border:1px solid #ddd;padding:8px;border-radius:8px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left}.right{text-align:right}.section{margin-top:16px}h1,h2,h3{margin:4px 0}@media print{body{padding:0}.no-print{display:none}}
  </style></head><body>
    <div class="center"><h1>${kind}-REPORT</h1><p>${kind === "X" ? "Reading report - totals are not reset" : "Closing report - final shift totals"}</p></div>
    <div class="grid">
      <div class="box"><strong>Shift Number:</strong> #${report?.id ?? "-"}</div>
      <div class="box"><strong>Cashier:</strong> ${report?.cashier_name ?? report?.cashier?.name ?? "-"}</div>
      <div class="box"><strong>Branch:</strong> ${report?.branch ?? "Restaurant"}</div>
      <div class="box"><strong>Status:</strong> ${report?.final_shift_status ?? report?.status ?? "-"}</div>
      <div class="box"><strong>Open Time:</strong> ${dateTime(report?.opened_at ?? report?.open_time)}</div>
      <div class="box"><strong>${kind === "Z" ? "Close Time" : "Current Time"}:</strong> ${dateTime(kind === "Z" ? (report?.closed_at ?? report?.close_time) : report?.current_time)}</div>
    </div>
    <div class="section"><h3>Sales Summary</h3><table><tbody>
      <tr><td>Total Orders</td><td class="right">${report?.total_orders ?? 0}</td></tr>
      <tr><td>Cash Sales</td><td class="right">${money(report?.cash_sales ?? summary.cash_payments)}</td></tr>
      <tr><td>Credit Sales</td><td class="right">${money(report?.credit_sales ?? summary.credit_amount)}</td></tr>
      <tr><td>Card Sales</td><td class="right">${money(report?.card_sales ?? summary.card_payments)}</td></tr>
      <tr><td>Mobile Money</td><td class="right">${money(report?.mobile_money_sales ?? summary.mobile_payments)}</td></tr>
      <tr><td>Bank</td><td class="right">${money(report?.bank_sales ?? summary.bank_payments)}</td></tr>
      <tr><td>VAT</td><td class="right">${money(report?.vat)}</td></tr>
      <tr><td>Service Charge</td><td class="right">${money(report?.service_charge)}</td></tr>
      <tr><td>Discounts</td><td class="right">${money(report?.discounts)}</td></tr>
      <tr><td>Voided Orders</td><td class="right">${report?.voided_orders ?? 0}</td></tr>
      <tr><td>Refunded Orders</td><td class="right">${report?.refunded_orders ?? 0}</td></tr>
      <tr><td><strong>Gross Sales</strong></td><td class="right"><strong>${money(report?.gross_sales)}</strong></td></tr>
      <tr><td><strong>Net Sales</strong></td><td class="right"><strong>${money(report?.net_sales)}</strong></td></tr>
    </tbody></table></div>
    <div class="section"><h3>Drawer / Cash Reconciliation</h3><table><tbody>
      <tr><td>Opening Cash</td><td class="right">${money(report?.opening_cash)}</td></tr>
      <tr><td>Expected Cash</td><td class="right">${money(report?.expected_cash ?? summary.expected_cash)}</td></tr>
      <tr><td>Actual Counted Cash</td><td class="right">${money(report?.actual_cash)}</td></tr>
      <tr><td>Cash Difference</td><td class="right">${money(report?.cash_difference ?? summary.variance)}</td></tr>
    </tbody></table></div>
    <div class="section"><h3>Payment Method Breakdown</h3><table><thead><tr><th>Method</th><th>Transactions</th><th>Amount</th></tr></thead><tbody>${rowsHtml(paymentRows, ["method", "transactions", "amount"])}</tbody></table></div>
    <div class="section"><h3>Category-wise Sales</h3><table><thead><tr><th>Category</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rowsHtml(categoryRows, ["category", "quantity", "amount"])}</tbody></table></div>
    <div class="section"><h3>Item-wise Sales</h3><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rowsHtml(itemRows, ["item_name", "quantity", "amount"])}</tbody></table></div>
    <div class="grid section"><div class="box"><strong>Cashier Signature</strong><br/><br/>___________________</div><div class="box"><strong>Manager Signature</strong><br/><br/>___________________</div></div>
  </body></html>`;
  return html;
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
    receiptNo:
      row.bill_number ??
      row.receipt_no ??
      row.reference ??
      `PAY-${row.payment_id ?? "—"}`,
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

function splitSaleRows(rows: ReturnType<typeof paymentRowsFromPayments>) {
  const creditMethods = new Set(["credit", "credit_order", "corporate_credit"]);

  return rows.reduce(
    (acc, row) => {
      const method = String(row.method ?? "").toLowerCase();
      if (creditMethods.has(method)) {
        acc.credit.push(row);
      } else {
        acc.cash.push(row);
      }
      return acc;
    },
    {
      cash: [] as ReturnType<typeof paymentRowsFromPayments>,
      credit: [] as ReturnType<typeof paymentRowsFromPayments>,
    },
  );
}

function ActionMenu({
  shift,
  isCurrentShift,
  onDetail,
  onXReport,
  onMovements,
  onCashMovement,
  onCloseShift,
  disabled,
}: {
  shift: CashShift;
  isCurrentShift: boolean;
  onDetail: () => void;
  onXReport: () => void;
  onMovements: () => void;
  onCashMovement: () => void;
  onCloseShift: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const run = (callback: () => void) => {
    callback();
    setOpen(false);
  };

  return (
    <div className="relative inline-flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Open actions for shift ${shift.id}`}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg">
          <button
            type="button"
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => run(onDetail)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Detail
          </button>

          {isCurrentShift && shift.status === "open" && (
            <>
              <button
                type="button"
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                disabled={disabled}
                onClick={() => run(onXReport)}
              >
                <FileText className="mr-2 h-4 w-4" />
                X-Report
              </button>

              <button
                type="button"
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => run(onMovements)}
              >
                Current Shift Movements
              </button>

              <button
                type="button"
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => run(onCashMovement)}
              >
                Cash Movement
              </button>

              <button
                type="button"
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
                onClick={() => run(onCloseShift)}
              >
                <Printer className="mr-2 h-4 w-4" />
                Close Current Shift
              </button>
            </>
          )}
        </div>
      )}
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
  const [reportPreview, setReportPreview] = useState<{ title: string; html: string } | null>(null);
  const [movementType, setMovementType] =
    useState<ShiftMovementType>("opening_adjustment");
  const [movementAmount, setMovementAmount] = useState("0");
  const [movementNote, setMovementNote] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const [closedSuccessfully, setClosedSuccessfully] = useState(false);
  const [reportPrinting, setReportPrinting] = useState<"x" | "z" | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<
    number | string | null
  >(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [cashMovementOpen, setCashMovementOpen] = useState(false);
  const [openShiftOpen, setOpenShiftOpen] = useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);

  const currentQuery = useCurrentShiftQuery();
  const currentShift = currentQuery.data?.data ?? null;
  const currentSummary = currentShift?.summary;

  const shiftsQuery = useShiftsQuery({ status, per_page: 20 });
  const historyShifts = shiftsQuery.data?.data ?? [];

  const shifts = useMemo(() => {
    if (!currentShift) return historyShifts;
    const exists = historyShifts.some(
      (shift) => String(shift.id) === String(currentShift.id),
    );
    return exists ? historyShifts : [currentShift, ...historyShifts];
  }, [currentShift, historyShifts]);

  const selectedShift = useMemo<CashShift | null>(() => {
    if (!selectedShiftId) return null;
    const historyShift = shifts.find(
      (shift) => String(shift.id) === String(selectedShiftId),
    );
    if (historyShift) return historyShift;
    if (currentShift && String(currentShift.id) === String(selectedShiftId)) {
      return currentShift;
    }
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

  const selectedSoldItemsQuery = useQuery({
    queryKey: ["cashier-shift-detail-sold-items", selectedShift?.id],
    queryFn: () =>
      orderService.cashierSoldItems({
        cash_shift_id: selectedShift?.id,
        per_page: 500,
      } as any),
    enabled: Boolean(selectedShift?.id),
  });

  const selectedSoldRows = useMemo(
    () => paymentRowsFromPayments(selectedSoldItemsQuery.data?.data ?? []),
    [selectedSoldItemsQuery.data],
  );

  const selectedSales = useMemo(
    () => splitSaleRows(selectedSoldRows),
    [selectedSoldRows],
  );

  const selectedTotals = useMemo(
    () => paymentTotals(selectedSoldRows),
    [selectedSoldRows],
  );

  const selectedCashTotals = useMemo(
    () => paymentTotals(selectedSales.cash),
    [selectedSales.cash],
  );

  const selectedCreditTotals = useMemo(
    () => paymentTotals(selectedSales.credit),
    [selectedSales.credit],
  );

  const openShift = useOpenShiftMutation(() => {
    setOpeningCash("0");
    setOpenShiftOpen(false);
    setClosedSuccessfully(false);
  });

  const closeShift = useCloseShiftMutation(() => {
    setClosingCash("0");
    setCloseShiftOpen(false);
    setClosedSuccessfully(true);
    toast.success("Shift successfully closed");
  });

  const createMovement = useCreateShiftMovementMutation(() => {
    setMovementAmount("0");
    setMovementNote("");
    setCashMovementOpen(false);
  });

  function handleOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openShift.mutate({ opening_cash: Number(openingCash) });
  }

  async function handleClose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentShift?.id) return;
    try {
      setReportPrinting("z");
      await closeShift.mutateAsync({
        id: currentShift.id,
        closing_cash: Number(closingCash),
      });
      const report = await shiftService.zReport(currentShift.id);
      setReportPreview({ title: "Z-Report", html: printShiftReport(report.data, "Z") ?? "" });
    } catch (error) {
      console.error(error);
    } finally {
      setReportPrinting(null);
    }
  }

  async function handleXReport() {
    try {
      setReportPrinting("x");
      const report = await shiftService.xReport();
      setReportPreview({ title: "X-Report", html: printShiftReport(report.data, "X") ?? "" });
    } catch (error) {
      console.error(error);
      toast.error("Unable to generate X-Report");
    } finally {
      setReportPrinting(null);
    }
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

  const openDetail = (shift: CashShift) => {
    setSelectedShiftId(shift.id);
    setDetailOpen(true);
  };

  const openMovements = (shift: CashShift) => {
    setSelectedShiftId(shift.id);
    setMovementsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          {!embedded && (
            <h1 className="text-2xl font-bold tracking-tight">
              X-Report / Shift Reading
            </h1>
          )}
          <p className="text-muted-foreground">
            Use Shift History to inspect cashier sessions, print X-Reports, and
            manage the current open shift without resetting totals.
          </p>
        </div>

        {!currentShift && (
          <Button type="button" onClick={() => setOpenShiftOpen(true)}>
            Open Shift
          </Button>
        )}
      </div>

      {!currentShift && closedSuccessfully && (
        <Card className="border-emerald-200 bg-emerald-50 text-emerald-950">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Shift successfully closed.</p>
              <p className="text-sm">
                Open a new shift to start the next cashier sales period.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Shift History</CardTitle>
            <CardDescription>
              All report actions are available from the three-dot action menu.
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
                  <TableHead>Cashier</TableHead>
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
                {shiftsQuery.isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-20 text-center text-muted-foreground"
                    >
                      Loading shifts...
                    </TableCell>
                  </TableRow>
                ) : shifts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-20 text-center text-muted-foreground"
                    >
                      No shifts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((shift) => {
                    const isCurrentShift =
                      Boolean(currentShift?.id) &&
                      String(currentShift?.id) === String(shift.id);

                    return (
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
                        <TableCell>
                          {shift.cashier?.name ?? shift.cashier_name ?? "-"}
                        </TableCell>
                        <TableCell>{money(shift.opening_cash)}</TableCell>
                        <TableCell>
                          {money(
                            shift.expected_cash ?? shift.summary?.expected_cash,
                          )}
                        </TableCell>
                        <TableCell>{money(shift.closing_cash)}</TableCell>
                        <TableCell>{money(shift.variance)}</TableCell>
                        <TableCell>{dateTime(shift.opened_at)}</TableCell>
                        <TableCell>{dateTime(shift.closed_at)}</TableCell>
                        <TableCell className="text-right">
                          <ActionMenu
                            shift={shift}
                            isCurrentShift={isCurrentShift}
                            disabled={reportPrinting === "x"}
                            onDetail={() => openDetail(shift)}
                            onXReport={handleXReport}
                            onMovements={() => openMovements(shift)}
                            onCashMovement={() => setCashMovementOpen(true)}
                            onCloseShift={() => setCloseShiftOpen(true)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {openShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Open New Shift</CardTitle>
                <CardDescription>
                  Enter starting cash in drawer before receiving payments.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpenShiftOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      )}

      {closeShiftOpen && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Close Current Shift #{currentShift.id}</CardTitle>
                <CardDescription>
                  Enter actual cash counted in drawer. Z-Report prints and the
                  shift closes permanently.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCloseShiftOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
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
                <Button
                  type="submit"
                  disabled={closeShift.isPending || reportPrinting === "z"}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {reportPrinting === "z"
                    ? "Closing & printing..."
                    : "Print Z-Report & Close Shift"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {cashMovementOpen && currentShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Cash Movement</CardTitle>
                <CardDescription>
                  Add cash drop, refund, paid-out, or opening adjustment for the
                  current shift.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCashMovementOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
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
                    placeholder="Reason or reference"
                  />
                </div>
                <Button type="submit" disabled={createMovement.isPending}>
                  Save Movement
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {movementsOpen && selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Shift Movements #{selectedShift.id}</CardTitle>
                <CardDescription>
                  Opening adjustments, refunds, paid-outs, and cash drops
                  recorded in this shift.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMovementsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <MovementsTable
                movements={
                  String(selectedShift.id) === String(currentShift?.id)
                    ? currentMovements
                    : selectedMovements
                }
              />
            </CardContent>
          </Card>
        </div>
      )}

      {reportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="h-[90vh] w-full max-w-6xl overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b">
              <div>
                <CardTitle>{reportPreview.title}</CardTitle>
                <CardDescription>Excel-format cashier report preview.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  const frame = document.getElementById('shift-report-frame') as HTMLIFrameElement | null;
                  frame?.contentWindow?.focus();
                  frame?.contentWindow?.print();
                }}>Print</Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setReportPreview(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(90vh-92px)] p-0">
              <iframe id="shift-report-frame" title={reportPreview.title} srcDoc={reportPreview.html} className="h-full w-full bg-white" />
            </CardContent>
          </Card>
        </div>
      )}

      {detailOpen && selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-6xl overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Shift Detail #{selectedShift.id}</CardTitle>
                <CardDescription>
                  Complete cashier shift information with cash and credit sold
                  items separated.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedShift.status === "open" ? "default" : "secondary"
                  }
                >
                  {selectedShift.status}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetailOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
                  <p className="text-xs text-muted-foreground">Expected Cash</p>
                  <p className="font-semibold">
                    {money(
                      selectedShift.expected_cash ??
                        selectedShift.summary?.expected_cash,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Variance</p>
                  <p className="font-semibold">
                    {money(selectedShift.variance)}
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Cash Sales</p>
                  <p className="font-semibold">
                    {money(selectedCashTotals.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCashTotals.qty} items
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Credit Sales</p>
                  <p className="font-semibold">
                    {money(selectedCreditTotals.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCreditTotals.qty} items
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Total Sold</p>
                  <p className="font-semibold">{money(selectedTotals.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTotals.qty} items
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">
                    Opened / Closed
                  </p>
                  <p className="text-sm font-semibold">
                    {dateTime(selectedShift.opened_at)} →{" "}
                    {dateTime(selectedShift.closed_at)}
                  </p>
                </div>
              </div>

              <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                Shift detail only is shown here. Cash Sales Items and Credit Sales Items are removed from the detail popup.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
