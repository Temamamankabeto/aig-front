import { PackageOrderDetailPage } from '@/components/order-management';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <PackageOrderDetailPage id={id} />; }
