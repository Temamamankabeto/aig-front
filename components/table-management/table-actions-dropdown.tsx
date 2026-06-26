"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiningTable, TableStatus } from "@/types/table-management";
import {
  useDeleteTableMutation,
  useSetTableStatusMutation,
  useToggleTableActiveMutation,
} from "@/hooks/table-management/table";

const statuses: TableStatus[] = ["available", "occupied", "reserved", "cleaning", "out_of_service"];

type Props = {
  table: DiningTable;
  onEdit: () => void;
  onAssign?: () => void;
  onTransfer: () => void;
  onTransferOrders: () => void;
};

export function TableActionsDropdown({ table, onEdit, onTransfer, onTransferOrders }: Props) {
  const [open, setOpen] = useState(false);
  const toggleMutation = useToggleTableActiveMutation();
  const statusMutation = useSetTableStatusMutation();
  const deleteMutation = useDeleteTableMutation();

  const isActive = Boolean(table.is_active ?? table.active ?? true);
  const hasActiveOrders = Number(table.active_orders_count ?? 0) > 0;

  function closeThenRun(action: () => void) {
    setOpen(false);
    window.setTimeout(action, 0);
  }

  function changeStatus(status: TableStatus) {
    setOpen(false);
    statusMutation.mutate({ id: table.id, status });
  }

  function toggleActive() {
    setOpen(false);
    toggleMutation.mutate(table.id);
  }

  function deleteTable() {
    setOpen(false);
    if (hasActiveOrders) return;
    if (window.confirm("Delete this table? This is allowed only when it has no active orders.")) {
      deleteMutation.mutate(table.id);
    }
  }

  return (
    <div className="relative inline-flex">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open table actions"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {open ? (
        <div className="absolute right-0 top-10 z-[80] min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <button type="button" className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => closeThenRun(onEdit)}>
            Edit table
          </button>

          <button type="button" className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => closeThenRun(onTransfer)}>
            Bulk / transfer waiter
          </button>

          <button type="button" className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => closeThenRun(onTransferOrders)}>
            Transfer active orders
          </button>

          <div className="my-1 h-px bg-border" />

          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={table.status === status || statusMutation.isPending || (!isActive && status !== "available")}
              className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              onClick={() => changeStatus(status)}
            >
              Mark {status.replace(/_/g, " ")}
            </button>
          ))}

          <div className="my-1 h-px bg-border" />

          <button
            type="button"
            disabled={toggleMutation.isPending || (isActive && hasActiveOrders)}
            className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            onClick={toggleActive}
          >
            {isActive ? "Deactivate table" : "Activate table"}
          </button>

          <button
            type="button"
            disabled={deleteMutation.isPending || hasActiveOrders}
            className="w-full rounded-sm px-3 py-2 text-left text-sm text-destructive hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            onClick={deleteTable}
          >
            Delete table
          </button>
        </div>
      ) : null}
    </div>
  );
}
