import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { tableService } from "@/services/table-management";

import type {
  AssignWaitersPayload,
  BulkAssignTablesPayload,
  DiningTable,
  TableFilters,
  TableListParams,
  TablePayload,
  TableStatus,
  TableWaiter,
  TransferOrdersPayload,
  TransferTablePayload,
  TransferWaitersPayload,
  UpdateTableStatusPayload,
} from "@/types/table-management";

// Re-export types so other files can import them from this hook
export type {
  AssignWaitersPayload,
  BulkAssignTablesPayload,
  DiningTable,
  TableFilters,
  TableListParams,
  TablePayload,
  TableStatus,
  TableWaiter,
  TransferOrdersPayload,
  TransferTablePayload,
  TransferWaitersPayload,
  UpdateTableStatusPayload,
};

/**
 * UI-level role scope (used in frontend logic)
 */
export type TableRoleScope =
  | "admin"
  | "manager"
  | "waiter"
  | "cashier";

/**
 * API-level role scope (ONLY what backend accepts)
 */
type TableApiScope = "admin" | "manager";

/**
 * Safe mapper from UI scope → API scope
 */
function toTableApiScope(scope: TableRoleScope): TableApiScope {
  return scope === "admin" ? "admin" : "manager";
}

/* =========================
   QUERY INVALIDATION
========================= */

function invalidateTableQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.tables.root() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.tables.summary() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.tables.sections() }),
  ]);
}

/* =========================
   QUERIES
========================= */

export function useTablesQuery(
  params: TableListParams = {},
  roleScope: TableRoleScope = "admin",
) {
  return useQuery({
    queryKey: queryKeys.tables.list(params, roleScope),
    queryFn: () =>
      tableService.list(params, toTableApiScope(roleScope)),
  });
}

export function usePublicTablesQuery(params: TableListParams = {}) {
  return useQuery({
    queryKey: queryKeys.tables.public(params),
    queryFn: () => tableService.publicList(params),
  });
}

export function useTableQuery(id?: number | string) {
  return useQuery({
    queryKey: queryKeys.tables.detail(id ?? ""),
    queryFn: () => tableService.show(id as number | string),
    enabled: Boolean(id),
  });
}

export function useTableSummaryQuery(
  roleScope: TableRoleScope = "manager",
) {
  return useQuery({
    queryKey: [...queryKeys.tables.summary(), roleScope],
    queryFn: () =>
      tableService.summary(toTableApiScope(roleScope)),
  });
}

export function useTableSectionsQuery(
  roleScope: TableRoleScope = "manager",
) {
  return useQuery({
    queryKey: [...queryKeys.tables.sections(), roleScope],
    queryFn: () =>
      tableService.sections(toTableApiScope(roleScope)),
  });
}

export function useTableHistoryQuery(id?: number | string) {
  return useQuery({
    queryKey: queryKeys.tables.history(id ?? ""),
    queryFn: () => tableService.history(id as number | string),
    enabled: Boolean(id),
  });
}

export function useTableWaitersQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.tables.waiters(search),
    queryFn: () => tableService.waiters(search),
  });
}

/* =========================
   MUTATIONS
========================= */

export function useCreateTableMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TablePayload) =>
      tableService.create(payload),

    onSuccess: async () => {
      await invalidateTableQueries(queryClient);
      onSuccess?.();
    },
  });
}

export function useUpdateTableMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: TablePayload;
    }) => tableService.update(id, payload),

    onSuccess: async (_data, variables) => {
      await invalidateTableQueries(queryClient);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(variables.id),
      });

      onSuccess?.();
    },
  });
}

export function useAssignTableWaiterMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      waiter_id,
    }: {
      id: number | string;
      waiter_id: number | string;
    }) =>
      tableService.assignWaiters(id, {
        waiter_ids: [waiter_id],
      }),

    onSuccess: async (_data, variables) => {
      await invalidateTableQueries(queryClient);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(variables.id),
      });

      onSuccess?.();
    },
  });
}

export function useAssignTableWaitersMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: AssignWaitersPayload;
    }) => tableService.assignWaiters(id, payload),

    onSuccess: async (_data, variables) => {
      await invalidateTableQueries(queryClient);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(variables.id),
      });

      onSuccess?.();
    },
  });
}

export function useUnassignTableWaiterMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) =>
      tableService.unassignWaiters(id, { waiter_ids: [] }),

    onSuccess: async (_data, id) => {
      await invalidateTableQueries(queryClient);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(id),
      });

      onSuccess?.();
    },
  });
}

export function useTransferTableMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: TransferTablePayload;
    }) =>
      tableService.transferOrders(id, {
        to_table_id: payload.to_table_id,
        move_waiters: true,
        note: payload.note,
      }),

    onSuccess: async () => {
      await invalidateTableQueries(queryClient);
      onSuccess?.();
    },
  });
}

export function useTransferTableWaitersMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: TransferWaitersPayload;
    }) => tableService.transferWaiters(id, payload),

    onSuccess: async () => {
      await invalidateTableQueries(queryClient);
      onSuccess?.();
    },
  });
}

export function useTransferTableOrdersMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: TransferOrdersPayload;
    }) => tableService.transferOrders(id, payload),

    onSuccess: async () => {
      await invalidateTableQueries(queryClient);
      onSuccess?.();
    },
  });
}

export function useSetTableStatusMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number | string;
      status: TableStatus;
    }) => tableService.updateStatus(id, { status }),

    onSuccess: async (_data, variables) => {
      await invalidateTableQueries(queryClient);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(variables.id),
      });

      onSuccess?.();
    },
  });
}

export function useUpdateTableStatusMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UpdateTableStatusPayload;
    }) => tableService.updateStatus(id, payload),

    onSuccess: async (_data, variables) => {
      await invalidateTableQueries(queryClient);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(variables.id),
      });

      onSuccess?.();
    },
  });
}

export function useToggleTableActiveMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) =>
      tableService.toggle(id),

    onSuccess: async (_data, id) => {
      await invalidateTableQueries(queryClient);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.tables.detail(id),
      });

      onSuccess?.();
    },
  });
}

export function useToggleTableMutation(onSuccess?: () => void) {
  return useToggleTableActiveMutation(onSuccess);
}

export function useDeleteTableMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) =>
      tableService.delete(id),

    onSuccess: async () => {
      await invalidateTableQueries(queryClient);
      onSuccess?.();
    },
  });
}

export function useBulkAssignTablesToWaiterMutation(
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignTablesPayload) =>
      tableService.bulkAssignTablesToWaiter(payload),

    onSuccess: async () => {
      await invalidateTableQueries(queryClient);
      onSuccess?.();
    },
  });
}