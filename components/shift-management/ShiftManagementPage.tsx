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
  const itemRows = Array.isArray(report?.item_sales) ? report.item_sales : [];

  const escapeHtml = (value: unknown) =>
    String(value ?? "-")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const numberValue = (value: unknown) => {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) ? amount : 0;
  };

  const normalizePaymentFilter = (value: unknown) =>
    String(value ?? "cash")
      .toLowerCase()
      .includes("credit")
      ? "credit"
      : "cash";

  const normalizeCategoryFilter = (value: unknown) => {
    const text = String(value ?? "food").toLowerCase();
    return text.includes("drink") ||
      text.includes("bar") ||
      text.includes("beverage")
      ? "drink"
      : "food";
  };

  const displayPayment = (value: unknown) =>
    normalizePaymentFilter(value) === "credit" ? "Credit" : "Cash";

  const displayCategory = (row: any) => {
    const category = row?.category ?? row?.category_name ?? "Uncategorized";
    const type = normalizeCategoryFilter(row?.category_type ?? category);
    return `${category} (${type === "drink" ? "Drink" : "Food"})`;
  };

  const groupedBreakdownMap = new Map<string, any>();

  itemRows.forEach((row: any, index: number) => {
    const paymentMethod = normalizePaymentFilter(
      row?.payment_method ?? row?.payment_type,
    );
    const categoryType = normalizeCategoryFilter(
      row?.category_type ?? row?.category,
    );
    const categoryLabel = displayCategory(row);
    const item = row?.item_name ?? row?.name ?? row?.item ?? "-";
    const key = [paymentMethod, categoryType, categoryLabel, item].join("::");
    const existing = groupedBreakdownMap.get(key);

    if (existing) {
      existing.quantity += numberValue(row?.quantity ?? row?.qty);
      existing.amount += numberValue(
        row?.amount ?? row?.line_total ?? row?.total,
      );
      return;
    }

    groupedBreakdownMap.set(key, {
      key:
        row?.id ?? row?.order_item_id ?? `${row?.order_id ?? "order"}-${index}`,
      paymentMethod,
      paymentLabel: displayPayment(row?.payment_method ?? row?.payment_type),
      categoryType,
      categoryLabel,
      item,
      quantity: numberValue(row?.quantity ?? row?.qty),
      amount: numberValue(row?.amount ?? row?.line_total ?? row?.total),
    });
  });

  const breakdownRows = Array.from(groupedBreakdownMap.values()).sort(
    (a, b) => {
      const paymentCompare = String(a.paymentLabel).localeCompare(
        String(b.paymentLabel),
      );
      if (paymentCompare !== 0) return paymentCompare;
      const categoryCompare = String(a.categoryLabel).localeCompare(
        String(b.categoryLabel),
      );
      if (categoryCompare !== 0) return categoryCompare;
      return String(a.item).localeCompare(String(b.item));
    },
  );

  const breakdownRowsJson = JSON.stringify(breakdownRows).replace(
    /<\//g,
    "<\\/",
  );

  const cashRowsTotal = breakdownRows
    .filter((row) => row.paymentMethod === "cash")
    .reduce((total, row) => total + numberValue(row.amount), 0);
  const creditRowsTotal = breakdownRows
    .filter((row) => row.paymentMethod === "credit")
    .reduce((total, row) => total + numberValue(row.amount), 0);

  const cashSales = numberValue(
    report?.cash_sales ?? summary.cash_payments ?? cashRowsTotal,
  );
  const creditSales = numberValue(
    report?.credit_sales ?? summary.credit_amount ?? creditRowsTotal,
  );
  const openingCash = numberValue(report?.opening_cash);
  const cashReceived = cashRowsTotal || cashSales;
  const creditPaymentAmount = creditRowsTotal || creditSales;
  const totalCash = openingCash + cashReceived;

  const html = `
  <html>
    <head>
      <title>${kind}-Report</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;margin:0;padding:22px;color:#1f1a17;background:#fff7ed}
        .sheet{max-width:1120px;margin:0 auto;background:#fff;border:1px solid #c9b59a;box-shadow:0 12px 30px rgba(0,0,0,.08)}
        .report-head{padding:18px 22px;border-bottom:2px solid #9a5a2f;text-align:center;background:#f8efe2}
        h1,h2,h3{margin:0}.report-head h1{font-size:24px;letter-spacing:3px}.subtitle{margin-top:6px;color:#6b5b4c;font-size:13px}
        .meta{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #d8c7af}
        .meta div{padding:10px 12px;border-right:1px solid #d8c7af;border-bottom:1px solid #eadfce;font-size:12px}.meta div:nth-child(3n){border-right:0}
        .label{display:block;color:#7a6957;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.value{font-weight:700;margin-top:3px}
        .section{padding:16px 22px}.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.section-title h3{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#4c2f1f}
        table{width:100%;border-collapse:collapse;background:#fff;font-size:12px}th,td{border:1px solid #d8c7af;padding:7px 8px;text-align:left;vertical-align:top}th{background:#f1dec7;font-weight:700;color:#3f281b}.right{text-align:right}.center{text-align:center}.muted{color:#7a6957}
        .total-row td{background:#f8efe2;font-weight:800}.filter-row{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px}.filter-row label{font-size:11px;font-weight:700;color:#4c2f1f;text-transform:uppercase;letter-spacing:.04em}.filter-row select{margin-left:6px;border:1px solid #d8c7af;background:#fff;padding:5px 8px;border-radius:4px}.hidden-row{display:none}.cash-summary{max-width:560px;margin-left:auto}.footer-note{padding:0 22px 18px;color:#7a6957;font-size:11px}.pagination{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;font-size:12px}.pagination button{border:1px solid #d8c7af;background:#fff;padding:6px 10px;border-radius:6px;font-weight:700}.pagination button:disabled{opacity:.45;cursor:not-allowed}.pagination .pager-actions{display:flex;gap:8px}.totals-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.total-card{border:1px solid #d8c7af;background:#fff;padding:10px 12px}.total-card .amount{font-size:16px;font-weight:800;text-align:right}@media(max-width:900px){.totals-grid{grid-template-columns:repeat(2,1fr)}}
        @media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border:0;max-width:none}.no-print{display:none}}
        @media(max-width:760px){body{padding:10px}.meta{grid-template-columns:1fr}.meta div{border-right:0}.section{padding:14px}.report-head{padding:14px}.cash-summary{max-width:none;margin-left:0}}
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="report-head">
          <h1>${kind}-REPORT</h1>
          <div class="subtitle">${kind === "X" ? "Current shift reading report - totals are not reset" : "Closed shift final report"}</div>
        </div>

        <div class="meta">
          <div><span class="label">Shift Number</span><div class="value">#${escapeHtml(report?.id ?? "-")}</div></div>
          <div><span class="label">Cashier</span><div class="value">${escapeHtml(report?.cashier_name ?? report?.cashier?.name ?? "-")}</div></div>
          <div><span class="label">Branch</span><div class="value">${escapeHtml(report?.branch ?? "Restaurant")}</div></div>
          <div><span class="label">Status</span><div class="value">${escapeHtml(report?.final_shift_status ?? report?.status ?? "-")}</div></div>
          <div><span class="label">Open Time</span><div class="value">${dateTime(report?.opened_at ?? report?.open_time)}</div></div>
          <div><span class="label">${kind === "Z" ? "Close Time" : "Current Time"}</span><div class="value">${dateTime(kind === "Z" ? (report?.closed_at ?? report?.close_time) : report?.current_time)}</div></div>
        </div>

        <div class="section">
          <div class="section-title">
            <h3>Sales Breakdown</h3>
            <span class="muted">Order item sales by payment method and category</span>
          </div>
          <div class="filter-row no-print">
            <label>Payment Method
              <select id="payment-filter">
                <option value="all">All</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
              </select>
            </label>
            <label>Category
              <select id="category-filter">
                <option value="all">All</option>
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
            </label>
          </div>
          <table>
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Categories</th>
                <th>Items</th>
                <th class="right">Quantity</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody id="sales-breakdown-body"><tr><td colspan="5" class="center muted">Loading sales breakdown...</td></tr></tbody>
          </table>
          <div class="pagination no-print">
            <span id="pagination-info">Showing 0 records</span>
            <div class="pager-actions">
              <button type="button" id="prev-page">Previous</button>
              <button type="button" id="next-page">Next</button>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title"><h3>Cash / Credit Totals</h3></div>
          <div class="totals-grid">
            <div class="total-card"><span class="label">Opening Cash</span><div class="amount">${money(openingCash)}</div></div>
            <div class="total-card"><span class="label">Cash Received</span><div class="amount">${money(cashReceived)}</div></div>
            <div class="total-card"><span class="label">Total Cash</span><div class="amount">${money(totalCash)}</div></div>
            <div class="total-card"><span class="label">Credit Payment Amount</span><div class="amount">${money(creditPaymentAmount)}</div></div>
          </div>
        </div>

        <div class="footer-note">Generated from cashier shift orders. ${kind === "X" ? "X-Report does not close or reset the shift." : "Z-Report is generated after shift close."}</div>
      </div>
      <script>
        (function(){
          var paymentFilter = document.getElementById('payment-filter');
          var categoryFilter = document.getElementById('category-filter');
          var prevButton = document.getElementById('prev-page');
          var nextButton = document.getElementById('next-page');
          var info = document.getElementById('pagination-info');
          var page = 1;
          var perPage = 12;
          var rowsData = ${breakdownRowsJson};
          var body = document.getElementById('sales-breakdown-body');

          function formatMoney(value){
            var amount = Number(value || 0);
            return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
          }

          function safeText(value){
            return String(value == null ? '-' : value)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          }

          function filteredRows(){
            var payment = paymentFilter ? paymentFilter.value : 'all';
            var category = categoryFilter ? categoryFilter.value : 'all';
            return rowsData.filter(function(row){
              return (payment === 'all' || row.paymentMethod === payment) && (category === 'all' || row.categoryType === category);
            });
          }

          function rowSpan(rows, start, keys){
            var count = 1;
            for(var i = start + 1; i < rows.length; i += 1){
              var sameGroup = keys.every(function(key){
                return rows[i][key] === rows[start][key];
              });
              if(!sameGroup){ break; }
              count += 1;
            }
            return count;
          }

          function renderRows(rows){
            if(!body){ return; }
            if(!rows.length){
              body.innerHTML = '<tr><td colspan="5" class="center muted">No sales breakdown data</td></tr>';
              return;
            }

            var html = '';
            rows.forEach(function(row, index){
              var paymentCell = '';
              var categoryCell = '';

              if(index === 0 || rows[index - 1].paymentLabel !== row.paymentLabel){
                paymentCell = '<td rowspan="' + rowSpan(rows, index, ['paymentLabel']) + '">' + safeText(row.paymentLabel) + '</td>';
              }

              if(index === 0 || rows[index - 1].paymentLabel !== row.paymentLabel || rows[index - 1].categoryLabel !== row.categoryLabel){
                categoryCell = '<td rowspan="' + rowSpan(rows, index, ['paymentLabel', 'categoryLabel']) + '">' + safeText(row.categoryLabel) + '</td>';
              }

              html += '<tr>'
                + paymentCell
                + categoryCell
                + '<td>' + safeText(row.item) + '</td>'
                + '<td class="right">' + safeText(row.quantity) + '</td>'
                + '<td class="right">' + formatMoney(row.amount) + '</td>'
                + '</tr>';
            });

            body.innerHTML = html;
          }

          function applyFilters(){
            var rows = filteredRows();
            var totalPages = Math.max(1, Math.ceil(rows.length / perPage));
            if(page > totalPages){ page = totalPages; }
            var start = (page - 1) * perPage;
            var end = start + perPage;
            renderRows(rows.slice(start, end));
            if(info){
              info.textContent = rows.length
                ? 'Showing ' + (start + 1) + '-' + Math.min(end, rows.length) + ' of ' + rows.length + ' grouped order items'
                : 'Showing 0 grouped order items';
            }
            if(prevButton){ prevButton.disabled = page <= 1; }
            if(nextButton){ nextButton.disabled = page >= totalPages; }
          }

          function resetAndApply(){ page = 1; applyFilters(); }
          if(paymentFilter){ paymentFilter.addEventListener('change', resetAndApply); }
          if(categoryFilter){ categoryFilter.addEventListener('change', resetAndApply); }
          if(prevButton){ prevButton.addEventListener('click', function(){ if(page > 1){ page -= 1; applyFilters(); } }); }
          if(nextButton){ nextButton.addEventListener('click', function(){ page += 1; applyFilters(); }); }
          applyFilters();
        })();
      </script>
    </body>
  </html>`;
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
  const [reportPreview, setReportPreview] = useState<{
    title: string;
    html: string;
  } | null>(null);
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
      setReportPreview({
        title: "Z-Report",
        html: printShiftReport(report.data, "Z") ?? "",
      });
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
      setReportPreview({
        title: "X-Report",
        html: printShiftReport(report.data, "X") ?? "",
      });
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
                <CardDescription>
                  Excel-format cashier report preview.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const frame = document.getElementById(
                      "shift-report-frame",
                    ) as HTMLIFrameElement | null;
                    frame?.contentWindow?.focus();
                    frame?.contentWindow?.print();
                  }}
                >
                  Print
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setReportPreview(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(90vh-92px)] p-0">
              <iframe
                id="shift-report-frame"
                title={reportPreview.title}
                srcDoc={reportPreview.html}
                className="h-full w-full bg-white"
              />
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
                Shift detail only is shown here. Cash Sales Items and Credit
                Sales Items are removed from the detail popup.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
