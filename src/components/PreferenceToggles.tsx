import { useTranslation } from "react-i18next";
import { Moon, Sun, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/ThemeProvider";

interface Props {
  variant?: "ghost" | "outline";
  className?: string;
}

const PreferenceToggles = ({ variant = "ghost", className = "" }: Props) => {
  const { i18n, t } = useTranslation();
  const { theme, toggle } = useTheme();
  const isAr = i18n.language === "ar";

  const switchLang = () => {
    const next = isAr ? "en" : "ar";
    i18n.changeLanguage(next);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={switchLang}
        className="rounded-full h-9 px-3 gap-1.5 font-medium"
        aria-label={t("common.language")}
      >
        <Languages className="h-4 w-4" />
        <span className="text-xs">{isAr ? "EN" : "ع"}</span>
      </Button>
      <Button
        type="button"
        variant={variant}
        size="icon"
        onClick={toggle}
        className="rounded-full h-9 w-9"
        aria-label={t("common.theme")}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default PreferenceToggles;
