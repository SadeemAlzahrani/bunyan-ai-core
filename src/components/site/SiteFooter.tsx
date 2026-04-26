import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "@/components/Logo";

const SiteFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-secondary/40 mt-24">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
              {t("footer.description")}
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">{t("footer.platform")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/solutions" className="hover:text-foreground transition-smooth">{t("marketingNav.solutions")}</Link></li>
              <li><Link to="/security" className="hover:text-foreground transition-smooth">{t("marketingNav.security")}</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-smooth">{t("marketingNav.pricing")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">{t("footer.company")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground transition-smooth">{t("marketingNav.contact")}</Link></li>
              <li><Link to="/request-demo" className="hover:text-foreground transition-smooth">{t("marketingNav.requestDemo")}</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-smooth">{t("footer.customerLogin")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Bunyan AI. {t("footer.rights")}</p>
          <p>{t("footer.badge")}</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
