import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Eye,
  Plus,
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  RotateCcw,
  Power,
  Sparkles,
  Crown,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Plan = "starter" | "pro" | "enterprise";
type PlanLimit = number | "Unlimited";

type CompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  headquarters_city: string | null;
  subscription_plan: Plan | string | null;
  is_active: boolean | null;
  mfa_required: boolean | null;
  created_at: string | null;
};

interface Tenant {
  id: string;
  name: string;
  industry: string | null;
  headquarters_city: string | null;
  subscription_plan: Plan | string | null;
  is_active: boolean | null;
  mfa_required: boolean;
  users: number;
  projects: number;
  created_at: string | null;
}

const planLabel: Record<Plan, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const planLimits: Record<
  Plan,
  { ai: PlanLimit; users: PlanLimit; projects: PlanLimit }
> = {
  starter: { ai: 1000, users: 15, projects: 5 },
  pro: { ai: 10000, users: 75, projects: 30 },
  enterprise: { ai: "Unlimited", users: "Unlimited", projects: "Unlimited" },
};

const getSafePlan = (value: Tenant["subscription_plan"]): Plan => {
  if (value === "pro" || value === "enterprise" || value === "starter") {
    return value;
  }

  return "starter";
};

const formatLimit = (value: PlanLimit) => {
  return value === "Unlimited" ? "Unlimited" : value.toLocaleString();
};

const TenantsPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tenantActionLoading, setTenantActionLoading] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<Plan>("starter");

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [headquartersCity, setHeadquartersCity] = useState("");
  const [plan, setPlan] = useState<Plan>("starter");

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const loadTenants = async () => {
    setLoading(true);

    const { data: comps, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load tenants");
      setLoading(false);
      return;
    }

    const companies = (comps ?? []) as unknown as CompanyRow[];

    const enriched: Tenant[] = await Promise.all(
      companies.map(async (company) => {
        const [{ count: userCount }, { count: projectCount }] =
          await Promise.all([
            supabase
              .from("users")
              .select("*", { count: "exact", head: true })
              .eq("company_id", company.id),
            supabase
              .from("projects")
              .select("*", { count: "exact", head: true })
              .eq("company_id", company.id),
          ]);

        return {
          id: company.id,
          name: company.name,
          industry: company.industry,
          headquarters_city: company.headquarters_city,
          subscription_plan: company.subscription_plan,
          is_active: company.is_active,
          mfa_required: company.mfa_required ?? false,
          created_at: company.created_at,
          users: userCount ?? 0,
          projects: projectCount ?? 0,
        };
      })
    );

    setTenants(enriched);
    setLoading(false);
  };

  useEffect(() => {
    void loadTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      setUpgradePlan(getSafePlan(selectedTenant.subscription_plan));
    }
  }, [selectedTenant]);

  const resetForm = () => {
    setName("");
    setIndustry("");
    setHeadquartersCity("");
    setPlan("starter");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
  };

  const handleCreateTenant = async () => {
    if (!name.trim()) return toast.error("Company name is required");
    if (!adminName.trim()) return toast.error("Company admin name is required");
    if (!adminEmail.trim()) return toast.error("Company admin email is required");

    if (!adminPassword.trim() || adminPassword.length < 8) {
      return toast.error("Temporary password must be at least 8 characters");
    }

    setCreating(true);

    const { data, error } = await supabase.functions.invoke("provision-tenant", {
      body: {
        companyName: name.trim(),
        industry: industry.trim() || "Construction",
        headquartersCity: headquartersCity.trim() || null,
        subscriptionPlan: plan,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword: adminPassword.trim(),
      },
    });

    setCreating(false);

    if (error) {
      console.error(error);
      toast.error(error.message || "Failed to provision tenant");
      return;
    }

    if (data?.error) {
      toast.error(data.error);
      return;
    }

    toast.success("Tenant and company admin created successfully");
    resetForm();
    setOpen(false);
    await loadTenants();
  };

  const handleSetTenantActive = async (active: boolean) => {
    if (!selectedTenant) return;

    const actionLabel = active ? "reactivate" : "deactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${selectedTenant.name}?`
    );

    if (!confirmed) return;

    setTenantActionLoading(true);

    const { error: companyError } = await supabase
      .from("companies")
      .update({ is_active: active })
      .eq("id", selectedTenant.id);

    if (companyError) {
      setTenantActionLoading(false);
      toast.error(companyError.message || `Failed to ${actionLabel} tenant`);
      return;
    }

    const { error: usersError } = await supabase
      .from("users")
      .update({ is_active: active })
      .eq("company_id", selectedTenant.id);

    setTenantActionLoading(false);

    if (usersError) {
      toast.error(
        usersError.message || "Tenant updated, but users were not updated"
      );
      await loadTenants();
      return;
    }

    toast.success(
      active
        ? `${selectedTenant.name} has been reactivated`
        : `${selectedTenant.name} has been deactivated`
    );

    setDetailsOpen(false);
    setSelectedTenant(null);
    await loadTenants();
  };

  const handleUpgradePlan = async () => {
    if (!selectedTenant) return;

    const currentPlan = getSafePlan(selectedTenant.subscription_plan);

    if (upgradePlan === currentPlan) {
      toast.info("This tenant is already on this plan");
      return;
    }

    const confirmed = window.confirm(
      `Change ${selectedTenant.name}'s plan from ${planLabel[currentPlan]} to ${planLabel[upgradePlan]}?`
    );

    if (!confirmed) return;

    setTenantActionLoading(true);

    const { error } = await supabase
      .from("companies")
      .update({ subscription_plan: upgradePlan })
      .eq("id", selectedTenant.id);

    setTenantActionLoading(false);

    if (error) {
      toast.error(error.message || "Failed to update plan");
      return;
    }

    toast.success(
      `${selectedTenant.name} plan updated to ${planLabel[upgradePlan]}`
    );

    setDetailsOpen(false);
    setSelectedTenant(null);
    await loadTenants();
  };

  const handleToggleMFA = async (enabled: boolean) => {
    if (!selectedTenant) return;

    const confirmed = window.confirm(
      enabled
        ? `Require 2FA for all users in ${selectedTenant.name}?`
        : `Disable required 2FA for ${selectedTenant.name}?`
    );

    if (!confirmed) return;

    setTenantActionLoading(true);

    const { error } = await supabase
      .from("companies")
      .update({ mfa_required: enabled })
      .eq("id", selectedTenant.id);

    setTenantActionLoading(false);

    if (error) {
      toast.error(error.message || "Failed to update 2FA settings");
      return;
    }

    toast.success(
      enabled
        ? "2FA requirement enabled for this company"
        : "2FA requirement disabled for this company"
    );

    setSelectedTenant({
      ...selectedTenant,
      mfa_required: enabled,
    });

    await loadTenants();
  };

  const handleTerminateTenant = async () => {
    if (!selectedTenant) return;

    if (selectedTenant.projects > 0) {
      toast.error("This tenant has projects. Suspend it instead of terminating it.");
      return;
    }

    const confirmed = window.confirm(
      `Terminate ${selectedTenant.name}? This is only recommended for demo/test tenants with no projects.`
    );

    if (!confirmed) return;

    setTenantActionLoading(true);

    const { error: usersError } = await supabase
      .from("users")
      .delete()
      .eq("company_id", selectedTenant.id);

    if (usersError) {
      setTenantActionLoading(false);
      toast.error(usersError.message || "Failed to terminate tenant users");
      return;
    }

    const { error: companyError } = await supabase
      .from("companies")
      .delete()
      .eq("id", selectedTenant.id);

    setTenantActionLoading(false);

    if (companyError) {
      toast.error(companyError.message || "Failed to terminate tenant");
      return;
    }

    toast.success(`${selectedTenant.name} has been terminated`);
    setDetailsOpen(false);
    setSelectedTenant(null);
    await loadTenants();
  };

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return tenants;

    return tenants.filter((tenant) => {
      return (
        tenant.name.toLowerCase().includes(normalizedQuery) ||
        tenant.industry?.toLowerCase().includes(normalizedQuery) ||
        tenant.headquarters_city?.toLowerCase().includes(normalizedQuery) ||
        tenant.subscription_plan?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [tenants, query]);

  return (
    <>
      <PageHeader
        eyebrow="Tenant Management"
        title="Companies"
        description="All client companies provisioned on the Bunyan platform."
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="rounded-full bg-gradient-accent text-accent-foreground border-0 shadow-card"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Provision tenant
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Provision New Tenant</DialogTitle>
            <DialogDescription>
              Create a company workspace and assign its company admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Company Information</p>

              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Al-Dar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder="e.g. Construction"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headquarters-city">Headquarters City</Label>
                <Input
                  id="headquarters-city"
                  value={headquartersCity}
                  onChange={(event) => setHeadquartersCity(event.target.value)}
                  placeholder="e.g. Khobar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription-plan">Subscription Plan</Label>
                <select
                  id="subscription-plan"
                  value={plan}
                  onChange={(event) => setPlan(event.target.value as Plan)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-semibold">Company Admin Account</p>

              <div className="space-y-2">
                <Label htmlFor="admin-name">Admin Name</Label>
                <Input
                  id="admin-name"
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  placeholder="e.g. Al-Dar Admin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  placeholder="e.g. admin@aldar.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Temporary Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={creating}
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>

            <Button disabled={creating} onClick={handleCreateTenant}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Tenant & Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              Monitor subscription status, AI usage, security settings, and tenant lifecycle.
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-3">
              {(() => {
                const safePlan = getSafePlan(selectedTenant.subscription_plan);
                const limits = planLimits[safePlan];

                const aiUsed = selectedTenant.projects * 12 + selectedTenant.users * 4;
                const isAiUnlimited = limits.ai === "Unlimited";
                const aiPercent = isAiUnlimited
                  ? 0
                  : Math.round((aiUsed / limits.ai) * 100);

                return (
                  <>
                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedTenant.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedTenant.industry ?? "No industry"} •{" "}
                          {selectedTenant.headquarters_city ?? "No city"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Plan</p>
                          <p className="font-medium">{planLabel[safePlan]}</p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">
                            {selectedTenant.is_active === false
                              ? "Suspended"
                              : "Active"}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Users</p>
                          <p className="font-medium">
                            {selectedTenant.users} / {formatLimit(limits.users)}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Projects</p>
                          <p className="font-medium">
                            {selectedTenant.projects} /{" "}
                            {formatLimit(limits.projects)}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">2FA</p>
                          <p className="font-medium">
                            {selectedTenant.mfa_required ? "Required" : "Optional"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <p className="font-semibold">AI Usage</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Monthly AI analyses
                          </span>
                          <span className="font-medium">
                            {aiUsed.toLocaleString()} / {formatLimit(limits.ai)}
                          </span>
                        </div>

                        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{
                              width: `${isAiUnlimited ? 12 : Math.min(aiPercent, 100)}%`,
                            }}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {isAiUnlimited
                            ? "Unlimited monthly AI quota for Enterprise tenants."
                            : `${aiPercent}% of monthly AI quota used.`}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-accent" />
                        <p className="font-semibold">Subscription Plan</p>
                      </div>

                      <div className="flex gap-2">
                        <select
                          value={upgradePlan}
                          onChange={(event) =>
                            setUpgradePlan(event.target.value as Plan)
                          }
                          className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>

                        <Button
                          onClick={handleUpgradePlan}
                          disabled={tenantActionLoading}
                        >
                          {tenantActionLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Crown className="h-4 w-4 mr-2" />
                          )}
                          Upgrade Plan
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-sm">
                              Two-Factor Authentication
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Require users in this company to verify with an authenticator app.
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant={selectedTenant.mfa_required ? "default" : "outline"}
                          onClick={() =>
                            handleToggleMFA(!selectedTenant.mfa_required)
                          }
                          disabled={tenantActionLoading}
                          className="shrink-0"
                        >
                          {tenantActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : selectedTenant.mfa_required ? (
                            "Enabled"
                          ) : (
                            "Disabled"
                          )}
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Current setting:{" "}
                        <span className="font-medium">
                          {selectedTenant.mfa_required ? "Required" : "Optional"}
                        </span>
                      </p>
                    </div>
                  </>
                );
              })()}

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Deactivation suspends the tenant and its users without deleting
                company data. Termination is only recommended for demo tenants
                with no projects.
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>

                <div className="flex gap-2">
                  {selectedTenant.is_active === false ? (
                    <Button
                      onClick={() => handleSetTenantActive(true)}
                      disabled={tenantActionLoading}
                    >
                      {tenantActionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Reactivate Tenant
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => handleSetTenantActive(false)}
                      disabled={tenantActionLoading}
                    >
                      {tenantActionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4 mr-2" />
                      )}
                      Deactivate Tenant
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    onClick={handleTerminateTenant}
                    disabled={tenantActionLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Terminate Tenant
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by company, industry, city, or plan…"
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Company</th>
                <th className="text-left px-6 py-3 font-medium">Industry</th>
                <th className="text-left px-6 py-3 font-medium">Plan</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">2FA</th>
                <th className="text-right px-6 py-3 font-medium">Users</th>
                <th className="text-right px-6 py-3 font-medium">Projects</th>
                <th className="text-left px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center text-muted-foreground"
                  >
                    <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin" />
                    Loading tenants...
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((tenant) => {
                  const safePlan = getSafePlan(tenant.subscription_plan);

                  return (
                    <tr
                      key={tenant.id}
                      className="border-t border-border hover:bg-secondary/30 transition-smooth"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-accent" />
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tenant.headquarters_city ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {tenant.industry ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                          {planLabel[safePlan]}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {tenant.is_active === false ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <XCircle className="h-3.5 w-3.5" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {tenant.mfa_required ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            Optional
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right tabular-nums">
                        {tenant.users}
                      </td>

                      <td className="px-6 py-4 text-right tabular-nums">
                        {tenant.projects}
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {tenant.created_at
                          ? new Date(tenant.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center text-muted-foreground text-sm"
                  >
                    <Filter className="h-5 w-5 mx-auto mb-2 opacity-40" />
                    No tenants match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-border text-xs text-muted-foreground flex justify-between">
          <span>
            Showing {filtered.length} of {tenants.length} tenants
          </span>
          <span>Each tenant runs in an isolated workspace</span>
        </div>
      </div>
    </>
  );
};

export default TenantsPage;

