export type TableStatus = "available" | "occupied" | "reserved" | "cleaning" | "out_of_service" | string;

export type TableOperationalStatus =
  | "inactive"
  | "available"
  | "reserved"
  | "occupied"
  | "pending_order"
  | "order_in_progress"
  | "awaiting_bill"
  | "awaiting_payment"
  | "cleaning"
  | "out_of_service"
  | string;

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type TableSummary = Partial<Record<TableStatus | TableOperationalStatus | string, number>> & {
  total?: number;
  active?: number;
  inactive?: number;
  available?: number;
  occupied?: number;
  reserved?: number;
  cleaning?: number;
  out_of_service?: number;
  by_status?: Record<string, number>;
  status_counts?: Record<string, number>;
  total_tables?: number;
  active_tables?: number;
  inactive_tables?: number;
  public_tables?: number;
  section_counts?: Record<string, number>;
};

export type PaginatedResponse<T> = {
  success?: boolean;
  message?: string;
  data: T[];
  meta: PaginationMeta;
  summary?: TableSummary;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type TableWaiter = {
  id: number | string;
  name?: string | null;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_image_url?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  roles?: Array<string | { name?: string | null }>;
  [key: string]: unknown;
};

export type DiningTable = {
  id: number | string;
  table_number?: string;
  number?: string;
  name?: string | null;
  capacity?: number | string | null;
  section?: string | null;
  status?: TableStatus;
  operational_status?: TableOperationalStatus;
  waiter_id?: number | string | null;
  assigned_waiter_id?: number | string | null;
  assigned_waiter?: TableWaiter | null;
  waiter?: TableWaiter | null;
  waiters?: TableWaiter[];
  is_active?: boolean | number;
  active?: boolean | number;
  is_public?: boolean | number;
  sort_order?: number | string | null;
  current_order_id?: number | string | null;
  orders_count?: number;
  active_orders_count?: number;
  active_order?: unknown;
  bill?: unknown;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type TableListParams = {
  search?: string;
  section?: string;
  status?: TableStatus | "all";
  active?: "all" | 0 | 1 | boolean | string;
  is_active?: "all" | 0 | 1 | boolean | string;
  is_public?: "all" | 0 | 1 | boolean | string;
  waiter_id?: number | string;
  page?: number;
  per_page?: number;
};

export type TableFilters = TableListParams;

export type TablePayload = {
  table_number?: string;
  number?: string;
  name?: string | null;
  capacity?: number | string | null;
  section?: string | null;
  status?: TableStatus;
  is_active?: boolean | number;
  is_public?: boolean | number;
  sort_order?: number | string | null;
  waiter_id?: number | string | null;
  waiter_ids?: Array<number | string>;
};

export type AssignWaiterPayload = {
  waiter_id: number | string;
};

export type AssignWaitersPayload = {
  waiter_ids: Array<number | string>;
};

export type BulkAssignTablesPayload = {
  waiter_id: number | string;
  table_ids: Array<number | string>;
  remove_table_ids?: Array<number | string>;
};

export type TransferTablePayload = {
  to_table_id: number | string;
  note?: string;
};

export type TransferWaitersPayload = {
  to_waiter_ids: Array<number | string>;
};

export type TransferOrdersPayload = {
  to_table_id: number | string;
  move_waiters?: boolean;
  note?: string;
};

export type UpdateTableStatusPayload = {
  status: TableStatus;
};

export type TableHistoryRow = {
  id: number | string;
  action?: string;
  type?: string;
  status?: string;
  note?: string | null;
  description?: string | null;
  actor?: TableWaiter | null;
  date?: string;
  created_at?: string;
  [key: string]: unknown;
};
