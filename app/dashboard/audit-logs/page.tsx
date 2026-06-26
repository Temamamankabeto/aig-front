"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuditLogsQuery } from "@/hooks/audit-log-management/use-audit-logs";

export default function AuditLogsPage() {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");

  const query = useAuditLogsQuery({ actor, action, module });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track system activity and security events.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Actor ID" value={actor} onChange={(e) => setActor(e.target.value)} />
          <Input placeholder="Action" value={action} onChange={(e) => setAction(e.target.value)} />
          <Input placeholder="Module" value={module} onChange={(e) => setModule(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Actor</th>
                <th className="text-left">Module</th>
                <th className="text-left">Action</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => (
                <tr key={log.id}>
                  <td>{log.actor_id}</td>
                  <td>{log.module ?? log.entity_type}</td>
                  <td>{log.action}</td>
                  <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
