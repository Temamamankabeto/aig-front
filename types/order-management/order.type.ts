export type Id = string | number;

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from?: number | null;
  to?: number | null;
  report?: {
    total_orders?: number;
    total_cost?: number | string;
    [key: string]: unknown;
  };
};

export type PaginatedResponse<T> = {
  success?: boolean;
  message?: string;
  data: T[];
  meta: PaginationMeta;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type OrderScope = "waiter" | "cashier" | "admin" | "public";
export type PaymentType = "cash" | "card" | "mobile" | "transfer" | "credit" | "regular";
export type PaymentMethod = Exclude<PaymentType, "credit" | "regular">;
export type OrderType = "dine_in" | "takeaway" | "delivery";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "in_progress"
  | "ready"
  | "served"
  | "completed"
  | "cancel_requested"
  | "cancelled"
  | "void";

export type BillStatus = "draft" | "issued" | "partial" | "paid" | "void" | "overdue" | string;
export type CreditStatus = "credit_pending" | "credit_approved" | "partially_settled" | "fully_settled" | "overdue" | "blocked" | string;

export type OrderFilters = {
  search?: string;
  status?: string;
  payment_type?: string;
  payment_status?: string;
  order_type?: string;
  period?: "today" | "this_week" | "this_month" | "this_year" | "custom" | string;
  date_from?: string;
  date_to?: string;
  credit_account_id?: Id;
  page?: number;
  per_page?: number;
  active?: boolean | number | string;
};

export type MenuFilters = {
  search?: string;
  type?: "food" | "drink" | "all" | string;
  category_id?: Id;
  page?: number;
  per_page?: number;
};

export type TableFilters = {
  search?: string;
  status?: "available" | "occupied" | "reserved" | "cleaning" | "all" | string;
  section?: string;
  available_only?: boolean | number;
};

export type LiteUser = {
  id: Id;
  name?: string;
  email?: string;
  role?: string;
};

export type LiteTable = {
  id: Id;
  table_number?: string;
  name?: string;
  capacity?: number;
  section?: string | null;
  status?: string;
  is_active?: boolean | number;
  is_available?: boolean;
};

export type OrderMenuItem = {
  id: Id;
  name: string;
  type?: "food" | "drink" | string;
  price?: number | string;
  description?: string | null;
  category?: string | { id?: Id; name?: string } | null;
  image?: string | null;
  image_path?: string | null;
  image_url?: string | null;
  is_available?: boolean | number;
  is_active?: boolean | number;
};

export type OrderItemPayload = {
  menu_item_id: Id;
  quantity: number;
  notes?: string | null;
  note?: string | null;
  modifiers?: unknown[];
};

export type OrderPayload = {
  table_id?: Id | null;
  customer_id?: Id | null;
  customer_name?: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  order_type?: OrderType;
  payment_type?: PaymentType;
  waiter_id?: Id | null;
  credit_account_id?: Id | null;
  credit_account_user_id?: Id | null;
  credit_account_user_ids?: Id[];
  credit_notes?: string | null;
  notes?: string | null;
  discount?: number;
  items: OrderItemPayload[];
};

export type OrderItem = {
  id: Id;
  order_id?: Id;
  menu_item_id?: Id;
  menu_item?: OrderMenuItem | null;
  menuItem?: OrderMenuItem | null;
  name?: string;
  quantity: number;
  unit_price?: number | string;
  line_total?: number | string;
  total_price?: number | string;
  station?: "kitchen" | "bar" | string;
  item_status?: string;
  notes?: string | null;
  modifiers?: unknown[] | null;
  started_at?: string | null;
  ready_at?: string | null;
  served_at?: string | null;
};

export type Bill = {
  id: Id;
  order_id?: Id;
  bill_number?: string;
  subtotal?: number | string;
  tax?: number | string;
  service_charge?: number | string;
  discount?: number | string;
  total?: number | string;
  paid_amount?: number | string;
  balance?: number | string;
  balance_amount?: number | string;
  status?: BillStatus;
  bill_type?: string;
  credit_status?: CreditStatus | null;
  issued_at?: string | null;
  payments?: Payment[];
};

export type Order = {
  id: Id;
  order_number?: string;
  table_id?: Id | null;
  table?: LiteTable | null;
  created_by?: Id | null;
  creator?: LiteUser | null;
  waiter_id?: Id | null;
  waiter?: LiteUser | null;
  customer_id?: Id | null;
  customer?: { id: Id; name?: string; phone?: string } | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  status: OrderStatus | string;
  order_type?: OrderType | string;
  payment_type?: PaymentType | string;
  credit_status?: CreditStatus | null;
  credit_account_id?: Id | null;
  subtotal?: number | string;
  tax?: number | string;
  service_charge?: number | string;
  discount?: number | string;
  total?: number | string;
  total_amount?: number | string;
  notes?: string | null;
  ordered_at?: string | null;
  completed_at?: string | null;
  cancel_requested_at?: string | null;
  cancel_request_reason?: string | null;
  cancel_window_remaining_seconds?: number;
  can_request_cancel?: boolean;
  item_count?: number;
  bill_status?: string | null;
  paid_amount?: number | string;
  balance?: number | string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
  order_items?: OrderItem[];
  bill?: Bill | null;
  credit_order?: CreditOrder | null;
  creditOrder?: CreditOrder | null;
};

export type PaymentPayload = {
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
};

export type Payment = {
  id: Id;
  bill_id?: Id;
  amount?: number | string;
  payment_method?: string;
  reference_number?: string | null;
  notes?: string | null;
  status?: string;
  created_at?: string;
};

export type CreditAccountUser = {
  id: Id;
  credit_account_id?: Id;
  full_name: string;
  phone?: string | null;
  employee_id?: string | null;
  position?: string | null;
  id_number?: string | null;
  daily_limit?: number | string | null;
  monthly_limit?: number | string | null;
  is_active?: boolean | number;
  created_at?: string;
};

export type CreditAccountUserPayload = {
  full_name: string;
  phone?: string;
  employee_id?: string;
  position?: string;
  id_number?: string;
  daily_limit?: number | null;
  monthly_limit?: number | null;
  is_active?: boolean;
};

export type CreditAccount = {
  id: Id;
  name: string;
  account_type?: string;
  customer_id?: Id | null;
  organization_id?: Id | null;
  credit_limit?: number | string;
  current_balance?: number | string;
  remaining_limit?: number | string;
  is_credit_enabled?: boolean | number;
  requires_approval?: boolean | number;
  settlement_cycle?: string;
  status?: string;
  created_at?: string;
  authorized_users?: CreditAccountUser[];
  authorizedUsers?: CreditAccountUser[];
};

export type CreditAccountPayload = {
  name: string;
  account_type?: string;
  customer_id?: Id | null;
  organization_id?: Id | null;
  credit_limit: number;
  is_credit_enabled?: boolean;
  requires_approval?: boolean;
  settlement_cycle?: string;
  status?: string;
};

export type CreditOrder = {
  id: Id;
  credit_reference?: string;
  order?: Order | null;
  order_id?: Id;
  bill?: Bill | null;
  bill_id?: Id;
  credit_account?: CreditAccount | null;
  account?: CreditAccount | null;
  credit_account_user?: CreditAccountUser | null;
  authorized_user?: CreditAccountUser | null;
  credit_account_user_id?: Id | null;
  used_by_name?: string | null;
  used_by_phone?: string | null;
  total_amount?: number | string;
  paid_amount?: number | string;
  remaining_amount?: number | string;
  status?: CreditStatus;
  due_date?: string | null;
  created_at?: string;
};

export type ConvertCreditPayload = {
  credit_account_id: Id;
  credit_account_user_id?: Id | null;
  credit_account_user_ids?: Id[];
  notes?: string | null;
};

export type CreditSettlementPayload = {
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
};

export type TicketScope = "kitchen" | "bar";
export type TicketStatus = "pending" | "confirmed" | "preparing" | "ready" | "served" | "rejected" | "delayed";

export type PrepTicket = {
  id?: Id;
  kitchen_ticket_id?: Id;
  bar_ticket_id?: Id;
  ticket_status?: TicketStatus | string;
  status?: TicketStatus | string;
  order_id?: Id;
  order_number?: string;
  order_type?: string;
  order_item_id?: Id;
  item_name?: string;
  image_path?: string | null;
  image_url?: string | null;
  quantity?: number;
  order_item_status?: string;
  note?: string | null;
  waiter_name?: string | null;
  table_number?: string | null;
  order?: Order | null;
  order_item?: OrderItem | null;
  menu_item?: OrderMenuItem | null;
  waiter?: LiteUser | null;
  table?: LiteTable | null;
  notes?: string | null;
};

export type PackageOrderStatus = "draft" | "quoted" | "approved" | "scheduled" | "preparing" | "ready" | "delivered" | "completed" | "cancelled";
export type PackageTemplate = { id: Id; name: string; description?: string | null; price_per_person?: number | string; minimum_people?: number | string; is_active?: boolean | number; items?: PackageItem[] };
export type PackageItem = { id?: Id; package_id?: Id; menu_item_id: Id; menu_item?: OrderMenuItem | null; quantity_per_person: number };
export type PackagePayload = { name: string; description?: string; price_per_person: number; minimum_people?: number; is_active?: boolean; items?: PackageItem[] };
export type PackageOrderPayload = {
  package_id?: Id | null;
  customer_id?: Id | null;
  organization_id?: Id | null;
  event_name: string;
  event_type?: string;
  guest_count: number;
  event_date: string;
  event_time?: string;
  delivery_location?: string;
  payment_type?: PaymentType;
  waiter_id?: Id | null;
  credit_account_id?: Id | null;
  credit_account_user_id?: Id | null;
  credit_account_user_ids?: Id[];
  credit_notes?: string;
  notes?: string;
};
export type PackageOrder = {
  id: Id;
  package_id?: Id | null;
  package?: PackageTemplate | null;
  event_name: string;
  event_type?: string | null;
  guest_count: number;
  event_date?: string;
  event_time?: string;
  delivery_location?: string | null;
  status?: PackageOrderStatus | string;
  payment_type?: PaymentType | string;
  credit_status?: CreditStatus | null;
  subtotal?: number | string;
  tax?: number | string;
  service_charge?: number | string;
  total?: number | string;
  notes?: string | null;
  created_at?: string;
  items?: Array<{ id?: Id; menu_item?: OrderMenuItem | null; quantity?: number; unit_price?: number | string; total_price?: number | string }>;
};
export type PackageOrderSchedulePayload = { prep_start_time?: string; ready_time?: string; delivery_time?: string; assigned_team?: string; status?: string };
