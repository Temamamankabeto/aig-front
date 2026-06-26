"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { liveRefreshIntervals } from "@/lib/live-refresh";
import { useSoundAlert } from "@/hooks/common/use-sound-alert";
import { prepTicketService } from "@/services/prep-ticket-management/prep-ticket.service";

export function usePrepTicketsQuery(kind = "kitchen", filters?: unknown) {
  const prevCountRef = useRef(0);

  const { play } = useSoundAlert({
    frequency: kind === "bar" ? 660 : 880,
    durationMs: kind === "bar" ? 140 : 180,
  });

  const query = useQuery({
    queryKey: queryKeys.prepTickets.list(kind, filters),
    queryFn: () => prepTicketService.list(kind as any, filters as any),
    refetchInterval: liveRefreshIntervals.prepTickets,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const count = Array.isArray(query.data) ? query.data.length : 0;

    if (count > prevCountRef.current) {
      play();
    }

    prevCountRef.current = count;
  }, [query.data, play]);

  return query;
}
