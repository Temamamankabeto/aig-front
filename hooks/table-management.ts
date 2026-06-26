import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { tableService } from "@/services/table-management";
import type { TableListParams } from "@/types/table-management";

export const useTablesQuery = (params: TableListParams = {}, scope: "admin" | "manager" | "waiter" | "cashier" = "admin") =>
  useQuery({ queryKey: queryKeys.tables.list(params, scope), queryFn: () => tableService.list(params, scope) });
