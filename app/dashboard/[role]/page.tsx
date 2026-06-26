import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardConfig, type AppRoleKey } from "@/config/dashboard.config";

export default async function RoleDashboardPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const config = dashboardConfig[role as AppRoleKey];
  if (!config) notFound();
  const Icon = config.icon;

  return (
    <div className="dashboard-page">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Role dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{config.title}</h1>
          <p className="mt-1 text-muted-foreground">{config.subtitle}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-4 text-primary"><Icon className="h-8 w-8" /></div>
      </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Empty workspace</CardTitle>
          <CardDescription>This page is ready. Add the real {config.roleName.toLowerCase()} widgets, tables, charts, and actions here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-10 text-center text-muted-foreground">Empty {config.roleName} dashboard area</div>
        </CardContent>
      </Card>
    </div>
  );
}
