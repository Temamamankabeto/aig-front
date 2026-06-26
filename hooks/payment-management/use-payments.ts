"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { paymentService } from "@/services/payment-management/payment.service";
import type { CreatePaymentPayload, PaymentFilters } from "@/types/payment-management/payment.type";

type Scope = "cashier" | "admin";

export function usePaymentsQuery(filters: PaymentFilters = {}, scope: Scope = "admin") {
  return useQuery({
    queryKey: queryKeys.billing.payments({ ...filters, scope }),
    queryFn: () => paymentService.list(filters, scope),
  });
}

export function usePaymentQuery(id?: number | string, scope: Scope = "admin") {
  return useQuery({
    queryKey: queryKeys.billing.bill(`${scope}-${id ?? ""}`),
    queryFn: () => paymentService.show(id as number | string, scope),
    enabled: Boolean(id),
  });
}

export function useCreatePaymentMutation(scope: Scope = "admin", onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, payload }: { billId: number | string; payload: CreatePaymentPayload }) =>
      paymentService.create(billId, payload, scope),
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: queryKeys.billing.root() });
      qc.invalidateQueries({ queryKey: queryKeys.orders.root() });
      qc.invalidateQueries({ queryKey: queryKeys.shifts.root() });
      onSuccess?.();
    },
  });
}

export function useApprovePaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => paymentService.approve(id),
    onSuccess: () => {
      toast.success("Payment approved");
      qc.invalidateQueries({ queryKey: queryKeys.billing.root() });
    },
  });
}

export function useReturnPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => paymentService.returnPayment(id),
    onSuccess: () => {
      toast.success("Payment returned");
      qc.invalidateQueries({ queryKey: queryKeys.billing.root() });
    },
  });
}

export function useFailPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => paymentService.fail(id),
    onSuccess: () => {
      toast.success("Payment marked failed");
      qc.invalidateQueries({ queryKey: queryKeys.billing.root() });
    },
  });
}
