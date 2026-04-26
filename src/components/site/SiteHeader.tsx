import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import PreferenceToggles from "@/components/PreferenceToggles";

const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const nav = [
    { to: "/solutions", label: t("marketingNav.solutions") },
    { to: "/security", label: t("marketingNav.security") },
    { to: "/pricing", label: t("marketingNav.pricing") },
    { to: "/contact", label: t("marketingNav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-smooth ${
                  isActive ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <PreferenceToggles />
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/login">{t("marketingNav.login")}</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full bg-gradient-accent hover:opacity-95 text-accent-foreground border-0 shadow-card">
            <Link to="/request-demo">{t("marketingNav.requestDemo")}</Link>
          </Button>
        </div>
        <div className="md:hidden flex items-center gap-1">
          <PreferenceToggles />
          <button className="p-2 rounded-lg hover:bg-secondary" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-1">
            {nav.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={`px-4 py-3 rounded-lg text-sm font-medium ${pathname === item.to ? "bg-secondary" : ""}`}>
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2 border-t border-border mt-2">
              <Button asChild variant="outline" className="flex-1 rounded-full">
                <Link to="/login">{t("marketingNav.login")}</Link>
              </Button>
              <Button asChild className="flex-1 rounded-full bg-gradient-accent text-accent-foreground border-0">
                <Link to="/request-demo">{t("marketingNav.requestDemo")}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;

