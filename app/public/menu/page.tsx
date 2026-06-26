import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MenuManagementPage } from "@/components/menu-management";

export default function PublicMenuPage() {
  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline"><Link href="/login">Login</Link></Button>
        </div>
        <MenuManagementPage readOnly scope="public" />
      </div>
    </main>
  );
}
