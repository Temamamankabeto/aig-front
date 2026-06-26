import { Badge } from "@/components/ui/badge";
import type { TableStatus } from "@/types/table-management";

const labels: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
  inactive: "Inactive",
  pending_order: "Pending Order",
  order_in_progress: "In Progress",
  awaiting_bill: "Awaiting Bill",
  awaiting_payment: "Awaiting Payment",
};

export function TableStatusBadge({ status }: { status?: TableStatus | string | null }) {
  const value = status ?? "available";
  const variant = value === "available" ? "secondary" : value === "occupied" ? "default" : value === "reserved" ? "outline" : "destructive";
  return <Badge variant={variant}>{labels[value] ?? String(value).replace(/_/g, " ")}</Badge>;
}
