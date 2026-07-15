"use client";

import { useMemo, useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCustomerOrderTicketDocument } from "@/components/order-management/order-print-utils";
import type { Order } from "@/types/order-management";

type OrderTicketPreviewDialogProps = {
  open: boolean;
  order: Partial<Order> & Record<string, any>;
  onOpenChange: (open: boolean) => void;
};

export function OrderTicketPreviewDialog({
  open,
  order,
  onOpenChange,
}: OrderTicketPreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ticketDocument = useMemo(
    () => getCustomerOrderTicketDocument(order),
    [order],
  );

  function handlePrint() {
    const printWindow = iframeRef.current?.contentWindow;
    if (!printWindow) return;

    printWindow.focus();
    printWindow.print();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-[calc(100vw-1rem)] max-w-md flex-col overflow-hidden p-0 sm:w-full">
        <DialogHeader className="border-b px-4 py-3 sm:px-6">
          <DialogTitle>Order Ticket Preview</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-3 sm:p-5">
          <div className="mx-auto w-full max-w-[80mm] overflow-hidden rounded-lg border bg-white shadow-sm">
            <iframe
              ref={iframeRef}
              title="Order ticket preview"
              srcDoc={ticketDocument}
              className="block h-[68vh] min-h-[460px] w-full border-0 bg-white"
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t bg-background px-4 py-3 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
