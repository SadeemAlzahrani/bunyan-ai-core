import { useCallback, useEffect, useState } from "react";
import { Upload, FileText, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UploadContractDialog from "@/components/workspace/UploadContractDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Contract {
  id: string;
  contract_title: string;
  uploaded_at: string | null;
  project_id: string;
  file_url: string | null;
  completeness_score: number | null;
  ai_analysis: any | null;
  projectName?: string;
}

const getValue = (...values: any[]) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      value !== "—" &&
      value !== "missing"
    ) {
      return value;
    }
  }

  return "—";
};

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (value) return [value];
  return [];
};

const getDurationFromSummary = (summary: any) => {
  const text = toArray(summary).join(" ");
  const match = text.match(/(\d+\s*(months?|years?|days?|weeks?))/i);
  return match?.[1] ?? "—";
};

const getContractValueFromSummary = (summary: any) => {
  const text = toArray(summary).join(" ");

  const match = text.match(
    /(?:SAR|SR|ريال)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s?(?:SAR|SR|ريال)/i
  );

  return match ? `${match[1]} SAR` : "—";
};

const normalizeClauses = (analysis: any) => {
  if (Array.isArray(analysis?.extracted_clauses) && analysis.extracted_clauses.length > 0) {
    return analysis.extracted_clauses;
  }

  if (Array.isArray(analysis?.detected_clauses) && analysis.detected_clauses.length > 0) {
    return analysis.detected_clauses;
  }

  if (Array.isArray(analysis?.contract_clauses) && analysis.contract_clauses.length > 0) {
    return analysis.contract_clauses;
  }

  if (Array.isArray(analysis?.clause_extraction) && analysis.clause_extraction.length > 0) {
    return analysis.clause_extraction;
  }

  if (analysis?.clauses && typeof analysis.clauses === "object" && !Array.isArray(analysis.clauses)) {
    return Object.entries(analysis.clauses)
      .filter(([, value]: any) => {
        const status = String(value?.status || "").toLowerCase();
        return status && status !== "missing";
      })
      .map(([key, value]: any) => ({
        clause_category: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        status: value?.status || "found",
        risk_level: value?.risk_level || "Unknown",
        extracted_text:
          value?.evidence?.[0] ||
          value?.description ||
          value?.text ||
          "Clause detected.",
        issue: value?.issue || "",
        recommendation: value?.recommendation || "",
      }));
  }

  const summary = toArray(analysis?.summary);
  const lowerSummary = summary.map((s) => String(s).toLowerCase());

  const generatedClauses: any[] = [];

  if (
    lowerSummary.some(
      (s) =>
        s.includes("construction") ||
        s.includes("structural") ||
        s.includes("excavation") ||
        s.includes("concrete") ||
        s.includes("masonry")
    )
  ) {
    generatedClauses.push({
      clause_category: "Scope Of Work",
      extracted_text: "The contract defines construction and structural work responsibilities.",
      status: "found",
      risk_level: "Low",
    });
  }

  if (lowerSummary.some((s) => s.includes("duration") || s.includes("months"))) {
    generatedClauses.push({
      clause_category: "Project Duration",
      extracted_text: "The contract specifies the project duration.",
      status: "found",
      risk_level: "Low",
    });
  }

  if (
    lowerSummary.some(
      (s) => s.includes("penalty") || s.includes("penalties") || s.includes("delay")
    )
  ) {
    generatedClauses.push({
      clause_category: "Delay Penalties",
      extracted_text: "The contract includes penalties for project delays.",
      status: "found",
      risk_level: "Medium",
    });
  }

  if (
    lowerSummary.some(
      (s) => s.includes("contractor") || s.includes("responsible") || s.includes("responsibility")
    )
  ) {
    generatedClauses.push({
      clause_category: "Contractor Responsibility",
      extracted_text: "The contract identifies responsibilities assigned to the contractor.",
      status: "found",
      risk_level: "Low",
    });
  }

  return generatedClauses;
};

const ContractsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canUpload = can(user?.role, "uploadContract");

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    let projQ = supabase.from("projects").select("id, project_name");

    if (user.role !== "super_admin" && user.companyId) {
      projQ = projQ.eq("company_id", user.companyId);
    }

    const { data: projects } = await projQ;

    const projectIds = (projects ?? []).map((p) => p.id);
    const projectMap = new Map((projects ?? []).map((p) => [p.id, p.project_name]));

    if (!projectIds.length) {
      setContracts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("contracts")
      .select("id, contract_title, uploaded_at, project_id, file_url, completeness_score, ai_analysis")
      .in("project_id", projectIds)
      .order("uploaded_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setContracts(
      (data ?? []).map((c) => ({
        ...c,
        projectName: projectMap.get(c.project_id) ?? "—",
      }))
    );

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleViewFile = async (c: Contract) => {
    if (!c.file_url) {
      toast.info("No file attached to this contract.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("contracts")
      .createSignedUrl(c.file_url, 60);

    if (error || !data) {
      toast.error("Could not generate download link.");
      return;
    }

    window.open(data.signedUrl, "_blank");
  };

  const handleViewAnalysis = (c: Contract) => {
    if (!c.ai_analysis) {
      toast.info("No AI analysis saved for this contract yet.");
      return;
    }

    setSelectedAnalysis({
      ...c.ai_analysis,
      contract_title: c.contract_title,
      project_name: c.projectName,
      uploaded_at: c.uploaded_at,
      completeness_score:
        c.completeness_score ??
        c.ai_analysis.completeness_score ??
        c.ai_analysis.contract_quality_score ??
        c.ai_analysis.score ??
        "—",
    });
  };

  const summaryItems = toArray(selectedAnalysis?.summary);
  const clauses = normalizeClauses(selectedAnalysis);

  const recommendations = Array.isArray(selectedAnalysis?.recommendations)
    ? selectedAnalysis.recommendations
    : Array.isArray(selectedAnalysis?.ai_recommendations?.improvement_recommendations)
      ? selectedAnalysis.ai_recommendations.improvement_recommendations
      : Array.isArray(selectedAnalysis?.risks)
        ? selectedAnalysis.risks
        : [];

  const parties = Array.isArray(selectedAnalysis?.parties)
    ? selectedAnalysis.parties
    : Array.isArray(selectedAnalysis?.contract_overview?.parties)
      ? selectedAnalysis.contract_overview.parties
      : [];

  const riskLevel = selectedAnalysis?.overall_risk || selectedAnalysis?.risk || "Low";

  const contractType = getValue(
    selectedAnalysis?.contract_type,
    selectedAnalysis?.contract_overview?.contract_type,
    "Construction Contract"
  );

  const contractValue = getValue(
    selectedAnalysis?.contract_value,
    selectedAnalysis?.value,
    selectedAnalysis?.amount,
    selectedAnalysis?.total_value,
    selectedAnalysis?.price,
    selectedAnalysis?.contract_overview?.contract_value,
    getContractValueFromSummary(selectedAnalysis?.summary)
  );

  const duration = getValue(
    selectedAnalysis?.duration,
    selectedAnalysis?.project_duration,
    selectedAnalysis?.contract_duration,
    selectedAnalysis?.period,
    selectedAnalysis?.contract_overview?.contract_duration,
    getDurationFromSummary(selectedAnalysis?.summary)
  );

  return (
    <div>
      <PageHeader
        eyebrow={t("common.workspace")}
        title={t("contracts.title")}
        description={t("contracts.subtitle")}
        actions={
          canUpload && (
            <Button
              onClick={() => setUploadOpen(true)}
              className="rounded-full bg-gradient-accent text-accent-foreground border-0 shadow-card"
            >
              <Upload className="h-4 w-4 me-1.5" />
              {t("contracts.uploadContract")}
            </Button>
          )
        }
      />

      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <ul className="divide-y divide-border">
          {contracts.map((c) => (
            <li
              key={c.id}
              className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-smooth"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="font-medium truncate">{c.contract_title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.projectName} ·{" "}
                    {c.uploaded_at
                      ? new Date(c.uploaded_at).toLocaleDateString()
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Completeness score: {c.completeness_score ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    c.ai_analysis
                      ? "bg-success/15 text-success"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {c.ai_analysis ? "Analyzed" : "Uploaded"}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleViewAnalysis(c)}
                >
                  <Sparkles className="h-4 w-4 me-1" />
                  Analysis
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleViewFile(c)}
                >
                  {t("common.view")}
                </Button>
              </div>
            </li>
          ))}

          {!loading && contracts.length === 0 && (
            <li className="px-6 py-12 text-center text-sm text-muted-foreground">
              No contracts uploaded yet.
            </li>
          )}

          {loading && (
            <li className="px-6 py-12 text-center text-sm text-muted-foreground">
              Loading…
            </li>
          )}
        </ul>
      </div>

      <UploadContractDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={load}
      />

      <Dialog
        open={!!selectedAnalysis}
        onOpenChange={() => setSelectedAnalysis(null)}
      >
        <DialogContent className="max-w-4xl rounded-3xl p-0 overflow-hidden">
          {selectedAnalysis && (
            <div className="max-h-[85vh] overflow-y-auto">
              <div className="p-8 border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-accent" />
                    Contract AI Analysis
                  </DialogTitle>
                </DialogHeader>

                <p className="text-muted-foreground mt-2">
                  {selectedAnalysis.contract_title}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-background border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground">
                      Completeness Score
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {selectedAnalysis.completeness_score}
                    </p>
                  </div>

                  <div className="bg-background border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground">
                      Risk Level
                    </p>
                    <p className="text-xl font-semibold mt-1 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      {riskLevel}
                    </p>
                  </div>

                  <div className="bg-background border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-muted-foreground">
                      Project
                    </p>
                    <p className="text-base font-semibold mt-1">
                      {selectedAnalysis.project_name || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <section>
                  <h3 className="text-lg font-semibold mb-4">
                    Contract Overview
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-2xl p-4 bg-secondary/20">
                      <p className="text-xs text-muted-foreground">
                        Contract Type
                      </p>
                      <p className="font-medium mt-1">{contractType}</p>
                    </div>

                    <div className="border rounded-2xl p-4 bg-secondary/20">
                      <p className="text-xs text-muted-foreground">
                        Contract Value
                      </p>
                      <p className="font-medium mt-1">{contractValue}</p>
                    </div>

                    <div className="border rounded-2xl p-4 bg-secondary/20">
                      <p className="text-xs text-muted-foreground">
                        Duration
                      </p>
                      <p className="font-medium mt-1">{duration}</p>
                    </div>

                    <div className="border rounded-2xl p-4 bg-secondary/20">
                      <p className="text-xs text-muted-foreground">
                        Uploaded Date
                      </p>
                      <p className="font-medium mt-1">
                        {selectedAnalysis.uploaded_at
                          ? new Date(selectedAnalysis.uploaded_at).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-4">
                    Parties
                  </h3>

                  {parties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {parties.map((party: any, idx: number) => {
                        if (typeof party === "string") {
                          const [role, ...nameParts] = party.split(":");
                          return (
                            <div key={idx} className="border rounded-2xl p-4">
                              <p className="font-medium">{role || `Party ${idx + 1}`}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {nameParts.join(":").trim() || party}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="border rounded-2xl p-4">
                            <p className="font-medium">
                              {party.role || `Party ${idx + 1}`}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {party.name || "—"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border rounded-2xl p-4 text-sm text-muted-foreground">
                      No parties extracted.
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-4">
                    Contract Summary
                  </h3>

                  {summaryItems.length > 0 ? (
                    <div className="space-y-3">
                      {summaryItems.map((item: string, idx: number) => (
                        <div
                          key={idx}
                          className="border rounded-2xl p-4 bg-secondary/30 leading-relaxed"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-2xl p-4 text-sm text-muted-foreground">
                      No summary available.
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-4">
                    Extracted Clauses
                  </h3>

                  {clauses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {clauses.map((clause: any, idx: number) => (
                        <div
                          key={idx}
                          className="border rounded-2xl p-4 bg-background"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium">
                                {clause.clause_category ||
                                  clause.title ||
                                  clause.name ||
                                  `Clause ${idx + 1}`}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                {clause.extracted_text ||
                                  clause.description ||
                                  clause.text ||
                                  "Clause detected."}
                              </p>

                              {(clause.status || clause.risk_level) && (
                                <p className="text-xs text-muted-foreground mt-3">
                                  Status: {clause.status || "—"} · Risk:{" "}
                                  {clause.risk_level || "—"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-2xl p-4 text-sm text-muted-foreground">
                      No extracted clauses available.
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-4">
                    AI Recommendations
                  </h3>

                  {recommendations.length > 0 ? (
                    <div className="space-y-3">
                      {recommendations.map((rec: any, idx: number) => (
                        <div
                          key={idx}
                          className="border border-amber-200 bg-amber-50 rounded-2xl p-4 text-amber-950"
                        >
                          {typeof rec === "string"
                            ? rec
                            : rec.description ||
                              rec.text ||
                              rec.title ||
                              rec.recommendation ||
                              rec.reason ||
                              "Review recommended."}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-2xl p-4 text-sm text-muted-foreground">
                      No recommendations available.
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsPage;

