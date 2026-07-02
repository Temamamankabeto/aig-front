"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DiningTable,
  useTableWaitersQuery,
  useTransferTableWaitersMutation,
} from "@/hooks/table-management/table";

function waiterLabel(waiter: { id: number | string; name?: string | null; full_name?: string | null; email?: string | null }) {
  return waiter.name ?? waiter.full_name ?? waiter.email ?? `Waiter #${waiter.id}`;
}

export function TransferWaitersModal({
  open,
  onOpenChange,
  table,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: DiningTable | null;
}) {
  const { data: waiters = [], isLoading } = useTableWaitersQuery();
  const transferMutation = useTransferTableWaitersMutation(() => onOpenChange(false));
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(table?.waiters?.map((waiter) => waiter.id) ?? []);
  }, [open, table]);

  function toggle(id: number | string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function submit() {
    if (!table?.id || selectedIds.length === 0) {
      toast.error("Select at least one waiter.");
      return;
    }

    try {
      await transferMutation.mutateAsync({
        id: table.id,
        payload: { to_waiter_ids: selectedIds },
      });
      toast.success("Table waiter assignment transferred successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to transfer table.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Transfer table waiters</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
           <p className="font-medium">
  {String(
    table?.display_name ??
    table?.name ??
    table?.table_number ??
    "Selected table"
  )}
</p>
            <p className="text-muted-foreground">Choose the waiter(s) responsible for this table.</p>
          </div>

          <div className="space-y-2">
            <Label>Waiters</Label>
            <div className="grid max-h-72 gap-2 overflow-auto rounded-xl border p-3 md:grid-cols-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading waiters...</p>
              ) : waiters.length ? (
                waiters.map((waiter) => (
                  <label key={String(waiter.id)} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted/60">
                    <Checkbox checked={selectedIds.includes(waiter.id)} onCheckedChange={() => toggle(waiter.id)} />
                    <span>{waiterLabel(waiter)}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No waiter users found.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={transferMutation.isPending || selectedIds.length === 0} onClick={submit}>
            {transferMutation.isPending ? "Saving..." : "Save transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
