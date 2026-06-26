"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRightLeft, ClipboardList, PackageCheck, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatBaseQuantity, formatMoney } from "@/lib/inventory-management";
import {
  useInventoryItemsQuery,
  useInventoryTransactionsQuery,
  useTransferStockMutation,
} from "@/hooks/inventory-management";
import type { InventoryItem, InventoryTransaction } from "@/types/inventory-management";

type Scope = "admin" | "food-controller" | "stock-keeper";

function itemUnit(item?: Pick<InventoryItem, "base_unit" | "unit"> | null) {
  return item?.base_unit ?? item?.unit ?? "pcs";
}

function itemName(item?: Pick<InventoryItem, "name" | "sku"> | null) {
  if (!item) return "—";
  return item.sku ? `${item.name} (${item.sku})` : item.name;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TransactionsTable({ rows, loading }: { rows: InventoryTransaction[]; loading?: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading movements...</p>;
  if (!rows.length) return <EmptyState title="No transfer movements" description="Transfer-in and transfer-out movements will appear here after a transfer is saved." />;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const item = row.inventory_item ?? row.inventoryItem;
            return (
              <TableRow key={row.id}>
                <TableCell>{itemName(item)}</TableCell>
                <TableCell><Badge variant="outline">{row.transaction_type ?? row.type ?? "transfer"}</Badge></TableCell>
                <TableCell>{formatBaseQuantity(row.quantity, itemUnit(item))}</TableCell>
                <TableCell>{formatMoney(row.unit_cost)} ETB</TableCell>
                <TableCell className="max-w-[260px] truncate">{row.note ?? "—"}</TableCell>
                <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function StockTransferPage({ scope = "stock-keeper" }: { scope?: Scope }) {
  const itemsQuery = useInventoryItemsQuery({ per_page: 200 }, scope);
  const movementsQuery = useInventoryTransactionsQuery({ per_page: 12, type: "transfer_out" }, scope);
  const transfer = useTransferStockMutation(undefined, scope);

  const [search, setSearch] = useState("");
  const [fromItemId, setFromItemId] = useState("");
  const [toItemId, setToItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const items = itemsQuery.data?.data ?? [];
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => `${item.name} ${item.sku ?? ""}`.toLowerCase().includes(term));
  }, [items, search]);

  const fromItem = items.find((item) => String(item.id) === fromItemId);
  const toItem = items.find((item) => String(item.id) === toItemId);
  const quantityNumber = Number(quantity || 0);
  const sameUnit = fromItem && toItem ? itemUnit(fromItem) === itemUnit(toItem) : true;
  const isSameItem = fromItemId && toItemId && fromItemId === toItemId;
  const exceedsStock = Boolean(fromItem && quantityNumber > Number(fromItem.current_stock ?? 0));
  const canSubmit = Boolean(fromItemId && toItemId && quantityNumber > 0 && reason.trim() && !isSameItem && sameUnit && !exceedsStock);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    transfer.mutate({
      id: fromItemId,
      payload: {
        to_item_id: toItemId,
        quantity: quantityNumber,
        reason: reason.trim(),
      },
    }, {
      onSuccess: () => {
        setFromItemId("");
        setToItemId("");
        setQuantity("");
        setReason("");
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Stock Transfer</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Move stock quantity from one inventory item to another using the same base unit.</p>
        </div>
        <Badge variant="secondary" className="w-fit">Units: kg / L / pcs</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[430px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Transfer stock</CardTitle>
            <CardDescription>Choose source and destination items. Transfers are blocked when units differ or stock is insufficient.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Search items</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search by item name or SKU" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Source item</Label>
                <Select value={fromItemId} onValueChange={setFromItemId}>
                  <SelectTrigger><SelectValue placeholder="Select source item" /></SelectTrigger>
                  <SelectContent>
                    {filteredItems.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>{itemName(item)} — {formatBaseQuantity(item.current_stock, itemUnit(item))}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destination item</Label>
                <Select value={toItemId} onValueChange={setToItemId}>
                  <SelectTrigger><SelectValue placeholder="Select destination item" /></SelectTrigger>
                  <SelectContent>
                    {filteredItems.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>{itemName(item)} — {itemUnit(item)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {fromItem && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p>Available stock: <strong>{formatBaseQuantity(fromItem.current_stock, itemUnit(fromItem))}</strong></p>
                  <p>Source unit: <strong>{itemUnit(fromItem)}</strong></p>
                </div>
              )}

              {toItem && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p>Destination stock: <strong>{formatBaseQuantity(toItem.current_stock, itemUnit(toItem))}</strong></p>
                  <p>Destination unit: <strong>{itemUnit(toItem)}</strong></p>
                </div>
              )}

              {isSameItem && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Source and destination cannot be the same item.</p>}
              {!sameUnit && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Source and destination units must match before transfer.</p>}
              {exceedsStock && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">Transfer quantity cannot exceed available source stock.</p>}

              <div className="space-y-2">
                <Label>Quantity {fromItem ? `(${itemUnit(fromItem)})` : ""}</Label>
                <Input required type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Example: Move stock to kitchen prep item, correction, repacking, etc." />
              </div>

              <Button type="submit" disabled={!canSubmit || transfer.isPending} className="w-full">
                <PackageCheck className="mr-2 h-4 w-4" />
                {transfer.isPending ? "Transferring..." : "Save transfer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Recent transfer movements</CardTitle>
            <CardDescription>Shows recent transfer-out transactions. Transfer-in entries are stored with the same reference.</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionsTable rows={movementsQuery.data?.data ?? []} loading={movementsQuery.isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
