import { useCallback, useEffect, useState } from "react";
import { Download, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Report {
  id: string;
  project_name: string;
  compliance_score: number;
  status: "approved" | "pending";
  created_at: string;
}

const ReportsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canApprove = can(user?.role, "approveReport");
  const canExport = can(user?.role, "exportReport");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase.from("projects").select("id, project_name, compliance_score, created_at");
    if (user.role !== "super_admin" && user.companyId) q = q.eq("company_id", user.companyId);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    setReports((data ?? []).map((p) => ({
      id: p.id,
      project_name: p.project_name,
      compliance_score: Number(p.compliance_score ?? 0),
      status: (Number(p.compliance_score ?? 0) >= 90 ? "approved" : "pending") as "approved" | "pending",
      created_at: p.created_at ?? "",
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const approve = async (r: Report) => {
    setPendingId(r.id);
    // Bumps compliance to 90+ (approval threshold) and persists.
    const newScore = Math.max(r.compliance_score, 90);
    const { error } = await supabase.from("projects").update({ compliance_score: newScore }).eq("id", r.id);
    setPendingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Report for "${r.project_name}" approved.`);
    setReports((prev) => prev.map((x) => x.id === r.id ? { ...x, compliance_score: newScore, status: "approved" } : x));
  };

  const exportCsv = async (r: Report) => {
    // Pull related issues + contracts for a real CSV export.
    const [issues, contracts] = await Promise.all([
      supabase.from("issues").select("issue_title, priority, issue_status, created_at").eq("project_id", r.id),
      supabase.from("contracts").select("contract_name, contract_status, upload_date").eq("project_id", r.id),
    ]);
    const lines: string[] = [];
    lines.push(`Project,${r.project_name}`);
    lines.push(`Compliance score,${r.compliance_score}%`);
    lines.push(`Status,${r.status}`);
    lines.push("");
    lines.push("ISSUES");
    lines.push("Title,Priority,Status,Created");
    (issues.data ?? []).forEach((i) =>
      lines.push(`"${i.issue_title}",${i.priority ?? ""},${i.issue_status ?? ""},${i.created_at ?? ""}`));
    lines.push("");
    lines.push("CONTRACTS");
    lines.push("Name,Status,Uploaded");
    (contracts.data ?? []).forEach((c) =>
      lines.push(`"${c.contract_name}",${c.contract_status ?? ""},${c.upload_date ?? ""}`));

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.project_name.replace(/\s+/g, "_")}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported.");
  };

  return (
    <div>
      <PageHeader
        eyebrow={t("common.workspace")}
        title={t("reports.title")}
        description={t("reports.subtitle")}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-elevated transition-smooth">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold">{r.project_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.status === "approved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                {t(r.status === "approved" ? "reports.approved" : "reports.pendingApproval")}
              </span>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{t("workspace.complianceScore")}</p>
                <p className="text-3xl font-display font-bold mt-1">{r.compliance_score}%</p>
              </div>
              <div className="flex gap-2">
                {canApprove && r.status === "pending" && (
                  <Button size="sm" disabled={pendingId === r.id} className="rounded-full bg-gradient-accent text-accent-foreground border-0" onClick={() => approve(r)}>
                    <Check className="h-4 w-4 me-1.5" /> {t("reports.approveReport")}
                  </Button>
                )}
                {canExport && (
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => exportCsv(r)}>
                    <Download className="h-4 w-4 me-1.5" /> Export CSV
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && reports.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm text-muted-foreground">No reports yet — create a project to generate one.</div>
        )}
        {loading && (
          <div className="col-span-full text-center py-12 text-sm text-muted-foreground">Loading…</div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
