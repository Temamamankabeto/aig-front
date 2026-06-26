import api, { unwrap } from "@/lib/api";
import type {
  ReportEnvelope,
  ReportFilters,
  RefundSummaryRow,
  SalesReportRow,
  ShiftReconciliationRow,
  StockValuationRow,
  PaymentSummaryRow,
} from "@/types/report-management/report.type";

function clean(filters: ReportFilters = {}) {
  const params: Record<string, unknown> = { ...filters };

  Object.keys(params).forEach((k) => {
    if (params[k] === undefined || params[k] === "all" || params[k] === "") {
      delete params[k];
    }
  });

  return params;
}

export const reportService = {
  sales: async (filters: ReportFilters = {}) => {
    const res = await api.get("/finance/reports/sales", { params: clean(filters) });
    return unwrap<ReportEnvelope<SalesReportRow>>(res);
  },

  paymentSummary: async (filters: ReportFilters = {}) => {
    const res = await api.get("/finance/reports/payment-method-summary", {
      params: clean(filters),
    });

    return unwrap<ReportEnvelope<PaymentSummaryRow>>(res);
  },

  refundSummary: async (filters: ReportFilters = {}) => {
    const res = await api.get("/finance/reports/refund-summary", {
      params: clean(filters),
    });

    return unwrap<ReportEnvelope<RefundSummaryRow>>(res);
  },

  shiftReconciliation: async (filters: ReportFilters = {}) => {
    const res = await api.get("/finance/reports/shift-reconciliation", {
      params: clean(filters),
    });

    return unwrap<ReportEnvelope<ShiftReconciliationRow>>(res);
  },

  stockValuation: async (filters: ReportFilters = {}) => {
    const res = await api.get("/finance/reports/stock-valuation", {
      params: clean(filters),
    });

    return unwrap<ReportEnvelope<StockValuationRow>>(res);
  },
};
