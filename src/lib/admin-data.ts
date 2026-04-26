// Mock data for the Super Admin portal. Replace with Lovable Cloud queries later.

export type TenantStatus = "active" | "suspended" | "onboarding";
export type Plan = "Starter" | "Pro" | "Enterprise";

export interface Tenant {
  id: string;
  name: string;
  plan: Plan;
  status: TenantStatus;
  users: number;
  projects: number;
  monthlyAi: number;
  lastActivity: string;
  region: string;
}

export const tenants: Tenant[] = [
  { id: "tn_1001", name: "NorthBuild Construction", plan: "Enterprise", status: "active", users: 124, projects: 38, monthlyAi: 18420, lastActivity: "2 min ago", region: "GCC" },
  { id: "tn_1002", name: "Sahara Developments", plan: "Enterprise", status: "active", users: 87, projects: 22, monthlyAi: 12104, lastActivity: "14 min ago", region: "MENA" },
  { id: "tn_1003", name: "Atlas Engineering", plan: "Pro", status: "active", users: 56, projects: 14, monthlyAi: 6230, lastActivity: "1 h ago", region: "EU" },
  { id: "tn_1004", name: "Meridian Group", plan: "Enterprise", status: "active", users: 210, projects: 71, monthlyAi: 31200, lastActivity: "5 min ago", region: "NA" },
  { id: "tn_1005", name: "Cedar & Stone", plan: "Pro", status: "onboarding", users: 34, projects: 9, monthlyAi: 980, lastActivity: "Yesterday", region: "EU" },
  { id: "tn_1006", name: "Vanguard Realty", plan: "Starter", status: "active", users: 12, projects: 4, monthlyAi: 410, lastActivity: "3 h ago", region: "NA" },
  { id: "tn_1007", name: "Helios Contracting", plan: "Pro", status: "suspended", users: 28, projects: 7, monthlyAi: 0, lastActivity: "12 days ago", region: "MENA" },
  { id: "tn_1008", name: "Pillar Design Group", plan: "Starter", status: "active", users: 8, projects: 3, monthlyAi: 220, lastActivity: "6 h ago", region: "EU" },
];

export interface PlanConfig {
  name: Plan;
  price: string;
  blurb: string;
  maxUsers: number | "Unlimited";
  maxProjects: number | "Unlimited";
  monthlyAiLimit: number | "Unlimited";
  features: string[];
  tenantCount: number;
}

export const plans: PlanConfig[] = [
  {
    name: "Starter",
    price: "$1,200/mo",
    blurb: "For small consultancies and pilot projects.",
    maxUsers: 15,
    maxProjects: 5,
    monthlyAiLimit: 1000,
    tenantCount: tenants.filter((t) => t.plan === "Starter").length,
    features: ["Email support", "Standard SLA", "Single region"],
  },
  {
    name: "Pro",
    price: "$4,800/mo",
    blurb: "For mid-size contractors and developers.",
    maxUsers: 75,
    maxProjects: 30,
    monthlyAiLimit: 10000,
    tenantCount: tenants.filter((t) => t.plan === "Pro").length,
    features: ["Priority support", "99.9% SLA", "SSO add-on", "API access"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    blurb: "For large multi-region operators.",
    maxUsers: "Unlimited",
    maxProjects: "Unlimited",
    monthlyAiLimit: "Unlimited",
    tenantCount: tenants.filter((t) => t.plan === "Enterprise").length,
    features: ["Dedicated CSM", "SSO + SCIM", "Custom AI models", "Data residency", "24/7 support"],
  },
];

export interface AuditEvent {
  id: string;
  type: "login" | "account_change" | "role_change" | "tenant_created" | "tenant_suspended" | "tenant_activated" | "security";
  actor: string;
  target?: string;
  message: string;
  ip?: string;
  ts: string;
  severity: "info" | "warning" | "critical";
}

export const auditEvents: AuditEvent[] = [
  { id: "ev_5001", type: "login", actor: "admin@bunyan.ai", message: "Super Admin login from new device", ip: "82.45.12.9", ts: "2 min ago", severity: "info" },
  { id: "ev_5002", type: "tenant_suspended", actor: "admin@bunyan.ai", target: "Helios Contracting", message: "Tenant suspended — non-payment", ts: "1 h ago", severity: "warning" },
  { id: "ev_5003", type: "role_change", actor: "ceo@northbuild.com", target: "yara@northbuild.com", message: "Promoted to Project Manager", ts: "3 h ago", severity: "info" },
  { id: "ev_5004", type: "tenant_created", actor: "admin@bunyan.ai", target: "Pillar Design Group", message: "New tenant provisioned (Starter)", ts: "Yesterday", severity: "info" },
  { id: "ev_5005", type: "security", actor: "system", message: "5 failed login attempts blocked from 91.x.x.x", ts: "Yesterday", severity: "critical" },
  { id: "ev_5006", type: "account_change", actor: "ceo@northbuild.com", message: "Updated company billing details", ts: "2 days ago", severity: "info" },
  { id: "ev_5007", type: "tenant_activated", actor: "admin@bunyan.ai", target: "Cedar & Stone", message: "Tenant onboarding completed", ts: "3 days ago", severity: "info" },
  { id: "ev_5008", type: "login", actor: "admin@bunyan.ai", message: "Super Admin login", ip: "82.45.12.9", ts: "3 days ago", severity: "info" },
  { id: "ev_5009", type: "security", actor: "system", message: "TLS certificate auto-renewed", ts: "5 days ago", severity: "info" },
  { id: "ev_5010", type: "role_change", actor: "admin@bunyan.ai", target: "tariq@northbuild.com", message: "Granted Project Manager role", ts: "1 week ago", severity: "info" },
];

// Last 12 months AI usage (synthetic, in thousands)
export const monthlyAiUsage = [
  { month: "May", value: 42 },
  { month: "Jun", value: 48 },
  { month: "Jul", value: 51 },
  { month: "Aug", value: 58 },
  { month: "Sep", value: 64 },
  { month: "Oct", value: 71 },
  { month: "Nov", value: 79 },
  { month: "Dec", value: 84 },
  { month: "Jan", value: 92 },
  { month: "Feb", value: 101 },
  { month: "Mar", value: 114 },
  { month: "Apr", value: 128 },
];

export const platformStats = {
  totalCompanies: tenants.length,
  activeSubscriptions: tenants.filter((t) => t.status === "active").length,
  suspendedTenants: tenants.filter((t) => t.status === "suspended").length,
  totalUsers: tenants.reduce((sum, t) => sum + t.users, 0),
  totalProjects: tenants.reduce((sum, t) => sum + t.projects, 0),
  monthlyAi: tenants.reduce((sum, t) => sum + t.monthlyAi, 0),
};
