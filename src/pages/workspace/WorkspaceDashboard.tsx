import { useEffect, useState } from "react";
import { Activity, AlertTriangle, FolderKanban, ShieldCheck, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import StatCard from "@/components/app/StatCard";
import PageHeader from "@/components/app/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Stats { activeProjects: number; openIssues: number; complianceScore: number; pendingApprovals: number }

const WorkspaceDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ activeProjects: 0, openIssues: 0, complianceScore: 0, pendingApprovals: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const isSuper = user.role === "super_admin";

      // Projects scoped to company (or all for super admin)
      let projectQuery = supabase.from("projects").select("id, status, compliance_score");
      if (!isSuper && user.companyId) projectQuery = projectQuery.eq("company_id", user.companyId);
      const { data: projects } = await projectQuery;

      const projectIds = (projects ?? []).map((p) => p.id);
      const activeProjects = (projects ?? []).filter((p) => p.status === "active").length;
      const avgCompliance = projects && projects.length
        ? Math.round(projects.reduce((s, p) => s + Number(p.compliance_score ?? 0), 0) / projects.length)
        : 0;

      let openIssues = 0;
      if (projectIds.length) {
        const { count } = await supabase.from("issues").select("*", { count: "exact", head: true })
          .in("project_id", projectIds).neq("issue_status", "resolved");
        openIssues = count ?? 0;
      }

      let pendingApprovals = 0;
      if (projectIds.length) {
        const { count } = await supabase.from("feedback").select("*", { count: "exact", head: true })
          .in("project_id", projectIds).eq("status", "submitted");
        pendingApprovals = count ?? 0;
      }

      setStats({ activeProjects, openIssues, complianceScore: avgCompliance, pendingApprovals });
    };
    void load();
  }, [user]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("workspace.title")}
        title={user?.companyName ?? ""}
        description={t("workspace.subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("workspace.activeProjects")} value={String(stats.activeProjects)} icon={FolderKanban} />
        <StatCard label={t("workspace.openIssues")} value={String(stats.openIssues)} icon={AlertTriangle} trend="down" />
        <StatCard label={t("workspace.complianceScore")} value={`${stats.complianceScore}%`} icon={ShieldCheck} />
        <StatCard label={t("workspace.pendingApprovals")} value={String(stats.pendingApprovals)} icon={Clock} trend="neutral" />
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <h2 className="font-display font-semibold text-lg">{t("workspace.recentActivity")}</h2>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("workspace.subtitle")}
        </p>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;
