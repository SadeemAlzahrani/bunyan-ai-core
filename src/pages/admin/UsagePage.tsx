import { Sparkles, Activity, TrendingUp, Building2 } from "lucide-react";
import StatCard from "@/components/app/StatCard";
import PageHeader from "@/components/app/PageHeader";
import { monthlyAiUsage, tenants } from "@/lib/admin-data";

const fmt = (n: number) => n.toLocaleString();

const UsagePage = () => {
  const total = tenants.reduce((s, t) => s + t.monthlyAi, 0);
  const max = Math.max(...monthlyAiUsage.map((m) => m.value));
  const sortedTenants = [...tenants].sort((a, b) => b.monthlyAi - a.monthlyAi);
  const tenantMax = Math.max(...sortedTenants.map((t) => t.monthlyAi));

  return (
    <>
      <PageHeader
        eyebrow="Usage Monitoring"
        title="Platform usage"
        description="AI processing, system activity, and per-tenant consumption."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="AI analyses (mo)" value={fmt(total)} delta="+12% vs last month" icon={Sparkles} />
        <StatCard label="API calls (24h)" value="284k" delta="Within capacity" icon={Activity} trend="neutral" />
        <StatCard label="Avg per tenant" value={fmt(Math.round(total / tenants.length))} delta="Across all plans" icon={Building2} trend="neutral" />
        <StatCard label="Growth" value="12%" delta="Month over month" icon={TrendingUp} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="font-display font-semibold text-lg">AI processing trend</h2>
          <p className="text-sm text-muted-foreground">Monthly analyses (thousands), last 12 months</p>
          <div className="mt-6 h-64 flex items-end gap-2">
            {monthlyAiUsage.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground tabular-nums">{m.value}k</span>
                <div
                  className="w-full bg-gradient-to-t from-accent to-accent/40 rounded-md hover:opacity-80 transition-smooth"
                  style={{ height: `${(m.value / max) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-[10px] text-muted-foreground font-medium">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="font-display font-semibold text-lg">System health</h2>
          <p className="text-sm text-muted-foreground">Last 24 hours</p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Uptime</dt><dd className="font-semibold text-success">99.98%</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Avg latency</dt><dd className="font-semibold">142 ms</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Error rate</dt><dd className="font-semibold">0.04%</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Active sessions</dt><dd className="font-semibold">1,284</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Queue depth</dt><dd className="font-semibold">12</dd></div>
          </dl>
        </div>
      </div>

      {/* Per-tenant usage */}
      <div className="mt-8 bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-display font-semibold text-lg">Per-tenant AI usage</h2>
          <p className="text-sm text-muted-foreground">Ranked by monthly analyses</p>
        </div>
        <div className="divide-y divide-border">
          {sortedTenants.map((t) => (
            <div key={t.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-secondary/30 transition-smooth">
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.plan}</p>
                </div>
              </div>
              <div className="col-span-6">
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-accent" style={{ width: `${(t.monthlyAi / tenantMax) * 100}%` }} />
                </div>
              </div>
              <div className="col-span-2 text-right">
                <p className="font-display font-semibold tabular-nums">{fmt(t.monthlyAi)}</p>
                <p className="text-xs text-muted-foreground">analyses</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default UsagePage;
