import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueId: string | null;
  onAssigned: () => void;
}

const AssignIssueDialog = ({ open, onOpenChange, issueId, onAssigned }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [assignee, setAssignee] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const load = async () => {
      let q = supabase.from("users").select("id, full_name").eq("is_active", true);
      if (user.role !== "super_admin" && user.companyId) q = q.eq("company_id", user.companyId);
      const { data } = await q;
      setUsers(data ?? []);
    };
    void load();
  }, [open, user]);

  const onSubmit = async () => {
    if (!issueId || !assignee) { toast.error("Choose an assignee."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("issues").update({ assigned_to: assignee, issue_status: "in_progress" }).eq("id", issueId);
      if (error) throw error;
      await supabase.from("issue_updates").insert({
        issue_id: issueId,
        update_status: "assigned",
        update_note: `Assigned to user ${assignee}`,
        updated_by: user?.id ?? null,
      });
      toast.success("Issue assigned.");
      onOpenChange(false);
      setAssignee("");
      onAssigned();
    } catch (err) {
      toast.error((err as Error).message || "Failed to assign.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("issues.assignTo")}</DialogTitle>
          <DialogDescription>Pick a teammate to own this issue.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Assignee</Label>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("common.cancel")}</Button>
          <Button onClick={onSubmit} disabled={submitting || !assignee} className="bg-gradient-accent text-accent-foreground border-0">
            {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t("issues.assignTo")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignIssueDialog;
