import { OrdersPage } from "@/components/order-management";
export default function Page() { return <OrdersPage scope="cashier" title="POS Orders" createHref="/dashboard/order-management/pos/orders/create" />; }
