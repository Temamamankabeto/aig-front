"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationService } from "@/services/notification-management/notification.service";
import { queryKeys } from "@/lib/queryKeys";
import { liveRefreshIntervals } from "@/lib/live-refresh";
import type { NotificationFilters } from "@/types/notification-management/notification.type";

export function useNotificationsQuery(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: ["notifications", filters],
    queryFn: () => notificationService.list(filters),
    refetchInterval: liveRefreshIntervals.notifications,
    refetchIntervalInBackground: true,
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => notificationService.markRead(id),
    onSuccess: () => {
      toast.success("Notification marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotificationMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => notificationService.remove(id),
    onSuccess: () => {
      toast.success("Notification removed");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
