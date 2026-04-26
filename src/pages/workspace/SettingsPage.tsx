import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { roleLabel } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SettingsPage = () => {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const [orgName, setOrgName] = useState(user?.companyName ?? "");
  const [fullName, setFullName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === "company_admin" || user?.role === "super_admin";

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update own profile name.
      if (fullName && fullName !== user.name) {
        const { error } = await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);
        if (error) throw error;
      }
      // Update company name (admin only).
      if (isAdmin && user.companyId && orgName && orgName !== (user.companyName ?? "")) {
        const { error } = await supabase.from("companies").update({ name: orgName }).eq("id", user.companyId);
        if (error) throw error;
      }
      toast.success("Settings saved.");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow={t("common.workspace")}
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <div className="space-y-6">
        <section className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="font-display font-semibold text-lg">{t("settings.organization")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="org">{t("settings.organizationName")}</Label>
              <Input id="org" value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={!isAdmin} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">{t("common.role")}</Label>
              <Input id="role" value={user ? roleLabel(user.role) : ""} disabled className="rounded-xl h-11" />
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl shadow-card p-6">
          <h2 className="font-display font-semibold text-lg">Your profile</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("login.workEmail")}</Label>
              <Input id="email" defaultValue={user?.email ?? ""} disabled className="rounded-xl h-11" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving} className="rounded-full bg-gradient-accent text-accent-foreground border-0 shadow-card">
            {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
