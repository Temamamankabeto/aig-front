"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DiningTable,
  TablePayload,
  TableStatus,
  useCreateTableMutation,
  useTableWaitersQuery,
  useUpdateTableMutation,
} from "@/hooks/table-management/table";

const statuses: TableStatus[] = ["available", "occupied", "reserved", "cleaning", "out_of_service"];

function boolValue(value: unknown, fallback = true) {
  if (value === undefined || value === null) return fallback;
  return value === true || value === 1 || value === "1";
}

export function TableFormModal({
  open,
  onOpenChange,
  table,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: DiningTable | null;
}) {
  const isEdit = Boolean(table?.id);
  const { data: waiters = [] } = useTableWaitersQuery();
  const createMutation = useCreateTableMutation(() => onOpenChange(false));
  const updateMutation = useUpdateTableMutation(() => onOpenChange(false));
  const [form, setForm] = useState<TablePayload>({
    table_number: "",
    name: "",
    capacity: 4,
    section: "",
    status: "available",
    is_active: true,
    is_public: true,
    sort_order: 0,
    waiter_ids: [],
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      table_number: table?.table_number ?? table?.number ?? "",
      name: table?.name ?? "",
      capacity: Number(table?.capacity ?? 4),
      section: table?.section ?? "",
      status: table?.status ?? "available",
      is_active: boolValue(table?.is_active ?? table?.active, true),
      is_public: boolValue(table?.is_public, true),
      sort_order: Number(table?.sort_order ?? 0),
      waiter_ids: table?.waiters?.map((waiter) => waiter.id) ?? (table?.waiter_id ? [table.waiter_id] : []),
    });
  }, [open, table]);

  function toggleWaiter(id: number | string) {
    const current = form.waiter_ids ?? [];
    setForm((prev) => ({
      ...prev,
      waiter_ids: current.includes(id) ? current.filter((item) => item !== id) : [id],
    }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const firstWaiterId = form.waiter_ids?.[0] ?? null;
    const payload: TablePayload = {
      ...form,
      capacity: Number(form.capacity || 1),
      sort_order: Number(form.sort_order ?? 0),
      name: form.name || null,
      section: form.section || null,
      waiter_id: firstWaiterId,
    };
    if (isEdit && table?.id) updateMutation.mutate({ id: table.id, payload });
    else createMutation.mutate(payload);
  }

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Edit table" : "Create table"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Table number</Label>
              <Input value={String(form.table_number ?? "")} onChange={(e) => setForm({ ...form, table_number: e.target.value })} required placeholder="T-01" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={String(form.name ?? "")} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Family Table" />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" min={1} value={String(form.capacity ?? 1)} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Input value={String(form.section ?? "")} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="Indoor / Outdoor" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={String(form.status ?? "available")} onValueChange={(value) => setForm({ ...form, status: value as TableStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input type="number" value={String(form.sort_order ?? 0)} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border p-3">
              <Checkbox checked={Boolean(form.is_active)} onCheckedChange={(v) => setForm({ ...form, is_active: Boolean(v) })} />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl border p-3">
              <Checkbox checked={Boolean(form.is_public)} onCheckedChange={(v) => setForm({ ...form, is_public: Boolean(v) })} />
              <span className="text-sm">Visible for public/customer</span>
            </label>
          </div>

          <div className="space-y-2">
            <Label>Assigned waiter</Label>
            <div className="grid max-h-44 gap-2 overflow-auto rounded-xl border p-3 md:grid-cols-2">
              {waiters.length ? waiters.map((waiter) => (
                <label key={String(waiter.id)} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={(form.waiter_ids ?? []).includes(waiter.id)} onCheckedChange={() => toggleWaiter(waiter.id)} />
                  {waiter.name ?? waiter.full_name ?? waiter.email ?? `Waiter #${waiter.id}`}
                </label>
              )) : <p className="text-sm text-muted-foreground">No waiter list found.</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save table"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
