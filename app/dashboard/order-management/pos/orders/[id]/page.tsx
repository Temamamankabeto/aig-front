import { OrderDetailPage } from "@/components/order-management";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <OrderDetailPage id={id} scope="cashier" />; }
