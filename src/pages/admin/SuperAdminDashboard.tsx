import { useEffect, useState } from "react";
import { Building2, Users, FolderKanban, Sparkles, ShieldAlert, CheckCircle2, Activity } from "lucide-react";
import StatCard from "@/components/app/StatCard";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CompanyRow { id: string; name: string; users: number; projects: number }

const fmt = (n: number) => n.toLocaleString();

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [totals, setTotals] = useState({ companies: 0, users: 0, projects: 0, openIssues: 0 });

  useEffect(() => {
    const load = async () => {
      const { data: comps } = await supabase.from("companies").select("id, name");
      const list = comps ?? [];
      const enriched: CompanyRow[] = await Promise.all(list.map(async (c) => {
        const [{ count: uc }, { count: pc }] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }).eq("company_id", c.id),
          supabase.from("projects").select("*", { count: "exact", head: true }).eq("company_id", c.id),
        ]);
        return { id: c.id, name: c.name, users: uc ?? 0, projects: pc ?? 0 };
      }));

      const [{ count: totalUsers }, { count: totalProjects }, { count: openIssues }] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("issues").select("*", { count: "exact", head: true }).neq("issue_status", "resolved"),
      ]);

      setCompanies(enriched);
      setTotals({
        companies: enriched.length,
        users: totalUsers ?? 0,
        projects: totalProjects ?? 0,
        openIssues: openIssues ?? 0,
      });
    };
    void load();
  }, []);

  const top = [...companies].sort((a, b) => b.projects - a.projects).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Platform Overview"
        title="Platform Dashboard"
        description="System-wide statistics across all tenant companies."
        actions={
          <Button asChild className="rounded-full bg-gradient-accent text-accent-foreground border-0 shadow-card">
            <Link to="/admin/tenants">+ Provision tenant</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total companies" value={fmt(totals.companies)} icon={Building2} />
        <StatCard label="Total users" value={fmt(totals.users)} icon={Users} />
        <StatCard label="Total projects" value={fmt(totals.projects)} icon={FolderKanban} trend="neutral" />
        <StatCard label="Open issues" value={fmt(totals.openIssues)} icon={ShieldAlert} trend="down" />
      </div>

      <div className="mt-8 bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg">Top tenants by projects</h2>
            <p className="text-sm text-muted-foreground">Live</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/admin/tenants">All tenants</Link>
          </Button>
        </div>
        <div className="divide-y divide-border">
          {top.map((c) => (
            <div key={c.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-smooth">
              <div className="h-10 w-10 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.users} users · {c.projects} projects</p>
              </div>
            </div>
          ))}
          {top.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">No tenants yet.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default SuperAdminDashboard;
