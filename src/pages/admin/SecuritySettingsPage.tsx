import { Shield, Lock, KeyRound, FileCheck, Server, Eye, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

interface Toggle { id: string; label: string; desc: string; defaultOn: boolean; icon: typeof Shield }

const security: Toggle[] = [
  { id: "mfa", label: "Require MFA for all admins", desc: "Time-based OTP enforced for super_admin and company_admin roles.", defaultOn: true, icon: Lock },
  { id: "ip", label: "IP allowlist for Super Admin", desc: "Restrict /admin portal to known IP ranges.", defaultOn: true, icon: Server },
  { id: "session", label: "Short session lifetime", desc: "Auto-expire admin sessions after 30 minutes of inactivity.", defaultOn: true, icon: KeyRound },
  { id: "leaks", label: "Leaked password protection (HIBP)", desc: "Block passwords known to be compromised.", defaultOn: true, icon: AlertTriangle },
  { id: "audit_export", label: "Quarterly audit log export", desc: "Auto-deliver audit logs to your SIEM each quarter.", defaultOn: false, icon: FileCheck },
  { id: "anon_telemetry", label: "Anonymous telemetry", desc: "Aggregate, non-identifying usage metrics for product improvement.", defaultOn: true, icon: Eye },
];

const certifications = [
  { name: "SOC 2 Type II", status: "Active", renewed: "Jan 2026" },
  { name: "ISO 27001", status: "Active", renewed: "Mar 2026" },
  { name: "GDPR / DPA", status: "Active", renewed: "Continuous" },
  { name: "Penetration test", status: "Passed", renewed: "Q1 2026" },
];

const SecuritySettingsPage = () => {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(security.map((s) => [s.id, s.defaultOn]))
  );

  const toggle = (id: string, on: boolean) => {
    setState((prev) => ({ ...prev, [id]: on }));
    toast.success(`${security.find((s) => s.id === id)?.label}: ${on ? "enabled" : "disabled"}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Security Settings"
        title="Platform security"
        description="Global security posture for the Bunyan platform."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {security.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-5 shadow-card flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <s.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
              <Switch checked={state[s.id]} onCheckedChange={(v) => toggle(s.id, v)} />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Security posture</h3>
                <p className="text-xs text-success font-medium">Excellent · A+</p>
              </div>
            </div>
            <div className="mt-5 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-gradient-to-r from-success to-accent" style={{ width: "96%" }} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">96 / 100 across MFA, encryption, audit, and access controls.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <h3 className="font-display font-semibold">Certifications</h3>
            <p className="text-xs text-muted-foreground">Current compliance status</p>
            <ul className="mt-4 space-y-3">
              {certifications.map((c) => (
                <li key={c.name} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Renewed {c.renewed}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">{c.status}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-5 w-full rounded-full">Download SOC 2 report</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecuritySettingsPage;
