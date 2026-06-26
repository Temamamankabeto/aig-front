import api from "@/lib/api";
import type {
  PrepTicketFilters,
  PrepTicketKind,
  PrepTicketListResponse,
} from "@/types/prep-ticket-management/prep-ticket.type";

function clean(filters: PrepTicketFilters = {}) {
  const params: Record<string, unknown> = { ...filters };

  Object.keys(params).forEach((k) => {
    if (params[k] === undefined || params[k] === "all" || params[k] === "") {
      delete params[k];
    }
  });

  return params;
}

export const prepTicketService = {
  list: async (kind: PrepTicketKind = "kitchen", filters: PrepTicketFilters = {}) => {
    const res = await api.get(`/prep-tickets/${kind}`, {
      params: clean(filters),
    });

    return res.data?.data ?? res.data;
  },

  updateStatus: async (id: number | string, status: string) => {
    const res = await api.patch(`/prep-tickets/${id}/status`, { status });

    return res.data?.data ?? res.data;
  },
};
