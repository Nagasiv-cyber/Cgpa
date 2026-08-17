import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import { AppShell, PageHeading } from "@/components/portal/AppShell";
import { Panel, PanelTitle } from "@/components/portal/ui";
import { useAuditLogs } from "@/hooks/useApi";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs | AIML SGPA Portal" },
      { name: "description", content: "View system audit logs for security monitoring." },
    ],
  }),
  component: AuditLogs,
});

function AuditLogs() {
  const { data: logs, isLoading, error } = useAuditLogs(100);

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-cyan hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <PageHeading title="System Audit Logs" subtitle="Monitor recent login activity" />

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-danger">
          <ShieldAlert className="mb-4 h-12 w-12 opacity-80" />
          <h3 className="text-xl font-bold">Access Denied</h3>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to view audit logs or an error occurred.
          </p>
        </div>
      ) : (
        <Panel className="mt-6">
          <PanelTitle>Recent Logins</PanelTitle>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Timestamp</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">IP Address</th>
                  <th className="pb-3 font-medium">Device / User-Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {logs?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  logs?.map((log: any) => (
                    <tr key={log.id} className="transition-colors hover:bg-secondary/20">
                      <td className="whitespace-nowrap py-3 pr-4 font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">{log.email}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center rounded-full border border-border/50 bg-secondary/50 px-2 py-0.5 text-xs">
                          {log.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 font-mono text-xs">
                        {log.ip_address || "Unknown"}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground max-w-xs truncate" title={log.user_agent}>
                        {log.user_agent || "Unknown"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </AppShell>
  );
}
