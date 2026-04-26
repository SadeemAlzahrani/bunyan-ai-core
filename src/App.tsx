import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import SiteLayout from "@/components/site/SiteLayout";
import TranslatedAppShell from "@/components/app/TranslatedAppShell";

import Home from "@/pages/site/Home";
import Solutions from "@/pages/site/Solutions";
import Security from "@/pages/site/Security";
import Pricing from "@/pages/site/Pricing";
import Contact from "@/pages/site/Contact";
import RequestDemo from "@/pages/site/RequestDemo";
import Login from "@/pages/auth/Login";

import SuperAdminDashboard from "@/pages/admin/SuperAdminDashboard";
import TenantsPage from "@/pages/admin/TenantsPage";
import PlansPage from "@/pages/admin/PlansPage";
import UsagePage from "@/pages/admin/UsagePage";
import AuditPage from "@/pages/admin/AuditPage";
import SecuritySettingsPage from "@/pages/admin/SecuritySettingsPage";

import WorkspaceDashboard from "@/pages/workspace/WorkspaceDashboard";
import WorkspaceUsersPage from "@/pages/workspace/UsersPage";
import WorkspaceProjectsPage from "@/pages/workspace/ProjectsPage";
import WorkspaceContractsPage from "@/pages/workspace/ContractsPage";
import WorkspaceIssuesPage from "@/pages/workspace/IssuesPage";
import WorkspaceReportsPage from "@/pages/workspace/ReportsPage";
import WorkspaceSettingsPage from "@/pages/workspace/SettingsPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public marketing site */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/security" element={<Security />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/request-demo" element={<RequestDemo />} />
          </Route>

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Super Admin Portal */}
          <Route
            element={
              <TranslatedAppShell
                expectedRole="super_admin"
                workspaceName="Bunyan Platform"
                navSpec={[
                  { to: "/admin", labelKey: "adminNav.dashboard" },
                  { to: "/admin/tenants", labelKey: "adminNav.tenants" },
                  { to: "/admin/plans", labelKey: "adminNav.plans" },
                  { to: "/admin/usage", labelKey: "adminNav.usage" },
                  { to: "/admin/audit", labelKey: "adminNav.audit" },
                  { to: "/admin/security", labelKey: "adminNav.security" },
                ]}
              />
            }
          >
            <Route path="/admin" element={<SuperAdminDashboard />} />
            <Route path="/admin/tenants" element={<TenantsPage />} />
            <Route path="/admin/plans" element={<PlansPage />} />
            <Route path="/admin/usage" element={<UsagePage />} />
            <Route path="/admin/audit" element={<AuditPage />} />
            <Route path="/admin/security" element={<SecuritySettingsPage />} />
          </Route>

          {/* Shared Company Workspace — gated per-role via permissions */}
          <Route
            element={
              <TranslatedAppShell
                expectedRole={["company_admin", "project_manager", "project_engineer"]}
                workspaceName="NorthBuild Construction"
                navSpec={[
                  { to: "/workspace", labelKey: "workspaceNav.overview", permission: "viewDashboard" },
                  { to: "/workspace/users", labelKey: "workspaceNav.users", permission: "viewUsers" },
                  { to: "/workspace/projects", labelKey: "workspaceNav.projects", permission: "viewProjects" },
                  { to: "/workspace/contracts", labelKey: "workspaceNav.contracts", permission: "viewContracts" },
                  { to: "/workspace/issues", labelKey: "workspaceNav.issues", permission: "viewIssues" },
                  { to: "/workspace/reports", labelKey: "workspaceNav.reports", permission: "viewReports" },
                  { to: "/workspace/settings", labelKey: "workspaceNav.settings", permission: "viewSettings" },
                ]}
              />
            }
          >
            <Route path="/workspace" element={<WorkspaceDashboard />} />
            <Route path="/workspace/users" element={<WorkspaceUsersPage />} />
            <Route path="/workspace/projects" element={<WorkspaceProjectsPage />} />
            <Route path="/workspace/contracts" element={<WorkspaceContractsPage />} />
            <Route path="/workspace/issues" element={<WorkspaceIssuesPage />} />
            <Route path="/workspace/reports" element={<WorkspaceReportsPage />} />
            <Route path="/workspace/settings" element={<WorkspaceSettingsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
