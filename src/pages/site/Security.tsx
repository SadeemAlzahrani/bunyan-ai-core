import { ShieldCheck, Lock, Server, FileCheck, Eye, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";

const Security = () => {
  const { t } = useTranslation();
  const items = [
    { icon: ShieldCheck, title: t("security.items.i1Title"), desc: t("security.items.i1Desc") },
    { icon: FileCheck, title: t("security.items.i2Title"), desc: t("security.items.i2Desc") },
    { icon: Lock, title: t("security.items.i3Title"), desc: t("security.items.i3Desc") },
    { icon: Server, title: t("security.items.i4Title"), desc: t("security.items.i4Desc") },
    { icon: KeyRound, title: t("security.items.i5Title"), desc: t("security.items.i5Desc") },
    { icon: Eye, title: t("security.items.i6Title"), desc: t("security.items.i6Desc") },
  ];

  return (
    <>
      <section className="bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="container relative py-20 md:py-28">
          <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">{t("security.label")}</span>
          <h1 className="mt-3 font-display font-bold text-4xl md:text-6xl tracking-tight max-w-3xl">{t("security.title")}</h1>
          <p className="mt-5 text-primary-foreground/75 text-lg max-w-2xl leading-relaxed">
            {t("security.desc")}
          </p>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <div key={i.title} className="p-7 rounded-2xl border border-border bg-card hover:shadow-elevated transition-smooth">
              <div className="h-12 w-12 rounded-xl bg-accent-soft flex items-center justify-center mb-5">
                <i.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-lg">{i.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{i.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 md:p-10 rounded-3xl bg-secondary/60 border border-border">
          <h3 className="font-display font-bold text-2xl">{t("security.docsTitle")}</h3>
          <p className="mt-2 text-muted-foreground">{t("security.docsDesc")}</p>
        </div>
      </section>
    </>
  );
};

export default Security;
