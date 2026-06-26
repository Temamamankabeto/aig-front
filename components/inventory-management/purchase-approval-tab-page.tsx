"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/inventory-management";
import { procurementService, type PurchaseOrderRow } from "@/services/inventory-management/procurement.service";
import { statusBadge } from "@/components/inventory-management/procurement-pages";
import { useState } from "react";

function extractError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function PurchaseApprovalTabPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["inventory-tabs", "purchase-approval", search],
    queryFn: () => procurementService.purchaseOrders({ status: "food_validated", search, per_page: 20 }, "manager"),
    staleTime: 30000,
    retry: false,
  });

  const rows = query.data?.data ?? [];

  const approve = useMutation({
    mutationFn: (id: number) => procurementService.approvePurchaseOrder(id, "manager"),
    onSuccess: () => {
      toast.success("Purchase order approved and ready for receiving");
      qc.invalidateQueries({ queryKey: ["inventory-tabs", "purchase-approval"] });
      qc.invalidateQueries({ queryKey: ["inventory-tabs", "purchase-approval-count"] });
      qc.invalidateQueries({ queryKey: ["sidebar-purchase-count"] });
      qc.invalidateQueries({ queryKey: ["procurement", "purchase-orders"] });
    },
    onError: (error) => toast.error(extractError(error, "Failed to approve purchase order")),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-2">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Purchase Approval</CardTitle>
                <CardDescription>
                  Manager approves purchase orders after Food Controller validation. Only Food Controller validated orders are shown here.
                </CardDescription>
              </div>
            </div>
            <div className="relative md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search PO or supplier..." />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading purchase approvals...</p>
          ) : rows.length ? (
            <PurchaseApprovalTable rows={rows} approving={approve.isPending} onApprove={(id) => approve.mutate(id)} />
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">No orders awaiting approval</p>
              <p className="mt-1 text-sm text-muted-foreground">Food Controller validated purchase orders will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PurchaseApprovalTable({ rows, approving, onApprove }: { rows: PurchaseOrderRow[]; approving: boolean; onApprove: (id: number) => void }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Flow</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((po) => (
            <TableRow key={po.id}>
              <TableCell className="font-medium">{po.po_number ?? `PO-${po.id}`}</TableCell>
              <TableCell>{po.supplier?.name ?? `Supplier #${po.supplier_id}`}</TableCell>
              <TableCell>{statusBadge(po.status)}</TableCell>
              <TableCell>{po.items?.length ?? 0}</TableCell>
              <TableCell>{formatMoney(po.total ?? 0)} ETB</TableCell>
              <TableCell><Badge variant="secondary">Food Controller validated</Badge></TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => onApprove(po.id)} disabled={approving}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
