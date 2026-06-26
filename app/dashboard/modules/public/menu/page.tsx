import { MenuManagementPage } from "@/components/menu-management";

export default function DashboardPublicMenuPage() {
  return <MenuManagementPage readOnly scope="public" />;
}
