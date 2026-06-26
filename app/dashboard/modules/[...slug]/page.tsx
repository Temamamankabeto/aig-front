import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function titleFromSlug(slug: string[]) {
  return slug.map((part) => part.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())).join(" / ");
}

export default async function EmptyModulePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const title = titleFromSlug(slug ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">Empty module page. Add real logic here later.</p>
      </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>This placeholder keeps the sidebar working while you build the module.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-10 text-center text-muted-foreground">
            Empty {title} page
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
