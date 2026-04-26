import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { roleLabel, type Role } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InviteUserDialog from "@/components/workspace/InviteUserDialog";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean | null;
  created_at: string | null;
}

const statusStyle = (active: boolean | null) =>
  active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground";

const UsersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = can(user?.role, "manageUsers");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase.from("users").select("id, full_name, email, role, is_active, created_at");
    if (user.role !== "super_admin" && user.companyId) q = q.eq("company_id", user.companyId);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setUsers(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const toggleActive = async (u: UserRow) => {
    setPendingId(u.id);
    const next = !u.is_active;
    const { error } = await supabase.from("users").update({ is_active: next }).eq("id", u.id);
    setPendingId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? `${u.full_name} activated.` : `${u.full_name} deactivated.`);
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: next } : x));
  };

  return (
    <div>
      <PageHeader
        eyebrow={t("common.workspace")}
        title={t("users.title")}
        description={t("users.subtitle")}
        actions={canManage && (
          <Button onClick={() => setInviteOpen(true)} className="rounded-full bg-gradient-accent text-accent-foreground border-0 shadow-card">
            <Plus className="h-4 w-4 me-1.5" /> {t("users.inviteUser")}
          </Button>
        )}
      />

      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-start px-6 py-3 font-medium">{t("common.name")}</th>
                <th className="text-start px-6 py-3 font-medium">{t("common.role")}</th>
                <th className="text-start px-6 py-3 font-medium">{t("common.status")}</th>
                <th className="text-start px-6 py-3 font-medium">{t("users.lastActive")}</th>
                {canManage && <th className="text-end px-6 py-3 font-medium">{t("common.actions")}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-smooth">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-accent text-accent-foreground flex items-center justify-center text-xs font-display font-semibold">
                        {u.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{roleLabel(u.role as Role)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle(u.is_active)}`}>
                      {u.is_active ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        disabled={pendingId === u.id || u.id === user?.id}
                        onClick={() => toggleActive(u)}
                      >
                        {u.is_active ? t("users.deactivate") : t("users.activate")}
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr><td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-sm text-muted-foreground">No users yet.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-sm text-muted-foreground">Loading…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} onCreated={load} />
    </div>
  );
};

export default UsersPage;
