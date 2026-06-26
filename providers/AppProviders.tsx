"use client";

import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { ReduxProvider } from "@/providers/ReduxProvider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider>
      <ReactQueryProvider>
        {children}
        <Toaster richColors position="top-right" />
      </ReactQueryProvider>
    </ReduxProvider>
  );
}

export default AppProviders;
