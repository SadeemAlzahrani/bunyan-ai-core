import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { signOut, roleLabel, type Role } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import PreferenceToggles from "@/components/PreferenceToggles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Permission } from "@/lib/permissions";
import { can } from "@/lib/permissions";

interface NavItem { to: string; label: string; permission?: Permission }

interface AppShellProps {
  navItems: NavItem[];
  expectedRole: Role | Role[];
  workspaceName: string;
}

const AppShell = ({ navItems, expectedRole, workspaceName }: AppShellProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    const allowed = Array.isArray(expectedRole) ? expectedRole.includes(user.role) : user.role === expectedRole;
    if (!allowed) {
      navigate("/login", { replace: true });
    }
  }, [expectedRole, navigate, user, loading]);

  if (loading || !user) return null;

  const visibleNav = navItems.filter((n) => !n.permission || can(user.role, n.permission));

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const displayWorkspace = user.role === "super_admin" ? workspaceName : (user.companyName ?? workspaceName);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Logo to={visibleNav[0]?.to ?? "/"} />
            <div className="hidden lg:flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Workspace</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold text-foreground">{displayWorkspace}</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-smooth ${
                    isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <PreferenceToggles />
            <Button variant="ghost" size="icon" className="rounded-full hidden sm:inline-flex">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 end-2 h-2 w-2 rounded-full bg-accent" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-secondary transition-smooth">
                  <div className="h-8 w-8 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-display font-semibold text-sm">
                    {initials}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                    <span className="text-xs text-accent font-medium mt-1">{roleLabel(user.role)}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* mobile nav */}
        <div className="md:hidden border-t border-border overflow-x-auto">
          <div className="flex gap-1 px-4 py-2">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 max-w-[1400px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
