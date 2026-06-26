import api, { unwrap } from "@/lib/api";
import type { ApiEnvelope, CreatePaymentPayload, Payment, PaymentFilters, PaymentListResponse } from "@/types/payment-management/payment.type";

function clean(filters: PaymentFilters = {}) {
  const params: Record<string, unknown> = { ...filters };
  if (!params.search) delete params.search;
  if (!params.method || params.method === "all") delete params.method;
  if (!params.status || params.status === "all") delete params.status;
  if (!params.bill_id) delete params.bill_id;
  return params;
}

function paymentBase(scope: "cashier" | "admin" = "admin") {
  return scope === "cashier" ? "/cashier/payments" : "/payments";
}

function billPaymentBase(scope: "cashier" | "admin" = "admin", billId: number | string) {
  return scope === "cashier" ? `/cashier/bills/${billId}/payments` : `/bills/${billId}/payments`;
}

export const paymentService = {
  list: async (filters: PaymentFilters = {}, scope: "cashier" | "admin" = "admin") => {
    const res = await api.get(paymentBase(scope), { params: clean(filters) });
    return unwrap<PaymentListResponse>(res);
  },

  show: async (id: number | string, scope: "cashier" | "admin" = "admin") => {
    const res = await api.get(`${paymentBase(scope)}/${id}`);
    return unwrap<ApiEnvelope<Payment>>(res);
  },

  history: async (billId: number | string, scope: "cashier" | "admin" = "admin") => {
    const res = await api.get(billPaymentBase(scope, billId));
    return unwrap<PaymentListResponse>(res);
  },

  create: async (billId: number | string, payload: CreatePaymentPayload, scope: "cashier" | "admin" = "admin") => {
    const res = await api.post(billPaymentBase(scope, billId), payload);
    return unwrap<ApiEnvelope<{ payment: Payment; bill: unknown }>>(res);
  },

  approve: async (id: number | string) => {
    const res = await api.post(`/payments/${id}/approve`);
    return unwrap<ApiEnvelope<{ payment: Payment; bill: unknown }>>(res);
  },

  returnPayment: async (id: number | string) => {
    const res = await api.post(`/payments/${id}/return`);
    return unwrap<ApiEnvelope<Payment>>(res);
  },

  fail: async (id: number | string) => {
    const res = await api.post(`/payments/${id}/fail`);
    return unwrap<ApiEnvelope<Payment>>(res);
  },

  refund: async (id: number | string) => {
    const res = await api.post(`/payments/${id}/refund-requests`);
    return unwrap<ApiEnvelope<Payment>>(res);
  },
};
