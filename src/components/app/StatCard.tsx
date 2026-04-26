import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

const StatCard = ({ label, value, delta, icon: Icon, trend = "up" }: StatCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-elevated transition-smooth">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="mt-2 text-3xl font-display font-bold tracking-tight">{value}</p>
        {delta && (
          <p className={`mt-1.5 text-xs font-medium ${trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
            {delta}
          </p>
        )}
      </div>
      <div className="h-11 w-11 rounded-xl bg-accent-soft flex items-center justify-center">
        <Icon className="h-5 w-5 text-accent" />
      </div>
    </div>
  </div>
);

export default StatCard;
