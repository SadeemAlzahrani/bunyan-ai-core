import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CreateIssueDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<{ id: string; project_name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    issue_title: "",
    issue_description: "",
    project_id: "",
    priority: "major",
    category: "",
  });

  useEffect(() => {
    if (!open || !user) return;
    const load = async () => {
      let q = supabase.from("projects").select("id, project_name");
      if (user.role !== "super_admin" && user.companyId) q = q.eq("company_id", user.companyId);
      const { data } = await q;
      setProjects(data ?? []);
      if (data && data.length && !form.project_id) setForm((f) => ({ ...f, project_id: data[0].id }));
    };
    void load();
  }, [open, user, form.project_id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.issue_title || !form.project_id) { toast.error("Title and project are required."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("issues").insert({
        issue_title: form.issue_title,
        issue_description: form.issue_description || null,
        project_id: form.project_id,
        priority: form.priority,
        category: form.category || null,
        issue_status: "open",
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      toast.success("Issue created.");
      setForm({ issue_title: "", issue_description: "", project_id: form.project_id, priority: "major", category: "" });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error((err as Error).message || "Failed to create issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create issue</DialogTitle>
          <DialogDescription>Log a new compliance or quality issue.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.issue_title} onChange={(e) => setForm({ ...form, issue_title: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={form.issue_description} onChange={(e) => setForm({ ...form, issue_description: e.target.value })} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category (optional)</Label>
            <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Structural, MEP, Finishing" />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={submitting || !projects.length} className="bg-gradient-accent text-accent-foreground border-0">
              {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIssueDialog;
