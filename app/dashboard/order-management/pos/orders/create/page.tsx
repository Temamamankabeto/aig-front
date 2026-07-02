"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMenuItemsQuery } from "@/hooks/queries/menu-management";
import { useTablesQuery } from "@/hooks/queries/table-management";
import {
  useCreditAccountsQuery,
  useWaitersLiteQuery,
} from "@/hooks/queries/order-management";
import { useCreateOrderMutation } from "@/hooks/mutations/order-management";
import type {
  CreditAgreement,
  Order,
  OrderItemPayload,
} from "@/types/order-management";
import { printCustomerOrderTicket } from "@/components/order-management/order-print-utils";

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function imageUrlFromMenu(item: any) {
  const raw =
    item?.image_url ||
    item?.image_path ||
    item?.image ||
    item?.photo_url ||
    item?.photo ||
    "";
  if (!raw) return "";
  if (String(raw).startsWith("http")) return String(raw);
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  const cleaned = String(raw).replace(/^\//, "");
  return base ? `${base}/${cleaned}` : `/${cleaned}`;
}

function normalizeCreatedOrder(value: unknown): Order | undefined {
  const response = value as any;
  return response?.data?.order ?? response?.data ?? response?.order ?? response;
}

function activeAgreements(account: any): CreditAgreement[] {
  const today = new Date().toISOString().slice(0, 10);
  const list =
    account?.active_agreements ??
    account?.activeAgreements ??
    account?.agreements ??
    [];
  return Array.isArray(list)
    ? list.filter((agreement: any) => {
        const status = String(agreement.status ?? "active").toLowerCase();
        const start = String(agreement.start_date ?? "").slice(0, 10);
        const end = String(agreement.end_date ?? "").slice(0, 10);
        return (
          status === "active" &&
          (!start || start <= today) &&
          (!end || end >= today)
        );
      })
    : [];
}

function agreementFileUrl(agreement?: CreditAgreement | null) {
  if (!agreement) return "";
  if (agreement.agreement_letter_url)
    return String(agreement.agreement_letter_url);
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  return `${base}/api/credit/agreements/${agreement.id}/file`;
}

function buildPrintableOrderFromSelection({
  created,
  submittedPayload,
  submittedItems,
  menuItems,
  tables,
  waiters,
  total,
}: {
  created?: Order;
  submittedPayload: any;
  submittedItems: OrderItemPayload[];
  menuItems: any[];
  tables: any[];
  waiters: any[];
  total: number;
}): Order {
  const printable: any = { ...(created ?? {}) };

  if (!printable.items?.length && !printable.order_items?.length) {
    printable.items = submittedItems.map((item) => {
      const menu = menuItems.find(
        (menuItem) => String(menuItem.id) === String(item.menu_item_id),
      );
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(menu?.price ?? 0);
      return {
        menu_item_id: item.menu_item_id,
        menu_item: menu,
        quantity,
        unit_price: unitPrice,
        line_total: quantity * unitPrice,
        station:
          String(menu?.type ?? "food").toLowerCase() === "drink"
            ? "bar"
            : "kitchen",
        item_status: "confirmed",
        notes: item.notes ?? item.note ?? null,
      };
    });
  }

  printable.order_type = printable.order_type ?? submittedPayload.order_type;
  printable.payment_type =
    printable.payment_type ?? submittedPayload.payment_type;
  printable.table_id = printable.table_id ?? submittedPayload.table_id;
  printable.waiter_id = printable.waiter_id ?? submittedPayload.waiter_id;
  printable.total = printable.total ?? printable.total_amount ?? total;
  printable.status = printable.status ?? "confirmed";
  printable.created_at = printable.created_at ?? new Date().toISOString();
  printable.credit_order_mode =
    printable.credit_order_mode ?? submittedPayload.credit_order_mode;
  printable.meal_type = printable.meal_type ?? submittedPayload.meal_type;
  printable.number_of_person =
    printable.number_of_person ?? submittedPayload.number_of_person;

  if (!printable.table && submittedPayload.table_id) {
    printable.table =
      tables.find(
        (table) => String(table.id) === String(submittedPayload.table_id),
      ) ?? null;
  }
  if (!printable.waiter && submittedPayload.waiter_id) {
    printable.waiter =
      waiters.find(
        (waiter) => String(waiter.id) === String(submittedPayload.waiter_id),
      ) ?? null;
  }
  if (!printable.bill) {
    printable.bill = {
      bill_number: `BILL-${printable.order_number ?? printable.id ?? "NEW"}`,
      total,
      paid_amount: 0,
      balance: total,
      status: "draft",
    };
  }
  return printable as Order;
}

export default function CashierPosCreateOrderPage() {
  const [menuSearch, setMenuSearch] = useState("");
  const [payload, setPayload] = useState({
    table_id: "",
    waiter_id: "",
    order_type: "takeaway",
    payment_type: "cash",
    credit_account_id: "",
    credit_account_user_id: "",
    credit_agreement_id: "",
    credit_order_mode: "order_based",
    meal_type: "Lunch",
    number_of_person: 1,
  });
  const [items, setItems] = useState<OrderItemPayload[]>([]);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [billCustomerName, setBillCustomerName] = useState("Guest");

  const menuQuery = useMenuItemsQuery(
    {
      per_page: 200,
      available: 1,
      is_available: 1,
      active: 1,
      is_active: 1,
      search: menuSearch,
    },
    "cashier",
  );
  const tablesQuery = useTablesQuery(
    { per_page: 100, status: "available", is_active: 1 },
    "cashier",
  );
  const waitersQuery = useWaitersLiteQuery();
  const creditAccountsQuery = useCreditAccountsQuery({
    per_page: 100,
    status: "active",
  });
  const create = useCreateOrderMutation("cashier", () => {
    setItems([]);
    setPayload({
      table_id: "",
      waiter_id: "",
      order_type: "takeaway",
      payment_type: "cash",
      credit_account_id: "",
      credit_account_user_id: "",
      credit_agreement_id: "",
      credit_order_mode: "order_based",
      meal_type: "Lunch",
      number_of_person: 1,
    });
  });

  const menuItems = menuQuery.data?.data ?? [];
  const tables = tablesQuery.data?.data ?? [];
  const waiters = waitersQuery.data ?? [];
  const creditAccounts = creditAccountsQuery.data?.data ?? [];
  const selectedCreditAccount = creditAccounts.find(
    (account) => String(account.id) === String(payload.credit_account_id),
  );
  const agreements = activeAgreements(selectedCreditAccount);
  const selectedAgreement =
    agreements.find(
      (agreement) =>
        String(agreement.id) === String(payload.credit_agreement_id),
    ) ?? agreements[0];
  const isCredit = payload.payment_type === "credit";
  const isBeefBased = isCredit && payload.credit_order_mode === "beef_based";
  const needsTable = payload.order_type === "dine_in";

  const cartTotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const menu = menuItems.find(
          (m) => String(m.id) === String(item.menu_item_id),
        );
        return sum + Number(menu?.price ?? 0) * item.quantity;
      }, 0),
    [items, menuItems],
  );

  const beefTotal = useMemo(() => {
    if (!selectedAgreement) return 0;
    return (
      Number(selectedAgreement.price_per_person ?? 0) *
      Math.max(1, Number(payload.number_of_person ?? 1))
    );
  }, [selectedAgreement, payload.number_of_person]);

  const total = isBeefBased ? beefTotal : cartTotal;

  const canSubmit =
    Boolean(payload.waiter_id) &&
    (!needsTable || Boolean(payload.table_id)) &&
    (!isCredit ||
      (Boolean(payload.credit_account_id) && Boolean(selectedAgreement))) &&
    (!isCredit ||
      payload.credit_order_mode !== "beef_based" ||
      (Boolean(payload.meal_type) && Number(payload.number_of_person) > 0)) &&
    (isBeefBased || items.length > 0);

  function applyScan() {
    const parsed = parseCreditScan(scanText);
    if (!parsed) {
      toast.error(
        "Invalid card scan. Expected credit-account:{id};authorized-user:{id}",
      );
      return;
    }
    setPayload((current) => ({
      ...current,
      payment_type: "credit",
      credit_account_id: parsed.credit_account_id,
      credit_account_user_id: parsed.credit_account_user_id,
    }));
    toast.success("Credit card scanned and selected");
  }

  function addItem(id: string | number) {
    const exists = items.find((i) => String(i.menu_item_id) === String(id));
    setItems(
      exists
        ? items.map((i) =>
            String(i.menu_item_id) === String(id)
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...items, { menu_item_id: id, quantity: 1 }],
    );
  }

  function updateQty(id: string | number, quantity: number) {
    if (quantity <= 0) {
      setItems(
        items.filter((item) => String(item.menu_item_id) !== String(id)),
      );
      return;
    }
    setItems(
      items.map((item) =>
        String(item.menu_item_id) === String(id) ? { ...item, quantity } : item,
      ),
    );
  }

  function resetCreditAgreement(accountId: string) {
    const account = creditAccounts.find(
      (row) => String(row.id) === String(accountId),
    );
    const firstAgreement = activeAgreements(account)[0];
    setPayload((current) => ({
      ...current,
      credit_account_id: accountId,
      credit_agreement_id: firstAgreement ? String(firstAgreement.id) : "",
      credit_order_mode: String(
        firstAgreement?.agreement_type ??
          current.credit_order_mode ??
          "order_based",
      ),
      meal_type: firstAgreement?.meal_type ?? current.meal_type,
      number_of_person: Number(
        firstAgreement?.number_of_person ?? current.number_of_person ?? 1,
      ),
    }));
  }

  function submit() {
    if (!canSubmit) {
      toast.error(
        "Complete waiter, table when dine-in, active credit agreement, and required order details.",
      );
      return;
    }

    const submittedPayload = {
      ...payload,
      table_id: payload.table_id || null,
      waiter_id: payload.waiter_id || null,
      payment_type: isCredit ? "credit" : "cash",
      credit_account_id: isCredit ? payload.credit_account_id : null,
      credit_account_user_id: isCredit
        ? payload.credit_account_user_id || null
        : null,
      credit_agreement_id: isCredit
        ? String(selectedAgreement?.id ?? payload.credit_agreement_id)
        : null,
      credit_order_mode: isCredit ? payload.credit_order_mode : null,
      meal_type: isCredit ? payload.meal_type : null,
      number_of_person: isCredit ? Number(payload.number_of_person) : null,
      customer_name:
        selectedCreditAccount?.account_type === "single"
          ? billCustomerName || "Guest"
          : "Guest",
      items: isBeefBased ? [] : items,
    };

    const submittedItems = [...(isBeefBased ? [] : items)];
    const submittedTotal = total;

    create.mutate(submittedPayload as any, {
      onSuccess: (response) => {
        const normalized = normalizeCreatedOrder(response);
        const printable = buildPrintableOrderFromSelection({
          created: normalized,
          submittedPayload,
          submittedItems,
          menuItems: [...menuItems],
          tables: [...tables],
          waiters: [...waiters],
          total: submittedTotal,
        });
        setCreatedOrder(printable);
        setBillCustomerName(
          printable.customer_name ||
            (selectedCreditAccount?.account_type === "single"
              ? selectedAgreement?.single_person_name || "Guest"
              : "Guest"),
        );
        setPrintDialogOpen(true);
        toast.success(
          "Order created. You can still add/edit items until the bill is printed.",
        );
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : "Failed to create order",
        ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-3">
            <Link href="/dashboard/order-management/pos/orders">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to POS orders
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Create POS Order
          </h1>
          <p className="text-muted-foreground">
            Cash or agreement-based credit order workflow.
          </p>
        </div>
        <Card className="w-full rounded-2xl md:w-80">
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle>{money(total)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Order information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Order type</Label>
              <Select
                value={payload.order_type}
                onValueChange={(order_type) =>
                  setPayload({ ...payload, order_type })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="dine_in">Dine in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {needsTable && (
              <div className="space-y-2">
                <Label>Table</Label>
                <Select
                  value={payload.table_id}
                  onValueChange={(table_id) =>
                    setPayload({ ...payload, table_id })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table: any) => (
                      <SelectItem key={table.id} value={String(table.id)}>
                        {table.table_number ??
                          table.name ??
                          `Table ${table.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Waiter</Label>
              <Select
                value={payload.waiter_id}
                onValueChange={(waiter_id) =>
                  setPayload({ ...payload, waiter_id })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select waiter" />
                </SelectTrigger>
                <SelectContent>
                  {waiters.map((waiter: any) => (
                    <SelectItem key={waiter.id} value={String(waiter.id)}>
                      {waiter.name ??
                        waiter.full_name ??
                        waiter.email ??
                        `Waiter ${waiter.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment type</Label>
              <Select
                value={payload.payment_type}
                onValueChange={(payment_type) =>
                  setPayload({
                    ...payload,
                    payment_type,
                    credit_account_id:
                      payment_type === "credit"
                        ? payload.credit_account_id
                        : "",
                    credit_account_user_id:
                      payment_type === "credit"
                        ? payload.credit_account_user_id
                        : "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCredit && (
              <div className="space-y-4 rounded-xl border p-3">
                <div className="space-y-2">
                  <Label>Credit account</Label>
                  <Select
                    value={payload.credit_account_id}
                    onValueChange={resetCreditAgreement}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit account" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditAccounts.map((account) => (
                        <SelectItem key={account.id} value={String(account.id)}>
                          {account.name} • {account.account_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCreditAccount && (
                  <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Account type</span>
                      <strong className="capitalize">
                        {selectedCreditAccount.account_type}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>TIN</span>
                      <strong>{selectedCreditAccount.tin_number || "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Representative</span>
                      <strong>
                        {selectedCreditAccount.representative_name || "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Phone</span>
                      <strong>
                        {selectedCreditAccount.representative_phone || "—"}
                      </strong>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Active agreement</Label>
                  <Select
                    value={String(
                      selectedAgreement?.id ?? payload.credit_agreement_id,
                    )}
                    onValueChange={(credit_agreement_id) => {
                      const agreement = agreements.find(
                        (row) => String(row.id) === String(credit_agreement_id),
                      );
                      setPayload({
                        ...payload,
                        credit_agreement_id,
                        credit_order_mode: String(
                          agreement?.agreement_type ??
                            payload.credit_order_mode,
                        ),
                        meal_type: agreement?.meal_type ?? payload.meal_type,
                        number_of_person: Number(
                          agreement?.number_of_person ??
                            payload.number_of_person,
                        ),
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agreement" />
                    </SelectTrigger>
                    <SelectContent>
                      {agreements.length ? (
                        agreements.map((agreement) => (
                          <SelectItem
                            key={agreement.id}
                            value={String(agreement.id)}
                          >
                            {agreement.meal_type} •{" "}
                            {String(
                              agreement.agreement_type ?? "order_based",
                            ).replace("_", " ")}{" "}
                            • {String(agreement.start_date).slice(0, 10)} →{" "}
                            {String(agreement.end_date).slice(0, 10)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No active agreement
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedAgreement && (
                  <div className="rounded-lg border bg-background p-3 text-xs">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge>{selectedAgreement.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Price/person</span>
                      <strong>
                        {money(selectedAgreement.price_per_person)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total agreement</span>
                      <strong>{money(selectedAgreement.total_price)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Agreement file</span>
                      {agreementFileUrl(selectedAgreement) ? (
                        <a
                          className="text-primary underline"
                          href={agreementFileUrl(selectedAgreement)}
                          target="_blank"
                        >
                          Open file
                        </a>
                      ) : (
                        <strong>—</strong>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Credit order mode</Label>
                  <Select
                    value={payload.credit_order_mode}
                    onValueChange={(credit_order_mode) =>
                      setPayload({ ...payload, credit_order_mode })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_based">Order Based</SelectItem>
                      <SelectItem value="beef_based">Beef Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedCreditAccount?.account_type === "single" && (
                  <div className="space-y-2">
                    <Label>Customer name on bill</Label>
                    <Input
                      value={billCustomerName}
                      onChange={(event) =>
                        setBillCustomerName(event.target.value)
                      }
                      placeholder="Guest"
                    />
                  </div>
                )}
                {isBeefBased && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Meal</Label>
                      <Select
                        value={payload.meal_type}
                        onValueChange={(meal_type) =>
                          setPayload({ ...payload, meal_type })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Breakfast">Breakfast</SelectItem>
                          <SelectItem value="Lunch">Lunch</SelectItem>
                          <SelectItem value="Dinner">Dinner</SelectItem>
                          <SelectItem value="Refreshment">
                            Refreshment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Number of persons</Label>
                      <Input
                        type="number"
                        min="1"
                        value={payload.number_of_person}
                        onChange={(event) =>
                          setPayload({
                            ...payload,
                            number_of_person: Number(event.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}
                {!selectedAgreement && (
                  <p className="text-sm text-destructive">
                    No active agreement. Credit order is disabled.
                  </p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              disabled={!canSubmit || create.isPending}
              onClick={submit}
            >
              {create.isPending ? "Creating..." : "Create order"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!isBeefBased && (
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Menu items</CardTitle>
                <CardDescription>
                  Select menu items for order-based orders.
                </CardDescription>
                <Input
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                  placeholder="Search menu"
                />
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {menuItems.map((item: any) => {
                    const image = imageUrlFromMenu(item);
                    return (
                      <Card
                        key={item.id}
                        className="overflow-hidden rounded-xl"
                      >
                        <div className="h-32 bg-muted">
                          {image ? (
                            <img
                              src={image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {item.name}
                          </CardTitle>
                          <CardDescription>
                            {money(item.price)} • {item.type}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addItem(item.id)}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add to cart
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>
                {isBeefBased ? "Beef Based Summary" : "Add to cart"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isBeefBased ? (
                <div className="rounded-xl border p-4">
                  <p className="font-semibold">{payload.meal_type}</p>
                  <p className="text-sm text-muted-foreground">
                    Persons: {payload.number_of_person}
                  </p>
                  <p className="mt-2 text-xl font-bold">{money(beefTotal)}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length ? (
                        items.map((item) => {
                          const menu = menuItems.find(
                            (m: any) =>
                              String(m.id) === String(item.menu_item_id),
                          );
                          const line = Number(menu?.price ?? 0) * item.quantity;
                          return (
                            <TableRow key={String(item.menu_item_id)}>
                              <TableCell>
                                {menu?.name ?? item.menu_item_id}
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="w-24"
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateQty(
                                      item.menu_item_id,
                                      Number(event.target.value),
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>{money(line)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateQty(item.menu_item_id, 0)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No items added to cart.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order created successfully</DialogTitle>
            <DialogDescription>
              Your confirmed cashier order has been created successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-muted/40 p-4 text-sm">
            <p className="text-muted-foreground">Order number</p>
            <p className="text-lg font-semibold">
              {createdOrder?.order_number ?? `#${createdOrder?.id ?? "NEW"}`}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              disabled={!createdOrder}
              onClick={() =>
                createdOrder && printCustomerOrderTicket(createdOrder)
              }
            >
              <Printer className="mr-2 h-4 w-4" />
              Order ticket
            </Button>
            <Button asChild disabled={!createdOrder}>
              <Link
                href={
                  createdOrder?.id
                    ? `/dashboard/order-management/pos/orders/${createdOrder.id}`
                    : "/dashboard/order-management/pos/orders"
                }
              >
                View POS order
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
