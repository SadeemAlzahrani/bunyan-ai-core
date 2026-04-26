import type { Role } from "@/lib/auth";

// Permission map for the Company Workspace.
export const PERMISSIONS = {
  viewDashboard: ["company_admin", "project_manager"] as Role[],
  viewUsers: ["company_admin"] as Role[],
  manageUsers: ["company_admin"] as Role[],
  viewProjects: ["company_admin", "project_manager"] as Role[],
  createProject: ["company_admin", "project_manager"] as Role[],
  viewContracts: ["company_admin", "project_manager"] as Role[],
  uploadContract: ["company_admin", "project_manager"] as Role[],
  viewIssues: ["company_admin", "project_manager", "project_engineer"] as Role[],
  createIssue: ["company_admin", "project_manager", "project_engineer"] as Role[],
  assignIssue: ["company_admin", "project_manager"] as Role[],
  resolveIssue: ["project_engineer", "project_manager", "company_admin"] as Role[],
  viewReports: ["company_admin", "project_manager", "project_engineer"] as Role[],
  approveReport: ["company_admin", "project_manager"] as Role[],
  exportReport: ["company_admin", "project_manager"] as Role[],
  viewSettings: ["company_admin"] as Role[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const can = (role: Role | undefined | null, perm: Permission): boolean => {
  if (!role) return false;
  return (PERMISSIONS[perm] as readonly Role[]).includes(role);
};
