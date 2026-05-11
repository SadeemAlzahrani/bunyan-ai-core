import { useMemo, useState } from "react";
import { Check, Users, FolderKanban, Sparkles, Loader2 } from "lucide-react";
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
import { plans as initialPlans } from "@/lib/admin-data";
import { toast } from "sonner";

type PlanLimit = number | "Unlimited";

interface Plan {
  name: string;
  tenantCount: number;
  blurb: string;
  price: string;
  maxUsers: PlanLimit;
  maxProjects: PlanLimit;
  monthlyAiLimit: PlanLimit;
  features: string[];
}

const fmtLimit = (value: PlanLimit) =>
  value === "Unlimited" ? "Unlimited" : value.toLocaleString();

const parseLimit = (value: string): PlanLimit => {
  const cleaned = value.trim();

  if (!cleaned || cleaned.toLowerCase() === "unlimited") {
    return "Unlimited";
  }

  const parsed = Number(cleaned.replace(/,/g, ""));
  return Number.isNaN(parsed) ? "Unlimited" : parsed;
};

const PlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>(initialPlans as Plan[]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState<string>("Starter");

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.name === selectedPlanName) ?? plans[0];
  }, [plans, selectedPlanName]);

  const [price, setPrice] = useState(selectedPlan.price);
  const [maxUsers, setMaxUsers] = useState(String(selectedPlan.maxUsers));
  const [maxProjects, setMaxProjects] = useState(String(selectedPlan.maxProjects));
  const [monthlyAiLimit, setMonthlyAiLimit] = useState(
    String(selectedPlan.monthlyAiLimit)
  );

  const openEditor = (planName?: string) => {
    const planToEdit =
      plans.find((plan) => plan.name === planName) ??
      plans.find((plan) => plan.name === selectedPlanName) ??
      plans[0];

    setSelectedPlanName(planToEdit.name);
    setPrice(planToEdit.price);
    setMaxUsers(String(planToEdit.maxUsers));
    setMaxProjects(String(planToEdit.maxProjects));
    setMonthlyAiLimit(String(planToEdit.monthlyAiLimit));
    setOpen(true);
  };

  const handlePlanChange = (planName: string) => {
    const planToEdit = plans.find((plan) => plan.name === planName);
    if (!planToEdit) return;

    setSelectedPlanName(planToEdit.name);
    setPrice(planToEdit.price);
    setMaxUsers(String(planToEdit.maxUsers));
    setMaxProjects(String(planToEdit.maxProjects));
    setMonthlyAiLimit(String(planToEdit.monthlyAiLimit));
  };

  const handleSave = async () => {
    setSaving(true);

    setPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.name === selectedPlanName
          ? {
              ...plan,
              price: price.trim() || plan.price,
              maxUsers: parseLimit(maxUsers),
              maxProjects: parseLimit(maxProjects),
              monthlyAiLimit: parseLimit(monthlyAiLimit),
            }
          : plan
      )
    );

    setSaving(false);
    setOpen(false);
    toast.success(`${selectedPlanName} plan updated`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Subscription Plans"
        title="Plans & limits"
        description="Each plan controls user, project, and monthly AI analysis caps."
        actions={
          <Button
            onClick={() => openEditor()}
            variant="outline"
            className="rounded-full"
          >
            Edit plan limits
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Plan Limits</DialogTitle>
            <DialogDescription>
              Update subscription pricing and usage limits for each plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="plan-select">Plan</Label>
              <select
                id="plan-select"
                name="plan-select"
                aria-label="Plan"
                title="Plan"
                value={selectedPlanName}
                onChange={(event) => handlePlanChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {plans.map((plan) => (
                  <option key={plan.name} value={plan.name}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-price">Price</Label>
              <Input
                id="plan-price"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="$1,200/mo"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max-users">Users</Label>
                <Input
                  id="max-users"
                  value={maxUsers}
                  onChange={(event) => setMaxUsers(event.target.value)}
                  placeholder="15 or Unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-projects">Projects</Label>
                <Input
                  id="max-projects"
                  value={maxProjects}
                  onChange={(event) => setMaxProjects(event.target.value)}
                  placeholder="5 or Unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-limit">AI / Month</Label>
                <Input
                  id="ai-limit"
                  value={monthlyAiLimit}
                  onChange={(event) => setMonthlyAiLimit(event.target.value)}
                  placeholder="1000 or Unlimited"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button disabled={saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-7 transition-smooth ${
              plan.name === "Pro"
                ? "border-accent shadow-elevated bg-card relative"
                : "border-border bg-card hover:shadow-elevated"
            }`}
          >
            {plan.name === "Pro" && (
              <span className="absolute -top-3 left-7 px-2.5 py-0.5 rounded-full bg-gradient-accent text-accent-foreground text-xs font-semibold">
                Most popular
              </span>
            )}

            <div className="flex items-baseline justify-between">
              <h3 className="font-display font-bold text-2xl">{plan.name}</h3>
              <span className="text-xs text-muted-foreground">
                {plan.tenantCount} tenants
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>

            <p className="mt-5 font-display font-bold text-3xl tracking-tight">
              {plan.price}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-secondary/60">
                <Users className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1.5 text-sm font-display font-semibold">
                  {fmtLimit(plan.maxUsers)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  users
                </p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/60">
                <FolderKanban className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1.5 text-sm font-display font-semibold">
                  {fmtLimit(plan.maxProjects)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  projects
                </p>
              </div>

              <div className="p-3 rounded-xl bg-secondary/60">
                <Sparkles className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1.5 text-sm font-display font-semibold">
                  {fmtLimit(plan.monthlyAiLimit)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  AI / mo
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => openEditor(plan.name)}
              variant="outline"
              className="mt-7 w-full rounded-full"
            >
              Configure
            </Button>
          </div>
        ))}
      </div>
    </>
  );
};

export default PlansPage;