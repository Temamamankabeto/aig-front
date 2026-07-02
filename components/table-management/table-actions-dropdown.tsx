"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
}

export function TableActionsDropdown({ table, onEdit, onTransfer, onTransferOrders }: Props) {
  const toggleMutation = useToggleTableActiveMutation();
  const statusMutation = useSetTableStatusMutation();
  const deleteMutation = useDeleteTableMutation();

  const isActive = Boolean(table.is_active ?? table.active ?? true);
  const hasActiveOrders = Number(table.active_orders_count ?? 0) > 0;

  function changeStatus(status: TableStatus) {
    statusMutation.mutate({ id: table.id, status });
  }

  function toggleActive() {
    toggleMutation.mutate(table.id);
  }

  function deleteTable() {
    if (hasActiveOrders) return;

    if (window.confirm("Delete this table? This is allowed only when it has no active orders.")) {
      deleteMutation.mutate(table.id);
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Open table actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Table actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={onEdit}>Edit table</DropdownMenuItem>
        <DropdownMenuItem onSelect={onTransfer}>Bulk / transfer waiter</DropdownMenuItem>
        <DropdownMenuItem onSelect={onTransferOrders}>Transfer active orders</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Status</DropdownMenuLabel>

        {statuses.map((status) => (
          <DropdownMenuItem
            key={status}
            disabled={table.status === status || statusMutation.isPending || (!isActive && status !== "available")}
            onSelect={() => changeStatus(status)}
          >
            Mark {label(status)}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={toggleMutation.isPending || (isActive && hasActiveOrders)}
          onSelect={toggleActive}
        >
          {isActive ? "Deactivate table" : "Activate table"}
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={deleteMutation.isPending || hasActiveOrders}
          onSelect={deleteTable}
          className="text-destructive focus:text-destructive"
        >
          Delete table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
