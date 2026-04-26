import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}

interface ProjectOpt { id: string; project_name: string }

const UploadContractDialog = ({ open, onOpenChange, onUploaded }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [contractName, setContractName] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const load = async () => {
      let q = supabase.from("projects").select("id, project_name");
      if (user.role !== "super_admin" && user.companyId) q = q.eq("company_id", user.companyId);
      const { data } = await q;
      setProjects(data ?? []);
      if (data && data.length && !projectId) setProjectId(data[0].id);
    };
    void load();
  }, [open, user, projectId]);

  const reset = () => { setContractName(""); setFile(null); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractName || !projectId) { toast.error("Name and project are required."); return; }
    setSubmitting(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (file) {
        const path = `${projectId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("contracts").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        fileUrl = path;
        fileName = file.name;
      }

      const { error } = await supabase.from("contracts").insert({
        contract_name: contractName,
        project_id: projectId,
        contract_status: "uploaded",
        file_url: fileUrl,
        file_name: fileName,
        uploaded_by: user?.id ?? null,
        upload_date: new Date().toISOString(),
        version_number: 1,
      });
      if (error) throw error;

      toast.success(`Contract "${contractName}" uploaded.`);
      reset();
      onOpenChange(false);
      onUploaded();
    } catch (err) {
      toast.error((err as Error).message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("contracts.uploadContract")}</DialogTitle>
          <DialogDescription>Attach a contract document to a project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cname">Contract name</Label>
            <Input id="cname" value={contractName} onChange={(e) => setContractName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file">File (PDF, DOCX — optional)</Label>
            <Input id="file" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-muted-foreground">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={submitting || !projects.length} className="bg-gradient-accent text-accent-foreground border-0">
              {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t("contracts.uploadContract")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadContractDialog;
