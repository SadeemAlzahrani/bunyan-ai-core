import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  FolderKanban,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import StatCard from "@/components/app/StatCard";
import PageHeader from "@/components/app/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  activeProjects: number;
  openIssues: number;
  complianceScore: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  description: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

const WorkspaceDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({
    activeProjects: 0,
    openIssues: 0,
    complianceScore: 0,
    pendingApprovals: 0,
  });

  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const isSuper = user.role === "super_admin";

      let projectQuery = supabase
        .from("projects")
        .select("id, status, compliance_score");

      if (!isSuper && user.companyId) {
        projectQuery = projectQuery.eq("company_id", user.companyId);
      }

      const { data: projects } = await projectQuery;

      const projectIds = (projects ?? []).map((p) => p.id);

      const activeProjects = (projects ?? []).filter((p) =>
        ["active", "in_progress", "pending"].includes(
          p.status?.toLowerCase()
        )
      ).length;

      const avgCompliance =
        projects && projects.length
          ? Math.round(
              projects.reduce(
                (s, p) => s + Number(p.compliance_score ?? 0),
                0
              ) / projects.length
            )
          : 0;

      let openIssues = 0;

      if (projectIds.length) {
        const { count } = await supabase
          .from("issues")
          .select("*", { count: "exact", head: true })
          .in("project_id", projectIds)
          .neq("issue_status", "resolved");

        openIssues = count ?? 0;
      }

      let pendingApprovals = 0;

if (projectIds.length) {
  const { count, error } = await (supabase as any)
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .in("project_id", projectIds)
    .eq("ai_status", "submitted");

  if (error) {
    console.error("Pending approvals error:", error);
  }

  pendingApprovals = count ?? 0;
}

      setStats({
        activeProjects,
        openIssues,
        complianceScore: avgCompliance,
        pendingApprovals,
      });
    };

    void load();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadActivities = async () => {
      setLoadingActivities(true);

      try {
        let query = (supabase as any)
          .from("activity_logs")
          .select("id, action, entity_type, description, created_at, metadata")
          .order("created_at", { ascending: false })
          .limit(5);

        if (user.role !== "super_admin" && user.companyId) {
          query = query.eq("tenant_id", user.companyId);
        }

        const { data, error } = await query;

        if (error) throw error;

        setActivities(data ?? []);
      } catch (err) {
        console.error("Failed to load recent activity:", err);
      } finally {
        setLoadingActivities(false);
      }
    };

    void loadActivities();
  }, [user]);

  const formatActivityTime = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityLabel = (entityType: string, action: string) => {
    return `${entityType} • ${action}`;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("workspace.title")}
        title={user?.companyName ?? ""}
        description={t("workspace.subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("workspace.activeProjects")}
          value={String(stats.activeProjects)}
          icon={FolderKanban}
        />
        <StatCard
          label={t("workspace.openIssues")}
          value={String(stats.openIssues)}
          icon={AlertTriangle}
          trend="down"
        />
        <StatCard
          label={t("workspace.complianceScore")}
          value={`${stats.complianceScore}%`}
          icon={ShieldCheck}
        />
        <StatCard
          label={t("workspace.pendingApprovals")}
          value={String(stats.pendingApprovals)}
          icon={Clock}
          trend="neutral"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <h2 className="font-display font-semibold text-lg">
            {t("workspace.recentActivity")}
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {loadingActivities ? (
            <p className="text-sm text-muted-foreground">
              Loading recent activity...
            </p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {getActivityLabel(activity.entity_type, activity.action)}
                  </p>
                </div>

                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatActivityTime(activity.created_at)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;