"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BulkAssignTablesModal } from "@/components/table-management/bulk-assign-tables-modal";
import { TableActionsDropdown } from "@/components/table-management/table-actions-dropdown";
import { TableFormModal } from "@/components/table-management/table-form-modal";
import { TableStatusBadge } from "@/components/table-management/table-status-badge";
import { TransferOrdersModal } from "@/components/table-management/transfer-orders-modal";
import { TransferWaitersModal } from "@/components/table-management/transfer-waiters-modal";
import { DiningTable, TableListParams, TableStatus, TableWaiter, useTableSectionsQuery, useTableSummaryQuery, useTablesQuery } from "@/hooks/table-management/table";
import { can, tablePermissions } from "@/lib/auth/permissions";

const statuses: Array<TableStatus | "all"> = ["all", "available", "occupied", "reserved", "cleaning", "out_of_service"];

function label(value: unknown) {
  return String(value ?? "—").replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
}

function waiterName(waiter?: TableWaiter | null) {
  if (!waiter?.id) return "—";
  return waiter.name ?? waiter.full_name ?? waiter.username ?? waiter.email ?? `Waiter #${waiter.id}`;
}

function tableWaiters(table: DiningTable) {
  if (table.waiters?.length) return table.waiters.map(waiterName).filter((name) => name !== "—").join(", ") || "—";
  return waiterName(table.waiter ?? table.assigned_waiter ?? null);
}

function tableName(table: DiningTable) {
  return table.table_number ?? table.number ?? table.name ?? `Table #${table.id}`;
}

function summaryValue(summary: Record<string, any>, key: string) {
  return Number(summary?.[key] ?? summary?.status_counts?.[key] ?? summary?.by_status?.[key] ?? 0).toLocaleString();
}

export default function TableManagementPage() {
  const [params, setParams] = useState<TableListParams>({ page: 1, per_page: 10, status: "all", is_active: "all", section: "all", search: "" });
  const [selected, setSelected] = useState<DiningTable | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  const tablesQuery = useTablesQuery(params);
  const summaryQuery = useTableSummaryQuery();
  const sectionsQuery = useTableSectionsQuery();
  const rows = tablesQuery.data?.data ?? [];
  const meta = tablesQuery.data?.meta;
  const summary = useMemo(() => ({ ...(tablesQuery.data?.summary ?? {}), ...(summaryQuery.data ?? {}) }), [tablesQuery.data?.summary, summaryQuery.data]);

  function updateParam(next: Partial<TableListParams>) {
    setParams((current) => ({ ...current, ...next, page: next.page ?? 1 }));
  }

  function openCreate() {
    setSelected(null);
    setFormOpen(true);
  }

  function openEdit(table: DiningTable) {
    setSelected(table);
    setFormOpen(true);
  }

  function openOrders(table: DiningTable) {
    setSelected(table);
    setOrdersOpen(true);
  }

  function openTransfer(table: DiningTable) {
    setSelected(table);
    setTransferOpen(true);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Table Management</h1>
          <p className="text-sm text-muted-foreground">Create tables and manage waiter assignments in bulk.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => tablesQuery.refetch()} disabled={tablesQuery.isFetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          {can(tablePermissions.assign) ? <Button variant="outline" onClick={() => setBulkAssignOpen(true)}>Bulk assign waiters</Button> : null}
          {can(tablePermissions.create) ? <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add table</Button> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{Number(summary.total_tables ?? summary.total ?? meta?.total ?? rows.length).toLocaleString()}</CardContent></Card>
        <Card><CardHeader><CardTitle>Available</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{summaryValue(summary, "available")}</CardContent></Card>
        <Card><CardHeader><CardTitle>Occupied</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{summaryValue(summary, "occupied")}</CardContent></Card>
        <Card><CardHeader><CardTitle>Reserved</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{summaryValue(summary, "reserved")}</CardContent></Card>
        <Card><CardHeader><CardTitle>Cleaning</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{summaryValue(summary, "cleaning")}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tables</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_150px]">
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search table number, name, or section" value={String(params.search ?? "")} onChange={(e) => updateParam({ search: e.target.value })} /></div>
            <Select value={String(params.status ?? "all")} onValueChange={(value) => updateParam({ status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{label(status)}</SelectItem>)}</SelectContent></Select>
            <Select value={String(params.section ?? "all")} onValueChange={(value) => updateParam({ section: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{(sectionsQuery.data ?? []).map((section) => <SelectItem key={String(section)} value={String(section)}>{label(section)}</SelectItem>)}</SelectContent></Select>
            <Select value={String(params.is_active ?? "all")} onValueChange={(value) => updateParam({ is_active: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="1">Active</SelectItem><SelectItem value="0">Inactive</SelectItem></SelectContent></Select>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader><TableRow><TableHead>Table</TableHead><TableHead>Section</TableHead><TableHead>Capacity</TableHead><TableHead>Status</TableHead><TableHead>Waiter</TableHead><TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {tablesQuery.isLoading ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading tables...</TableCell></TableRow> : rows.length ? rows.map((table) => (
                  <TableRow key={String(table.id)}>
                    <TableCell><div className="font-medium">{tableName(table)}</div><div className="text-xs text-muted-foreground">{table.name || `ID: ${table.id}`}</div></TableCell>
                    <TableCell>{table.section ? label(table.section) : "—"}</TableCell>
                    <TableCell>{table.capacity ?? "—"}</TableCell>
                    <TableCell><TableStatusBadge status={table.status} /></TableCell>
                    <TableCell>{tableWaiters(table)}</TableCell>
                    <TableCell>{Number(table.is_active ?? table.active ?? 1) === 1 ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right"><TableActionsDropdown table={table} onEdit={() => openEdit(table)} onTransfer={() => openTransfer(table)} onTransferOrders={() => openOrders(table)} /></TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No tables found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>Showing page {meta?.current_page ?? params.page ?? 1} of {meta?.last_page ?? 1}. Total: {meta?.total ?? rows.length}</div>
            <div className="flex gap-2"><Button variant="outline" size="sm" disabled={Number(params.page ?? 1) <= 1 || tablesQuery.isFetching} onClick={() => updateParam({ page: Number(params.page ?? 1) - 1 })}>Previous</Button><Button variant="outline" size="sm" disabled={Number(params.page ?? 1) >= Number(meta?.last_page ?? 1) || tablesQuery.isFetching} onClick={() => updateParam({ page: Number(params.page ?? 1) + 1 })}>Next</Button></div>
          </div>
        </CardContent>
      </Card>

      <TableFormModal open={formOpen} onOpenChange={setFormOpen} table={selected} />
      <TransferOrdersModal open={ordersOpen} onOpenChange={setOrdersOpen} table={selected} />
      <TransferWaitersModal open={transferOpen} onOpenChange={setTransferOpen} table={selected} />
      <BulkAssignTablesModal open={bulkAssignOpen} onOpenChange={setBulkAssignOpen} />
    </div>
  );
}
