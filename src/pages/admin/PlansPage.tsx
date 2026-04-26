import { Check, Users, FolderKanban, Sparkles } from "lucide-react";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { plans } from "@/lib/admin-data";
import { toast } from "sonner";

const fmtLimit = (v: number | "Unlimited") => (v === "Unlimited" ? "Unlimited" : v.toLocaleString());

const PlansPage = () => (
  <>
    <PageHeader
      eyebrow="Subscription Plans"
      title="Plans & limits"
      description="Each plan controls user, project, and monthly AI analysis caps."
      actions={
        <Button onClick={() => toast.info("Plan editor opens here")} variant="outline" className="rounded-full">
          Edit plan limits
        </Button>
      }
    />

    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((p) => (
        <div
          key={p.name}
          className={`rounded-2xl border p-7 transition-smooth ${
            p.name === "Pro" ? "border-accent shadow-elevated bg-card relative" : "border-border bg-card hover:shadow-elevated"
          }`}
        >
          {p.name === "Pro" && (
            <span className="absolute -top-3 left-7 px-2.5 py-0.5 rounded-full bg-gradient-accent text-accent-foreground text-xs font-semibold">
              Most popular
            </span>
          )}
          <div className="flex items-baseline justify-between">
            <h3 className="font-display font-bold text-2xl">{p.name}</h3>
            <span className="text-xs text-muted-foreground">{p.tenantCount} tenants</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
          <p className="mt-5 font-display font-bold text-3xl tracking-tight">{p.price}</p>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-secondary/60">
              <Users className="h-4 w-4 mx-auto text-muted-foreground" />
              <p className="mt-1.5 text-sm font-display font-semibold">{fmtLimit(p.maxUsers)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">users</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/60">
              <FolderKanban className="h-4 w-4 mx-auto text-muted-foreground" />
              <p className="mt-1.5 text-sm font-display font-semibold">{fmtLimit(p.maxProjects)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">projects</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/60">
              <Sparkles className="h-4 w-4 mx-auto text-muted-foreground" />
              <p className="mt-1.5 text-sm font-display font-semibold">{fmtLimit(p.monthlyAiLimit)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI / mo</p>
            </div>
          </div>

          <ul className="mt-6 space-y-2">
            {p.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button onClick={() => toast.info(`Editing ${p.name} plan`)} variant="outline" className="mt-7 w-full rounded-full">
            Configure
          </Button>
        </div>
      ))}
    </div>
  </>
);

export default PlansPage;
