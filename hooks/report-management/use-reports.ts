"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { reportService } from "@/services/report-management/report.service";
import type { ReportFilters } from "@/types/report-management/report.type";

export function useSalesReportQuery(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports.sales(filters),
    queryFn: () => reportService.sales(filters),
  });
}

export function usePaymentSummaryReportQuery(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports.payments(filters),
    queryFn: () => reportService.paymentSummary(filters),
  });
}

export function useRefundSummaryReportQuery(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports.finance(filters),
    queryFn: () => reportService.refundSummary(filters),
  });
}

export function useShiftReconciliationReportQuery(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: queryKeys.shifts.list(filters),
    queryFn: () => reportService.shiftReconciliation(filters),
  });
}

export function useStockValuationReportQuery(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.valuation(),
    queryFn: () => reportService.stockValuation(filters),
  });
}
