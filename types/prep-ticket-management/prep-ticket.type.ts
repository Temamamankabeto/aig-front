export type PrepTicketKind = "kitchen" | "bar";

export type PrepTicketStatus = "confirmed" | "preparing" | "ready" | "served" | "delayed" | "rejected";

export type PrepTicketFilters = {
  status?: PrepTicketStatus | "all";
  scope?: "today" | "all_open" | "all";
  search?: string;
  page?: number;
  per_page?: number;
};

export type PrepTicket = {
  id: number | string;
  order_id?: number | string;
  order_number?: string;
  order_item_id?: number | string;
  menu_item_name?: string;
  item_name?: string;
  quantity?: number | string;
  status: PrepTicketStatus;
  waiter_name?: string;
  table_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type PrepTicketListResponse = {
  success?: boolean;
  message?: string;
  data: PrepTicket[];
  meta?: Record<string, unknown>;
  summary?: Record<string, number>;
};
