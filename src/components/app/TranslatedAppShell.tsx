import { useTranslation } from "react-i18next";
import AppShell from "./AppShell";
import type { Role } from "@/lib/auth";
import type { Permission } from "@/lib/permissions";

interface NavSpec { to: string; labelKey: string; permission?: Permission }

interface Props {
  navSpec: NavSpec[];
  expectedRole: Role | Role[];
  workspaceNameKey?: string;
  workspaceName?: string;
}

const TranslatedAppShell = ({ navSpec, expectedRole, workspaceNameKey, workspaceName }: Props) => {
  const { t } = useTranslation();
  return (
    <AppShell
      expectedRole={expectedRole}
      workspaceName={workspaceNameKey ? t(workspaceNameKey) : (workspaceName ?? "")}
      navItems={navSpec.map((n) => ({ to: n.to, label: t(n.labelKey), permission: n.permission }))}
    />
  );
};

export default TranslatedAppShell;
