import { useEffect, useMemo, useState } from "react";
import { Building2, Search, Eye, Plus, Filter } from "lucide-react";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  industry: string | null;
  headquarters_city: string | null;
  users: number;
  projects: number;
  created_at: string | null;
}

const TenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: comps } = await supabase.from("companies")
        .select("id, name, industry, headquarters_city, created_at");
      const list = comps ?? [];
      const enriched = await Promise.all(list.map(async (c) => {
        const [{ count: uc }, { count: pc }] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }).eq("company_id", c.id),
          supabase.from("projects").select("*", { count: "exact", head: true }).eq("company_id", c.id),
        ]);
        return { ...c, users: uc ?? 0, projects: pc ?? 0 };
      }));
      setTenants(enriched);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    return tenants.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  }, [tenants, query]);

  return (
    <>
      <PageHeader
        eyebrow="Tenant Management"
        title="Companies"
        description="All client companies provisioned on the Bunyan platform."
        actions={
          <Button onClick={() => toast.info("Provisioning flow coming soon")} className="rounded-full bg-gradient-accent text-accent-foreground border-0 shadow-card">
            <Plus className="h-4 w-4 mr-1.5" /> Provision tenant
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company name…"
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Company</th>
                <th className="text-left px-6 py-3 font-medium">Industry</th>
                <th className="text-right px-6 py-3 font-medium">Users</th>
                <th className="text-right px-6 py-3 font-medium">Projects</th>
                <th className="text-left px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-secondary/30 transition-smooth">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.headquarters_city ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{t.industry ?? "—"}</td>
                  <td className="px-6 py-4 text-right tabular-nums">{t.users}</td>
                  <td className="px-6 py-4 text-right tabular-nums">{t.projects}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toast.info(`Viewing ${t.name}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground text-sm">
                    <Filter className="h-5 w-5 mx-auto mb-2 opacity-40" />
                    No tenants match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground flex justify-between">
          <span>Showing {filtered.length} of {tenants.length} tenants</span>
          <span>Each tenant runs in an isolated workspace</span>
        </div>
      </div>
    </>
  );
};

export default TenantsPage;
