"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, MoreHorizontal, Pencil, Plus, Printer, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateCreditAgreementMutation, useDisableCreditAgreementMutation, useUpdateCreditAgreementMutation } from "@/hooks/mutations/order-management";
import type { CreditAccount, CreditAgreement, CreditAgreementPayload } from "@/types/order-management";

const emptyAgreement = {
  meal_type: "",
  number_of_person: "1",
  single_person_name: "",
  price_per_person: "0",
  start_date: "",
  end_date: "",
  total_price: "",
  status: "active",
  agreement_letter: null as File | null,
};

type AgreementForm = typeof emptyAgreement;

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function date(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function active(value: unknown) {
  return value === true || value === 1 || value === "1";
}

function accountNo(accountId: string | number) {
  return `CR-${String(accountId).replace(/\D/g, "").padStart(6, "0")}`;
}

function formFromAgreement(agreement: CreditAgreement): AgreementForm {
  return {
    meal_type: agreement.meal_type ?? "",
    number_of_person: String(agreement.number_of_person ?? 1),
    single_person_name: agreement.single_person_name ?? "",
    price_per_person: String(agreement.price_per_person ?? 0),
    start_date: String(agreement.start_date ?? "").slice(0, 10),
    end_date: String(agreement.end_date ?? "").slice(0, 10),
    total_price: String(agreement.total_price ?? ""),
    status: String(agreement.status ?? "active"),
    agreement_letter: null,
  };
}

function payloadFromForm(form: AgreementForm): CreditAgreementPayload {
  const persons = Math.max(1, Number(form.number_of_person || 1));
  const price = Number(form.price_per_person || 0);
  return {
    meal_type: form.meal_type.trim(),
    number_of_person: persons,
    single_person_name: form.single_person_name.trim() || null,
    price_per_person: price,
    start_date: form.start_date,
    end_date: form.end_date,
    total_price: form.total_price ? Number(form.total_price) : persons * price,
    status: form.status,
    agreement_letter: form.agreement_letter,
  };
}

async function fetchAccount(id: string | number) {
  const response = await api.get(`/credit/accounts/${id}`);
  return response.data?.data as CreditAccount;
}

function isAgreementActiveNow(agreement: CreditAgreement) {
  const today = new Date().toISOString().slice(0, 10);
  const start = String(agreement.start_date ?? "").slice(0, 10);
  const end = String(agreement.end_date ?? "").slice(0, 10);
  return String(agreement.status ?? "active") === "active" && start <= today && end >= today;
}

export default function CreditAccountDetailPage() {
  const params = useParams();
  const accountId = String(params?.id ?? "");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditAgreement | null>(null);
  const [form, setForm] = useState<AgreementForm>(emptyAgreement);

  const accountQuery = useQuery({ queryKey: ["credit-account-detail", accountId], queryFn: () => fetchAccount(accountId), enabled: Boolean(accountId) });
  const createAgreement = useCreateCreditAgreementMutation();
  const updateAgreement = useUpdateCreditAgreementMutation();
  const disableAgreement = useDisableCreditAgreementMutation();

  const account = accountQuery.data;
  const agreements = ((account as any)?.agreements ?? []) as CreditAgreement[];
  const activeAgreements = agreements.filter(isAgreementActiveNow);
  const expiredAgreements = agreements.filter((agreement) => String(agreement.end_date ?? "").slice(0, 10) < new Date().toISOString().slice(0, 10));
  const totalAgreementValue = useMemo(() => agreements.reduce((sum, row) => sum + Number(row.total_price ?? 0), 0), [agreements]);
  const saving = createAgreement.isPending || updateAgreement.isPending;

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyAgreement, number_of_person: account?.account_type === "single" ? "1" : "1" });
    setOpen(true);
  }

  function openEdit(agreement: CreditAgreement) {
    setEditing(agreement);
    setForm(formFromAgreement(agreement));
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditing(null);
    setForm(emptyAgreement);
  }

  function submitAgreement() {
    if (!account) return;
    const payload = payloadFromForm(form);
    if (!payload.meal_type) return toast.error("Meal type is required");
    if (!payload.start_date || !payload.end_date) return toast.error("Date range is required");
    if (account.account_type === "single" && !payload.single_person_name) return toast.error("Single account agreement requires person name");

    if (editing) {
      updateAgreement.mutate({ accountId: account.id, agreementId: editing.id, payload }, { onSuccess: () => { toast.success("Agreement updated"); closeForm(); accountQuery.refetch(); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update agreement") });
      return;
    }

    createAgreement.mutate({ accountId: account.id, payload }, { onSuccess: () => { toast.success("Agreement added"); closeForm(); accountQuery.refetch(); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create agreement") });
  }

  if (accountQuery.isLoading) {
    return <div className="p-6 text-muted-foreground">Loading credit account...</div>;
  }

  if (!account) {
    return <div className="p-6 text-muted-foreground">Credit account was not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" className="px-0"><Link href="/dashboard/order-management/credit-accounts"><ArrowLeft className="mr-2 h-4 w-4" /> Back to credit accounts</Link></Button>
          <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
          <p className="text-muted-foreground">Agreement-based credit account. Orders are allowed only while an agreement is active and within date range.</p>
        </div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button><Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Agreement</Button></div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardDescription>Account No</CardDescription><CardTitle>{accountNo(account.id)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Type</CardDescription><CardTitle className="capitalize">{account.account_type}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Active agreements</CardDescription><CardTitle>{activeAgreements.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Agreement value</CardDescription><CardTitle>{money(totalAgreementValue)}</CardTitle></CardHeader></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Account information</CardTitle><CardDescription>Credit limit and remaining balance are intentionally removed from this module.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Account name</p><p className="font-semibold">{account.name}</p></div>
          <div><p className="text-xs text-muted-foreground">TIN number</p><p className="font-semibold">{(account as any).tin_number || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={String(account.status ?? "active") === "active" && active(account.is_credit_enabled) ? "outline" : "destructive"}>{String(account.status ?? "active")}</Badge></div>
          <div><p className="text-xs text-muted-foreground">Representative</p><p className="font-semibold">{(account as any).representative_name || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Representative phone</p><p className="font-semibold">{(account as any).representative_phone || "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Expired agreements</p><p className="font-semibold">{expiredAgreements.length}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><CardTitle>Agreements</CardTitle><CardDescription>After the end date, the agreement becomes inactive for ordering.</CardDescription></div>
          <Button onClick={openCreate}><FileText className="mr-2 h-4 w-4" /> Add agreement</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader><TableRow><TableHead>Meal type</TableHead><TableHead>Person(s)</TableHead><TableHead>Price / person</TableHead><TableHead>Date range</TableHead><TableHead>Total</TableHead><TableHead>File</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {agreements.length ? agreements.map((agreement) => {
                  const canOrder = isAgreementActiveNow(agreement);
                  return <TableRow key={agreement.id}>
                    <TableCell className="font-medium">{agreement.meal_type}</TableCell>
                    <TableCell><div>{agreement.number_of_person ?? 1}</div>{agreement.single_person_name && <div className="text-xs text-muted-foreground">{agreement.single_person_name}</div>}</TableCell>
                    <TableCell>{money(agreement.price_per_person)}</TableCell>
                    <TableCell>{date(agreement.start_date)} → {date(agreement.end_date)}</TableCell>
                    <TableCell>{money(agreement.total_price)}</TableCell>
                    <TableCell>{agreement.agreement_letter_url ? <Button asChild size="sm" variant="outline"><a href={agreement.agreement_letter_url} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" />Open</a></Button> : "—"}</TableCell>
                    <TableCell><Badge variant={canOrder ? "outline" : "destructive"}>{canOrder ? "Active for order" : String(agreement.status ?? "expired")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Open agreement actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEdit(agreement)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={String(agreement.status) !== "active"}
                            onClick={() => disableAgreement.mutate({ accountId: account.id, agreementId: agreement.id }, { onSuccess: () => { toast.success("Agreement disabled"); accountQuery.refetch(); } })}
                          >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Disable
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>;
                }) : <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No agreements added yet. Credit orders are not allowed until an active agreement exists.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit agreement" : "Add agreement"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Meal type</Label><Input placeholder="Breakfast, Lunch, Dinner..." value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })} /></div>
            <div className="space-y-2"><Label>Number of person</Label><Input type="number" min={1} value={form.number_of_person} onChange={(e) => setForm({ ...form, number_of_person: e.target.value, total_price: String(Number(e.target.value || 0) * Number(form.price_per_person || 0)) })} /></div>
            {account.account_type === "single" && <div className="space-y-2 md:col-span-2"><Label>Single person name</Label><Input value={form.single_person_name} onChange={(e) => setForm({ ...form, single_person_name: e.target.value })} /></div>}
            <div className="space-y-2"><Label>Price per person</Label><Input type="number" min={0} value={form.price_per_person} onChange={(e) => setForm({ ...form, price_per_person: e.target.value, total_price: String(Number(form.number_of_person || 0) * Number(e.target.value || 0)) })} /></div>
            <div className="space-y-2"><Label>Total price</Label><Input type="number" min={0} value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} /></div>
            <div className="space-y-2"><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>End date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="disabled">Disabled</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Agreement letter file</Label><Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setForm({ ...form, agreement_letter: e.target.files?.[0] ?? null })} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={closeForm}>Cancel</Button><Button disabled={saving} onClick={submitAgreement}>{editing ? "Update agreement" : "Save agreement"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
