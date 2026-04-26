import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const { t } = useTranslation();
  const tiers = [
    {
      name: t("pricing.tiers.growthName"),
      desc: t("pricing.tiers.growthDesc"),
      price: t("pricing.custom"),
      features: [
        t("pricing.tiers.growthF1"),
        t("pricing.tiers.growthF2"),
        t("pricing.tiers.growthF3"),
        t("pricing.tiers.growthF4"),
        t("pricing.tiers.growthF5"),
      ],
      highlight: false,
    },
    {
      name: t("pricing.tiers.enterpriseName"),
      desc: t("pricing.tiers.enterpriseDesc"),
      price: t("pricing.custom"),
      features: [
        t("pricing.tiers.enterpriseF1"),
        t("pricing.tiers.enterpriseF2"),
        t("pricing.tiers.enterpriseF3"),
        t("pricing.tiers.enterpriseF4"),
        t("pricing.tiers.enterpriseF5"),
        t("pricing.tiers.enterpriseF6"),
      ],
      highlight: true,
    },
    {
      name: t("pricing.tiers.sovereignName"),
      desc: t("pricing.tiers.sovereignDesc"),
      price: t("pricing.custom"),
      features: [
        t("pricing.tiers.sovereignF1"),
        t("pricing.tiers.sovereignF2"),
        t("pricing.tiers.sovereignF3"),
        t("pricing.tiers.sovereignF4"),
        t("pricing.tiers.sovereignF5"),
      ],
      highlight: false,
    },
  ];

  return (
    <>
      <section className="bg-gradient-soft border-b border-border">
        <div className="container py-20 md:py-28 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">{t("pricing.label")}</span>
          <h1 className="mt-3 font-display font-bold text-4xl md:text-6xl tracking-tight">{t("pricing.title")}</h1>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("pricing.desc")}
          </p>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-8 rounded-3xl border transition-smooth ${
                tier.highlight
                  ? "border-accent bg-card shadow-elevated relative"
                  : "border-border bg-card hover:shadow-elevated"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-accent text-accent-foreground text-xs font-semibold">
                  {t("pricing.mostPopular")}
                </span>
              )}
              <h3 className="font-display font-bold text-2xl">{tier.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{tier.desc}</p>
              <p className="mt-6 font-display font-bold text-4xl tracking-tight">{tier.price}</p>
              <p className="text-sm text-muted-foreground">{t("pricing.contactQuote")}</p>
              <Button asChild className={`mt-6 w-full rounded-full ${tier.highlight ? "bg-gradient-accent text-accent-foreground border-0" : ""}`} variant={tier.highlight ? "default" : "outline"}>
                <Link to="/contact">{t("pricing.contactSales")}</Link>
              </Button>
              <ul className="mt-7 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Pricing;
