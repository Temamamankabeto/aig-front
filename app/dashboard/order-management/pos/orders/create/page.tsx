"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ScanLine, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMenuItemsQuery } from "@/hooks/queries/menu-management";
import { useTablesQuery } from "@/hooks/queries/table-management";
import { useCreditAccountsQuery, useWaitersLiteQuery } from "@/hooks/queries/order-management";
import { useCreateOrderMutation } from "@/hooks/mutations/order-management";
import type { OrderItemPayload } from "@/types/order-management";

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCreditScan(raw: string) {
  const text = raw.trim();
  const accountMatch = text.match(/credit-account\s*:\s*([^;\s]+)/i);
  const userMatch = text.match(/authorized-user\s*:\s*([^;\s]+)/i);
  if (!accountMatch || !userMatch) return null;
  return { credit_account_id: accountMatch[1], credit_account_user_id: userMatch[1] };
}

export default function CashierPosCreateOrderPage() {
  const [scanText, setScanText] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [payload, setPayload] = useState({
    table_id: "",
    waiter_id: "",
    order_type: "takeaway",
    payment_type: "regular",
    credit_account_id: "",
    credit_account_user_id: "",
    credit_notes: "",
    notes: "",
  });
  const [items, setItems] = useState<OrderItemPayload[]>([]);

  const menuQuery = useMenuItemsQuery({ per_page: 200, available: 1, is_available: 1, active: 1, is_active: 1, search: menuSearch }, "cashier");
  const tablesQuery = useTablesQuery({ per_page: 100, status: "available", is_active: 1 }, "cashier");
  const waitersQuery = useWaitersLiteQuery();
  const creditAccountsQuery = useCreditAccountsQuery({ per_page: 100, status: "active" });
  const create = useCreateOrderMutation("cashier", () => {
    setItems([]);
    setScanText("");
    setPayload({ table_id: "", waiter_id: "", order_type: "takeaway", payment_type: "regular", credit_account_id: "", credit_account_user_id: "", credit_notes: "", notes: "" });
  });

  const menuItems = menuQuery.data?.data ?? [];
  const tables = tablesQuery.data?.data ?? [];
  const waiters = waitersQuery.data ?? [];
  const creditAccounts = creditAccountsQuery.data?.data ?? [];
  const selectedCreditAccount = creditAccounts.find((account) => String(account.id) === String(payload.credit_account_id));
  const creditLimit = Number(selectedCreditAccount?.credit_limit ?? 0);
  const currentBalance = Number(selectedCreditAccount?.current_balance ?? 0);
  const remainingLimit = Math.max(0, Number(selectedCreditAccount?.remaining_limit ?? creditLimit - currentBalance));
  const isCredit = payload.payment_type === "credit";
  const needsTable = payload.order_type === "dine_in";

  const total = useMemo(() => items.reduce((sum, item) => {
    const menu = menuItems.find((m) => String(m.id) === String(item.menu_item_id));
    return sum + Number(menu?.price ?? 0) * item.quantity;
  }, 0), [items, menuItems]);

  const canSubmit = items.length > 0 && Boolean(payload.waiter_id) && (!needsTable || Boolean(payload.table_id)) && (!isCredit || (Boolean(payload.credit_account_id) && Boolean(payload.credit_account_user_id) && total <= remainingLimit));

  function applyScan() {
    const parsed = parseCreditScan(scanText);
    if (!parsed) {
      toast.error("Invalid card scan. Expected credit-account:{id};authorized-user:{id}");
      return;
    }
    setPayload((current) => ({ ...current, payment_type: "credit", credit_account_id: parsed.credit_account_id, credit_account_user_id: parsed.credit_account_user_id }));
    toast.success("Credit card scanned and selected");
  }

  function addItem(id: string | number) {
    const exists = items.find((i) => String(i.menu_item_id) === String(id));
    setItems(exists ? items.map((i) => String(i.menu_item_id) === String(id) ? { ...i, quantity: i.quantity + 1 } : i) : [...items, { menu_item_id: id, quantity: 1 }]);
  }

  function updateQty(id: string | number, quantity: number) {
    if (quantity <= 0) {
      setItems(items.filter((item) => String(item.menu_item_id) !== String(id)));
      return;
    }
    setItems(items.map((item) => String(item.menu_item_id) === String(id) ? { ...item, quantity } : item));
  }

  function submit() {
    if (!canSubmit) {
      toast.error(isCredit && total > remainingLimit ? "Credit limit exceeded" : "Complete waiter, table when dine-in, credit user, and order items");
      return;
    }
    create.mutate({
      ...payload,
      table_id: payload.table_id || null,
      waiter_id: payload.waiter_id || null,
      credit_account_id: isCredit ? payload.credit_account_id : null,
      credit_account_user_id: isCredit ? payload.credit_account_user_id : null,
      items,
    } as any, {
      onSuccess: () => toast.success("Order created successfully"),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create order"),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-3"><Link href="/dashboard/order-management/pos/orders"><ArrowLeft className="mr-2 h-4 w-4" /> Back to POS orders</Link></Button>
          <h1 className="text-2xl font-bold tracking-tight">Create POS Order</h1>
          <p className="text-muted-foreground">Cashier order creation with smart credit card scanning.</p>
        </div>
        <Card className="w-full rounded-2xl md:w-80"><CardHeader className="pb-2"><CardDescription>Total</CardDescription><CardTitle>{money(total)}</CardTitle></CardHeader></Card>
      </div>

      <Card className="rounded-2xl border-dashed">
        <CardHeader><CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5" /> Scan credit card</CardTitle><CardDescription>Scan or paste card value like credit-account:12;authorized-user:55.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input value={scanText} onChange={(event) => setScanText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") applyScan(); }} placeholder="credit-account:12;authorized-user:55" />
          <Button onClick={applyScan}><ScanLine className="mr-2 h-4 w-4" /> Apply scan</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="rounded-2xl"><CardHeader><CardTitle>Order information</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="space-y-2"><Label>Order type</Label><Select value={payload.order_type} onValueChange={(order_type) => setPayload({ ...payload, order_type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="takeaway">Takeaway</SelectItem><SelectItem value="dine_in">Dine in</SelectItem></SelectContent></Select></div>
          {needsTable && <div className="space-y-2"><Label>Table</Label><Select value={payload.table_id} onValueChange={(table_id) => setPayload({ ...payload, table_id })}><SelectTrigger><SelectValue placeholder="Select table" /></SelectTrigger><SelectContent>{tables.map((table: any) => <SelectItem key={table.id} value={String(table.id)}>{table.table_number ?? table.name ?? `Table ${table.id}`}</SelectItem>)}</SelectContent></Select></div>}
          <div className="space-y-2"><Label>Waiter</Label><Select value={payload.waiter_id} onValueChange={(waiter_id) => setPayload({ ...payload, waiter_id })}><SelectTrigger><SelectValue placeholder="Select waiter" /></SelectTrigger><SelectContent>{waiters.map((waiter: any) => <SelectItem key={waiter.id} value={String(waiter.id)}>{waiter.name ?? waiter.full_name ?? waiter.email ?? `Waiter ${waiter.id}`}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Payment type</Label><Select value={payload.payment_type} onValueChange={(payment_type) => setPayload({ ...payload, payment_type, credit_account_id: payment_type === "credit" ? payload.credit_account_id : "", credit_account_user_id: payment_type === "credit" ? payload.credit_account_user_id : "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="regular">Regular</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent></Select></div>
          {isCredit && <div className="space-y-4 rounded-xl border p-3"><div className="space-y-2"><Label>Credit account</Label><Select value={payload.credit_account_id} onValueChange={(credit_account_id) => setPayload({ ...payload, credit_account_id })}><SelectTrigger><SelectValue placeholder="Select credit account" /></SelectTrigger><SelectContent>{creditAccounts.map((account) => <SelectItem key={account.id} value={String(account.id)}>{account.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Authorized user ID</Label><Input value={payload.credit_account_user_id} onChange={(event) => setPayload({ ...payload, credit_account_user_id: event.target.value })} placeholder="Scanned authorized user ID" /></div><div className="text-sm text-muted-foreground">Remaining limit: <span className="font-semibold">{money(remainingLimit)}</span></div>{total > remainingLimit && <p className="text-sm text-destructive">Credit limit exceeded.</p>}</div>}
          <div className="space-y-2"><Label>Notes</Label><Textarea value={payload.notes} onChange={(event) => setPayload({ ...payload, notes: event.target.value })} /></div>
          <Button className="w-full" disabled={!canSubmit || create.isPending} onClick={submit}>{create.isPending ? "Creating..." : "Create order"}</Button>
        </CardContent></Card>

        <div className="space-y-6">
          <Card className="rounded-2xl"><CardHeader><CardTitle>Menu items</CardTitle><CardDescription>Select menu items for the order.</CardDescription><Input value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search menu" /></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{menuItems.map((item: any) => <Card key={item.id} className="rounded-xl"><CardHeader className="pb-2"><CardTitle className="text-base">{item.name}</CardTitle><CardDescription>{money(item.price)}</CardDescription></CardHeader><CardContent><Button size="sm" variant="outline" onClick={() => addItem(item.id)}><Plus className="mr-2 h-4 w-4" /> Add</Button></CardContent></Card>)}</div></CardContent></Card>
          <Card className="rounded-2xl"><CardHeader><CardTitle>Selected items</CardTitle></CardHeader><CardContent><div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Total</TableHead><TableHead /></TableRow></TableHeader><TableBody>{items.length ? items.map((item) => { const menu = menuItems.find((m: any) => String(m.id) === String(item.menu_item_id)); const line = Number(menu?.price ?? 0) * item.quantity; return <TableRow key={String(item.menu_item_id)}><TableCell>{menu?.name ?? item.menu_item_id}</TableCell><TableCell><Input className="w-24" type="number" min="1" value={item.quantity} onChange={(event) => updateQty(item.menu_item_id, Number(event.target.value))} /></TableCell><TableCell>{money(line)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => updateQty(item.menu_item_id, 0)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>; }) : <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No items selected.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
