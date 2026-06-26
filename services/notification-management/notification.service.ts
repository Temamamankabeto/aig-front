import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  Notification,
  NotificationFilters,
} from "@/types/notification-management/notification.type";

function clean(filters: NotificationFilters = {}) {
  const params: Record<string, unknown> = { ...filters };

  if (!params.unread_only) delete params.unread_only;

  return params;
}

export const notificationService = {
  list: async (filters: NotificationFilters = {}) => {
    const res = await api.get("/notifications", { params: clean(filters) });
    return unwrap<{ data: Notification[] }>(res);
  },

  markRead: async (id: number | string) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return unwrap<ApiEnvelope<Notification>>(res);
  },

  markAllRead: async () => {
    const res = await api.patch("/notifications/read-all");
    return unwrap<ApiEnvelope<boolean>>(res);
  },

  remove: async (id: number | string) => {
    const res = await api.delete(`/notifications/${id}`);
    return unwrap<ApiEnvelope<boolean>>(res);
  },
};
