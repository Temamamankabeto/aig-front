export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type PaginatedResponse<T> = {
  success?: boolean;
  message?: string;
  data: T[];
  meta: PaginationMeta;
};

export type ShiftStatus = "open" | "closed";

export type ShiftMovementType =
  | "opening_adjustment"
  | "refund"
  | "paid_out"
  | "cash_drop";

export type ShiftFilters = {
  search?: string;
  status?: ShiftStatus | "all";
  cashier_id?: number | string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
};

export type ShiftSummary = {
  payments_count: number;
  cash_payments: number | string;
  card_payments: number | string;
  mobile_payments: number | string;
  transfer_payments: number | string;
  total_payments: number | string;
  opening_adjustments: number | string;
  cash_refunds: number | string;
  paid_out_expenses: number | string;
  cash_drops: number | string;
  expected_cash: number | string;
  variance?: number | string | null;
};

export type CashShift = {
  id: number | string;
  cashier_id?: number | string;
  cashier_name?: string;
  cashier?: {
    id: number | string;
    name: string;
    email?: string;
  } | null;

  status: ShiftStatus;

  opening_cash: number | string;
  closing_cash?: number | string | null;
  expected_cash?: number | string | null;
  variance?: number | string | null;

  opened_at?: string;
  closed_at?: string | null;
  notes?: string | null;

  summary?: ShiftSummary;
};

export type CashShiftMovement = {
  id: number | string;
  cash_shift_id: number | string;

  created_by?: number | string | null;
  creator?: {
    id: number | string;
    name: string;
  } | null;

  type: ShiftMovementType;
  amount: number | string;

  note?: string | null;
  reference_type?: string | null;
  reference_id?: number | string | null;

  created_at?: string;
};

export type OpenShiftPayload = {
  opening_cash: number;
};

export type CloseShiftPayload = {
  id: number | string;
  closing_cash: number;
};

export type CreateShiftMovementPayload = {
  shiftId: number | string;
  type: ShiftMovementType;
  amount: number;
  note?: string;
};

/**
 * Flexible report type (API is not consistent)
 */
export type ShiftReport = CashShift & {
  shift?: CashShift;
  cash_sales?: number | string;
  non_cash_sales?: number | string;
  total_sales?: number | string;
  [key: string]: unknown;
};