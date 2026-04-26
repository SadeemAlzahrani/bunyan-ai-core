import { useState } from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const RequestDemo = () => {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDone(true);
    toast.success(t("demo.toastSuccess"));
  };

  if (done) {
    return (
      <section className="container py-32 text-center max-w-xl mx-auto">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-accent-soft flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h1 className="mt-6 font-display font-bold text-3xl md:text-4xl">{t("demo.receivedTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("demo.receivedDesc")}</p>
      </section>
    );
  }

  return (
    <section className="container py-20 md:py-24 grid gap-12 lg:grid-cols-2">
      <div>
        <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">{t("demo.label")}</span>
        <h1 className="mt-3 font-display font-bold text-4xl md:text-5xl tracking-tight">{t("demo.title")}</h1>
        <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
          {t("demo.desc")}
        </p>
        <div className="mt-8 p-5 rounded-2xl bg-secondary/60 border border-border flex gap-4 items-start">
          <Calendar className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-display font-semibold">{t("demo.expectTitle")}</p>
            <p className="text-muted-foreground mt-1">{t("demo.expectDesc")}</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-8 rounded-3xl border border-border bg-card shadow-card">
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fn">{t("demo.firstName")}</Label>
              <Input id="fn" required className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ln">{t("demo.lastName")}</Label>
              <Input id="ln" required className="rounded-xl h-11" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em">{t("demo.workEmail")}</Label>
            <Input id="em" type="email" required className="rounded-xl h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co">{t("demo.company")}</Label>
            <Input id="co" required className="rounded-xl h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="size">{t("demo.activeProjects")}</Label>
            <Input id="size" placeholder="e.g. 12" className="rounded-xl h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("demo.notes")}</Label>
            <Textarea id="notes" rows={3} className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-11 rounded-full bg-gradient-accent text-accent-foreground border-0 shadow-card">
            {t("demo.requestMyDemo")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">{t("demo.respondNote")}</p>
        </div>
      </form>
    </section>
  );
};

export default RequestDemo;
