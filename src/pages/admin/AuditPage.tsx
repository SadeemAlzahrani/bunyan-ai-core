import { useMemo, useState } from "react";
import { LogIn, UserCog, ShieldAlert, Building2, Pause, Play, Settings2, Search, Download } from "lucide-react";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auditEvents, type AuditEvent } from "@/lib/admin-data";
import { toast } from "sonner";

const iconFor = (t: AuditEvent["type"]) => {
  switch (t) {
    case "login": return LogIn;
    case "account_change": return Settings2;
    case "role_change": return UserCog;
    case "tenant_created": return Building2;
    case "tenant_suspended": return Pause;
    case "tenant_activated": return Play;
    case "security": return ShieldAlert;
  }
};

const severityStyle = (s: AuditEvent["severity"]) =>
  s === "critical" ? "bg-destructive/10 text-destructive" :
  s === "warning" ? "bg-warning/10 text-warning" :
  "bg-accent-soft text-accent";

const filters = [
  { key: "all", label: "All events" },
  { key: "login", label: "Logins" },
  { key: "role_change", label: "Roles" },
  { key: "tenant_created", label: "Tenants" },
  { key: "security", label: "Security" },
] as const;

const AuditPage = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");

  const filtered = useMemo(
    () =>
      auditEvents.filter((e) => {
        const q = query.toLowerCase();
        const matchesQ = !q || e.message.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q) || (e.target?.toLowerCase().includes(q) ?? false);
        const matchesF = filter === "all" || e.type === filter || (filter === "tenant_created" && e.type.startsWith("tenant_"));
        return matchesQ && matchesF;
      }),
    [query, filter]
  );

  return (
    <>
      <PageHeader
        eyebrow="Audit Logs"
        title="Security & activity log"
        description="Immutable record of platform events. Retained for 7 years."
        actions={
          <Button onClick={() => toast.success("Export started")} variant="outline" className="rounded-full">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, actors, targets…"
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-smooth ${
                filter === f.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-card divide-y divide-border">
        {filtered.map((e) => {
          const Icon = iconFor(e.type);
          return (
            <div key={e.id} className="px-6 py-4 flex items-start gap-4 hover:bg-secondary/30 transition-smooth">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${severityStyle(e.severity)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{e.message}</p>
                  <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${severityStyle(e.severity)}`}>
                    {e.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground/80">{e.actor}</span>
                  {e.target && <> → <span className="font-medium text-foreground/80">{e.target}</span></>}
                  {e.ip && <> · IP {e.ip}</>}
                  <> · <span className="font-mono">{e.id}</span></>
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{e.ts}</span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center text-muted-foreground text-sm">No events match your filters.</div>
        )}
      </div>
    </>
  );
};

export default AuditPage;
