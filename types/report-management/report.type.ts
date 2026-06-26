export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type ReportFilters = {
  search?: string;
  date_from?: string;
  date_to?: string;
  branch_id?: number | string | "all";
  cashier_id?: number | string | "all";
  waiter_id?: number | string | "all";
  payment_method?: string | "all";
  status?: string | "all";
  page?: number;
  per_page?: number;
};

export type SalesReportRow = {
  date?: string;
  order_count?: number;
  gross_sales?: number | string;
  discount?: number | string;
  tax?: number | string;
  net_sales?: number | string;
  paid_amount?: number | string;
  unpaid_amount?: number | string;
  [key: string]: unknown;
};

export type PaymentSummaryRow = {
  method?: string;
  count?: number;
  total_amount?: number | string;
  refunded_amount?: number | string;
  net_amount?: number | string;
  [key: string]: unknown;
};

export type RefundSummaryRow = {
  payment_id?: number | string;
  amount?: number | string;
  reason?: string;
  refunded_by?: string;
  refunded_at?: string;
  [key: string]: unknown;
};

export type ShiftReconciliationRow = {
  shift_id?: number | string;
  cashier_name?: string;
  opening_cash?: number | string;
  expected_cash?: number | string;
  closing_cash?: number | string;
  variance?: number | string;
  opened_at?: string;
  closed_at?: string;
  [key: string]: unknown;
};

export type StockValuationRow = {
  item_id?: number | string;
  item_name?: string;
  unit?: string;
  current_stock?: number | string;
  average_purchase_price?: number | string;
  total_value?: number | string;
  [key: string]: unknown;
};

export type ReportEnvelope<T> = ApiEnvelope<{
  summary?: Record<string, unknown>;
  data: T[];
  meta?: Record<string, unknown>;
}>;
