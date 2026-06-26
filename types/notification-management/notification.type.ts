export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data: T;
};

export type Notification = {
  id: number | string;
  title?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
  action_url?: string | null;
};

export type NotificationFilters = {
  unread_only?: boolean;
  page?: number;
  per_page?: number;
};
