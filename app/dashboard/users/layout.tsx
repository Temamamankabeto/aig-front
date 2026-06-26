import UserManagementTabs from "@/components/user-management/user-management-tabs";
import UserManagementRouteGuard from "@/components/user-management/user-management-route-guard";

export default function UserManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserManagementRouteGuard>
      <div className="space-y-6">
        <UserManagementTabs />
        {children}
      </div>
    </UserManagementRouteGuard>
  );
}
