"use client";

import SidebarContent from "@/layouts/components/SidebarContent";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed?: boolean;
};

export default function Sidebar({ collapsed = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-all duration-300 md:block",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}
