import { useState } from "react";
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
  onCreated: () => void;
}

const CreateProjectDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    project_name: "",
    project_code: "",
    project_type: "residential",
    location_city: "",
    district: "",
    status: "active",
  });

  const reset = () => setForm({ project_name: "", project_code: "", project_type: "residential", location_city: "", district: "", status: "active" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) {
      toast.error("Your account is not assigned to a company.");
      return;
    }
    if (!form.project_name || !form.project_code) {
      toast.error("Project name and code are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("projects").insert({
        project_name: form.project_name,
        project_code: form.project_code,
        project_type: form.project_type || null,
        location_city: form.location_city || null,
        district: form.district || null,
        status: form.status,
        company_id: user.companyId,
        compliance_score: 0,
      });
      if (error) throw error;
      toast.success(`Project "${form.project_name}" created.`);
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error((err as Error).message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("projects.createProject")}</DialogTitle>
          <DialogDescription>Add a new project to your company workspace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Project name</Label>
              <Input id="pname" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcode">Project code</Label>
              <Input id="pcode" value={form.project_code} onChange={(e) => setForm({ ...form, project_code: e.target.value })} required placeholder="e.g. PRJ-2025-001" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="on_hold">On hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.location_city} onChange={(e) => setForm({ ...form, location_city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="district">District</Label>
              <Input id="district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={submitting} className="bg-gradient-accent text-accent-foreground border-0">
              {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t("projects.createProject")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
