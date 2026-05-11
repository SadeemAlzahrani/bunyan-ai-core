import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}

interface ProjectOpt {
  id: string;
  project_name: string;
}

const AI_API_URL = "http://127.0.0.1:5000/api/analyze-contract";
const MAX_FILE_SIZE_MB = 10;

const UploadContractDialog = ({ open, onOpenChange, onUploaded }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [contractName, setContractName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "analyzing" | "saving">(
    "idle"
  );

  useEffect(() => {
    if (!open || !user) return;

    const loadProjects = async () => {
      let q = supabase
        .from("projects")
        .select("id, project_name")
        .order("project_name", { ascending: true });

      if (user.role !== "super_admin" && user.companyId) {
        q = q.eq("company_id", user.companyId);
      }

      const { data, error } = await q;

      if (error) {
        toast.error(error.message);
        return;
      }

      setProjects(data ?? []);

      if (data && data.length > 0) {
        setProjectId((current) => current || data[0].id);
      }
    };

    void loadProjects();
  }, [open, user]);

  const reset = () => {
    setContractName("");
    setProjectId("");
    setFile(null);
    setStage("idle");
  };

  const handleClose = (nextOpen: boolean) => {
    if (submitting) return;

    if (!nextOpen) {
      reset();
    }

    onOpenChange(nextOpen);
  };

  const validateFile = (selectedFile: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const allowedExtensions = [".pdf", ".docx"];
    const fileName = selectedFile.name.toLowerCase();

    const hasValidExtension = allowedExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!allowedTypes.includes(selectedFile.type) && !hasValidExtension) {
      toast.error("Only PDF and DOCX contract files are allowed.");
      return false;
    }

    const fileSizeMb = selectedFile.size / 1024 / 1024;

    if (fileSizeMb > MAX_FILE_SIZE_MB) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE_MB} MB.`);
      return false;
    }

    return true;
  };

  const handleFileChange = (selectedFile?: File) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!validateFile(selectedFile)) {
      setFile(null);
      return;
    }

    setFile(selectedFile);

    if (!contractName.trim()) {
      const cleanName = selectedFile.name.replace(/\.(pdf|docx)$/i, "");
      setContractName(cleanName);
    }
  };

  const analyzeContract = async (contractId: string, selectedFile: File) => {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("contract_id", contractId);

    const response = await fetch(AI_API_URL, {
      method: "POST",
      body: formData,
    });

    let result: any = null;

    try {
      result = await response.json();
    } catch {
      throw new Error("AI server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(result?.error || "AI analysis failed.");
    }

    const analysis = result.analysis ?? result;

    const completenessScore =
      analysis?.completeness_score ??
      analysis?.contract_quality_score ??
      analysis?.score ??
      null;

    const normalizedAnalysis = {
      contract_type: analysis?.contract_type ?? "Construction Contract",
      parties: analysis?.parties ?? [],
      duration: analysis?.duration ?? null,
      contract_value: analysis?.contract_value ?? null,
      completeness_score: completenessScore,
      overall_risk: analysis?.overall_risk ?? analysis?.risk ?? "Low",
      summary: Array.isArray(analysis?.summary)
        ? analysis.summary
        : analysis?.summary
          ? [analysis.summary]
          : [],
      clauses: Array.isArray(analysis?.clauses) ? analysis.clauses : [],
      missing_clauses: Array.isArray(analysis?.missing_clauses)
        ? analysis.missing_clauses
        : [],
      ambiguous_clauses: Array.isArray(analysis?.ambiguous_clauses)
        ? analysis.ambiguous_clauses
        : [],
      recommendations: Array.isArray(analysis?.recommendations)
        ? analysis.recommendations
        : [],
      raw: analysis,
    };

    const { error } = await supabase
      .from("contracts")
      .update({
        ai_analysis: normalizedAnalysis,
        completeness_score: completenessScore,
      } as never)
      .eq("id", contractId);

    if (error) throw error;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractName.trim()) {
      toast.error("Contract name is required.");
      return;
    }

    if (!projectId) {
      toast.error("Please select a project.");
      return;
    }

    if (!file) {
      toast.error("Please attach a PDF or DOCX contract file.");
      return;
    }

    setSubmitting(true);

    try {
      setStage("uploading");

      const getFileExtension = (fileName: string) => {
        const ext = fileName.split(".").pop()?.toLowerCase();
        return ext === "docx" ? "docx" : "pdf";
      };
      
      const fileExt = getFileExtension(file.name);
      
      const path = `${projectId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: insertedContract, error: insertError } = await supabase
        .from("contracts")
        .insert({
          contract_title: contractName.trim(),
          project_id: projectId,
          file_url: path,
          uploaded_at: new Date().toISOString(),
          completeness_score: null,
          ai_analysis: null,
        } as never)
        .select("id")
        .single();

      if (insertError) throw insertError;

      setStage("analyzing");
      toast.info("Contract uploaded. AI analysis is running.");

      await analyzeContract(insertedContract.id, file);

      setStage("saving");
      toast.success(`Contract "${contractName.trim()}" uploaded and analyzed.`);

      reset();
      onOpenChange(false);
      onUploaded();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Contract upload failed.";

      toast.error(message);
      onUploaded();
    } finally {
      setSubmitting(false);
      setStage("idle");
    }
  };

  const submitLabel = {
    idle: t("contracts.uploadContract"),
    uploading: "Uploading contract...",
    analyzing: "Analyzing with AI...",
    saving: "Saving results...",
  }[stage];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
              <UploadCloud className="h-5 w-5" />
            </div>

            <div>
              <DialogTitle>{t("contracts.uploadContract")}</DialogTitle>
              <DialogDescription>
                Upload a PDF or DOCX contract and run AI completeness analysis.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="cname">Contract name</Label>
            <Input
              id="cname"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="Example: Villa Construction Agreement"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select
              value={projectId}
              onValueChange={setProjectId}
              disabled={submitting || !projects.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>

              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!projects.length && (
              <p className="text-xs text-muted-foreground">
                No projects available for this workspace.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file">Contract file</Label>

            <Input
              id="file"
              type="file"
              accept=".pdf,.docx"
              disabled={submitting}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              required
            />

            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOCX. Maximum size: {MAX_FILE_SIZE_MB} MB.
            </p>

            {file && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border bg-secondary/30 p-3">
                <div className="h-10 w-10 rounded-xl bg-background text-accent flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            )}
          </div>

          {submitting && (
            <div className="rounded-2xl border bg-accent/5 p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-accent mt-0.5 animate-pulse" />
              <div>
                <p className="text-sm font-medium">{submitLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please keep this dialog open until the AI analysis is completed.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>

            <Button
              type="submit"
              disabled={submitting || !projects.length}
              className="bg-gradient-accent text-accent-foreground border-0"
            >
              {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadContractDialog;

