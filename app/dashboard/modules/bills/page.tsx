import { FinanceManagementPage } from "@/components/finance-management/finance-management-page";

export default function BillsPage() {
  return <FinanceManagementPage scope="admin" initialTab="bills" billStatus="paid" />;
}
