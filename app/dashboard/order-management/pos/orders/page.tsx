"use client";

import { OrdersPage, SoldItemsReportPage } from "@/components/order-management";
import ShiftManagementPage from "@/components/shift-management/ShiftManagementPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  return (
    <Tabs defaultValue="orders" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:w-[560px]">
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="sold-items">Sold Items</TabsTrigger>
        <TabsTrigger value="shift">Shift Open / Close</TabsTrigger>
      </TabsList>
      <TabsContent value="orders" className="space-y-6">
        <OrdersPage scope="cashier" title="POS Orders" createHref="/dashboard/order-management/pos/orders/create" />
      </TabsContent>
      <TabsContent value="sold-items" className="space-y-6">
        <SoldItemsReportPage scope="cashier" />
      </TabsContent>
      <TabsContent value="shift" className="space-y-6">
        <ShiftManagementPage />
      </TabsContent>
    </Tabs>
  );
}
