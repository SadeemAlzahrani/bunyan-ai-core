import { Building2, HardHat, Briefcase, Compass, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const Solutions = () => {
  const { t } = useTranslation();
  const solutions = [
    {
      icon: Building2,
      title: t("solutions.items.developersTitle"),
      desc: t("solutions.items.developersDesc"),
      points: [t("solutions.items.developersP1"), t("solutions.items.developersP2"), t("solutions.items.developersP3")],
    },
    {
      icon: HardHat,
      title: t("solutions.items.constructionTitle"),
      desc: t("solutions.items.constructionDesc"),
      points: [t("solutions.items.constructionP1"), t("solutions.items.constructionP2"), t("solutions.items.constructionP3")],
    },
    {
      icon: Briefcase,
      title: t("solutions.items.consultantsTitle"),
      desc: t("solutions.items.consultantsDesc"),
      points: [t("solutions.items.consultantsP1"), t("solutions.items.consultantsP2"), t("solutions.items.consultantsP3")],
    },
    {
      icon: Compass,
      title: t("solutions.items.ownersTitle"),
      desc: t("solutions.items.ownersDesc"),
      points: [t("solutions.items.ownersP1"), t("solutions.items.ownersP2"), t("solutions.items.ownersP3")],
    },
  ];

  return (
    <>
      <section className="bg-gradient-soft border-b border-border">
        <div className="container py-20 md:py-28">
          <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">{t("solutions.label")}</span>
          <h1 className="mt-3 font-display font-bold text-4xl md:text-6xl tracking-tight max-w-3xl">{t("solutions.title")}</h1>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl leading-relaxed">
            {t("solutions.desc")}
          </p>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {solutions.map((s) => (
            <div key={s.title} className="group p-8 rounded-3xl border border-border bg-card hover:shadow-elevated hover:border-accent/40 transition-smooth">
              <div className="h-12 w-12 rounded-xl bg-accent-soft flex items-center justify-center mb-5">
                <s.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display font-bold text-2xl">{s.title}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{s.desc}</p>
              <ul className="mt-5 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="text-sm flex items-center gap-2 text-foreground/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button asChild size="lg" className="rounded-full bg-gradient-accent text-accent-foreground border-0 h-12 px-7 shadow-glow">
            <Link to="/request-demo">{t("solutions.seeInAction")} <ArrowRight className="ms-1.5 h-4 w-4 rtl:rotate-180" /></Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default Solutions;
