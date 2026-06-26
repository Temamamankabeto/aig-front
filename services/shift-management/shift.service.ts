import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  CashShift,
  CashShiftMovement,
  CloseShiftPayload,
  CreateShiftMovementPayload,
  OpenShiftPayload,
  PaginatedResponse,
  ShiftFilters,
  ShiftReport,
} from "@/types/shift-management/shift.type";

function cleanFilters(filters: ShiftFilters = {}) {
  const params: Record<string, unknown> = { ...filters };

  if (!params.search) delete params.search;
  if (!params.status || params.status === "all") delete params.status;

  return params;
}

export const shiftService = {
  current: async () => {
    const res = await api.get("/cashier/shifts/current");
    return unwrap<ApiEnvelope<CashShift | null>>(res);
  },

  open: async (payload: OpenShiftPayload) => {
    const res = await api.post("/cashier/shifts/open", payload);
    return unwrap<ApiEnvelope<CashShift>>(res);
  },

  close: async ({ id, closing_cash }: CloseShiftPayload) => {
    const res = await api.post(`/cashier/shifts/${id}/close`, { closing_cash });
    return unwrap<ApiEnvelope<CashShift>>(res);
  },

  list: async (filters: ShiftFilters = {}) => {
    const res = await api.get("/cashier/shifts", { params: cleanFilters(filters) });
    return unwrap<PaginatedResponse<CashShift>>(res);
  },

  detail: async (id: number | string) => {
    const res = await api.get(`/cashier/shifts/${id}`);
    return unwrap<ApiEnvelope<CashShift>>(res);
  },

  movements: async (shiftId: number | string) => {
    const res = await api.get(`/cashier/shifts/${shiftId}/movements`);
    return unwrap<ApiEnvelope<{ data?: CashShiftMovement[] } | CashShiftMovement[]>>(res);
  },

  createMovement: async ({ shiftId, ...payload }: CreateShiftMovementPayload) => {
    const res = await api.post(`/cashier/shifts/${shiftId}/movements`, payload);
    return unwrap<ApiEnvelope<CashShiftMovement>>(res);
  },

  xReport: async () => {
    const res = await api.get("/cashier/reports/x-report");
    return unwrap<ApiEnvelope<ShiftReport>>(res);
  },

  zReport: async (id: number | string) => {
    const res = await api.get("/cashier/reports/z-report", { params: { shift_id: id } });
    return unwrap<ApiEnvelope<ShiftReport>>(res);
  },
};
