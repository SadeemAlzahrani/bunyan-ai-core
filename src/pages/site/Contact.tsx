import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Contact = () => {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success(t("contact.toastSuccess"));
  };

  const contactInfo = [
    { icon: Mail, label: t("contact.emailLabel"), value: "sales@bunyan.ai" },
    { icon: Phone, label: t("contact.phoneLabel"), value: "+1 (415) 555-0102" },
    { icon: MapPin, label: t("contact.hqLabel"), value: t("contact.hqValue") },
  ];

  return (
    <>
      <section className="bg-gradient-soft border-b border-border">
        <div className="container py-20 md:py-24">
          <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">{t("contact.label")}</span>
          <h1 className="mt-3 font-display font-bold text-4xl md:text-5xl tracking-tight max-w-3xl">{t("contact.title")}</h1>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
            {t("contact.desc")}
          </p>
        </div>
      </section>

      <section className="container py-20 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          {contactInfo.map((c) => (
            <div key={c.label} className="flex gap-4">
              <div className="h-11 w-11 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <c.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="font-display font-semibold mt-1">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="lg:col-span-2 p-8 md:p-10 rounded-3xl border border-border bg-card shadow-card">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">{t("contact.firstName")}</Label>
              <Input id="firstName" required className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">{t("contact.lastName")}</Label>
              <Input id="lastName" required className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("contact.workEmail")}</Label>
              <Input id="email" type="email" required className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">{t("contact.company")}</Label>
              <Input id="company" required className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="role">{t("contact.yourRole")}</Label>
              <Input id="role" placeholder={t("contact.yourRolePlaceholder")} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="message">{t("contact.helpQuestion")}</Label>
              <Textarea id="message" rows={5} required className="rounded-xl" placeholder={t("contact.helpPlaceholder")} />
            </div>
          </div>
          <Button type="submit" disabled={sent} className="mt-6 rounded-full h-11 px-7 bg-gradient-accent text-accent-foreground border-0 shadow-card">
            {sent ? t("common.sent") : (<>{t("contact.sendMessage")} <Send className="ms-2 h-4 w-4" /></>)}
          </Button>
        </form>
      </section>
    </>
  );
};

export default Contact;
