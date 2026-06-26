"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { authService, type AuthUser } from "@/services/auth/auth.service";
import { getDashboardForRole } from "@/config/dashboard.config";
import SidebarContent from "@/layouts/components/SidebarContent";

type DashboardHeaderProps = {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

export default function DashboardHeader({ sidebarCollapsed = false, onToggleSidebar }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(authService.getStoredUser());
  }, [pathname]);

  const role = authService.getStoredRoles()[0] ?? user?.role ?? "Cafeteria Manager";
  const dashboard = getDashboardForRole(role);

  async function logout() {
    await authService.logout();
    toast.success("Logged out successfully");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden md:inline-flex"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>

        <div>
          <p className="text-xs text-muted-foreground">Current workspace</p>
          <h2 className="text-sm font-semibold md:text-base">{dashboard.roleName}</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium">{user?.name ?? user?.email ?? "User"}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
