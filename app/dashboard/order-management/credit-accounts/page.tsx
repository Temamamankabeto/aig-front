"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Eye, MoreHorizontal, Pencil, Plus, Search, ShieldOff, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateCreditAccountMutation, useToggleCreditAccountMutation, useUpdateCreditAccountMutation } from "@/hooks/mutations/order-management";
import { useCreditAccountsQuery } from "@/hooks/queries/order-management";
import type { CreditAccount, CreditAccountPayload } from "@/types/order-management";

const emptyForm = {
  name: "",
  account_type: "bulky",
  tin_number: "",
  representative_name: "",
  representative_phone: "",
  status: "active",
  is_credit_enabled: "1",
};

type FormState = typeof emptyForm;

function active(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function accountTypeLabel(value?: string) {
  return String(value ?? "bulky") === "single" ? "Single" : "Bulky";
}

function agreementRows(account: CreditAccount) {
  const value = account as any;
  if (Array.isArray(value.active_agreements)) return value.active_agreements;
  if (Array.isArray(value.activeAgreements)) return value.activeAgreements;
  if (Array.isArray(value.agreements)) return value.agreements.filter((row: any) => row.is_active_now || row.status === "active");
  return [];
}

function formFromAccount(account: CreditAccount): FormState {
  return {
    name: account.name ?? "",
    account_type: String(account.account_type ?? "bulky"),
    tin_number: String((account as any).tin_number ?? ""),
    representative_name: String((account as any).representative_name ?? ""),
    representative_phone: String((account as any).representative_phone ?? ""),
    status: String(account.status ?? "active"),
    is_credit_enabled: active(account.is_credit_enabled) ? "1" : "0",
  };
}


type CreditAccountActionsProps = {
  account: CreditAccount;
  onEdit: (account: CreditAccount) => void;
  onToggle: (accountId: number | string) => void;
};

function CreditAccountActions({ account, onEdit, onToggle }: CreditAccountActionsProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuWidth = 192;
      const viewportPadding = 12;
      const nextLeft = Math.min(
        Math.max(viewportPadding, rect.right - menuWidth),
        window.innerWidth - menuWidth - viewportPadding,
      );

      setPosition({
        top: rect.bottom + 8,
        left: nextLeft,
      });
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    updatePosition();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const isBlocked = String(account.status) === "blocked";

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open credit account actions"
        aria-expanded={open}
        className="credit-actions-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              className="credit-actions-menu"
              style={{ top: position.top, left: position.left }}
              role="menu"
              aria-label="Credit account actions"
            >
              <div className="credit-actions-menu-title">Actions</div>
              <div className="credit-actions-menu-separator" />
              <Link
                href={`/dashboard/order-management/credit-accounts/${account.id}`}
                className="credit-actions-menu-item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <Eye className="h-4 w-4" />
                Detail
              </Link>
              <button
                type="button"
                className="credit-actions-menu-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onEdit(account);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                className="credit-actions-menu-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onToggle(account.id);
                }}
              >
                {isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                {isBlocked ? "Unblock" : "Block"}
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function payloadFromForm(form: FormState): CreditAccountPayload {
  return {
    name: form.name.trim(),
    account_type: form.account_type,
    tin_number: form.tin_number.trim() || null,
    representative_name: form.representative_name.trim(),
    representative_phone: form.representative_phone.trim(),
    status: form.status,
    is_credit_enabled: form.is_credit_enabled === "1",
  };
}

export default function CreditAccountsPage() {
  const [filters, setFilters] = useState({ page: 1, per_page: 10, search: "", account_type: "all", status: "all" });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const accountsQuery = useCreditAccountsQuery(filters as any);
  const createMutation = useCreateCreditAccountMutation(() => closeForm());
  const updateMutation = useUpdateCreditAccountMutation();
  const toggleMutation = useToggleCreditAccountMutation();

  const rows = accountsQuery.data?.data ?? [];
  const meta = accountsQuery.data?.meta;
  const saving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(account: CreditAccount) {
    setEditing(account);
    setForm(formFromAccount(account));
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function submit() {
    const payload = payloadFromForm(form);
    if (!payload.name) return toast.error("Account name is required");
    if (!payload.representative_name) return toast.error("Representative name is required");
    if (!payload.representative_phone) return toast.error("Representative phone is required");

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload }, { onSuccess: () => { toast.success("Credit account updated"); closeForm(); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update account") });
      return;
    }

    createMutation.mutate(payload, { onSuccess: () => toast.success("Credit account created. Add agreement before allowing orders."), onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create account") });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Accounts</h1>
          <p className="text-muted-foreground">Agreement-based credit accounts. Credit limit logic is removed; active agreement date controls ordering.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Credit Account</Button>
      </div>


      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>Create accounts first, then add agreements from account detail.</CardDescription>
            </div>
            <div className="relative md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, TIN, representative" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={filters.account_type} onValueChange={(account_type) => setFilters((current) => ({ ...current, account_type, page: 1 }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="bulky">Bulky</SelectItem><SelectItem value="single">Single</SelectItem></SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(status) => setFilters((current) => ({ ...current, status, page: 1 }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setFilters({ page: 1, per_page: 10, search: "", account_type: "all", status: "all" })}>Reset filters</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Account</TableHead><TableHead>Type</TableHead><TableHead>TIN</TableHead><TableHead>Representative</TableHead><TableHead>Active agreement</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {accountsQuery.isLoading ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading accounts...</TableCell></TableRow> : rows.length ? rows.map((account) => {
                  const agreements = agreementRows(account);
                  return <TableRow key={account.id}>
                    <TableCell><div className="font-semibold">{account.name}</div><div className="text-xs text-muted-foreground">#{account.id}</div></TableCell>
                    <TableCell><Badge variant="outline" className="gap-1">{account.account_type === "single" ? <UserRound className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}{accountTypeLabel(account.account_type)}</Badge></TableCell>
                    <TableCell>{(account as any).tin_number || "—"}</TableCell>
                    <TableCell><div>{(account as any).representative_name || "—"}</div><div className="text-xs text-muted-foreground">{(account as any).representative_phone || "—"}</div></TableCell>
                    <TableCell>{agreements.length ? <Badge>{agreements.length} active</Badge> : <Badge variant="destructive">No active agreement</Badge>}</TableCell>
                    <TableCell><Badge variant={String(account.status ?? "active") === "active" && active(account.is_credit_enabled) ? "outline" : "destructive"}>{String(account.status ?? "active")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <CreditAccountActions
                        account={account}
                        onEdit={openEdit}
                        onToggle={(accountId) => toggleMutation.mutate(accountId)}
                      />
                    </TableCell>
                  </TableRow>;
                }) : <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No credit accounts found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">Page {meta?.current_page ?? 1} of {meta?.last_page ?? 1}</p><div className="flex gap-2"><Button variant="outline" disabled={(meta?.current_page ?? 1) <= 1} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}>Previous</Button><Button variant="outline" disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</Button></div></div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit credit account" : "Create credit account"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label>Account name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Account type</Label><Select value={form.account_type} onValueChange={(account_type) => setForm({ ...form, account_type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bulky">Bulky</SelectItem><SelectItem value="single">Single</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>TIN number</Label><Input value={form.tin_number} onChange={(e) => setForm({ ...form, tin_number: e.target.value })} /></div>
            <div className="space-y-2"><Label>Representative</Label><Input value={form.representative_name} onChange={(e) => setForm({ ...form, representative_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Representative phone</Label><Input value={form.representative_phone} onChange={(e) => setForm({ ...form, representative_phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Credit enabled</Label><Select value={form.is_credit_enabled} onValueChange={(is_credit_enabled) => setForm({ ...form, is_credit_enabled })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Yes</SelectItem><SelectItem value="0">No</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={closeForm}>Cancel</Button><Button disabled={saving} onClick={submit}>{editing ? "Update account" : "Create account"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
