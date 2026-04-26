import logo from "@/assets/bunyan-logo.png";
import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "default" | "light";
  to?: string;
}

const Logo = ({ variant = "default", to = "/" }: LogoProps) => {
  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <img src={logo} alt="Bunyan AI logo" className="h-9 w-9 object-contain transition-smooth group-hover:scale-105" />
      <span className={`font-display font-bold text-lg tracking-tight ${variant === "light" ? "text-primary-foreground" : "text-foreground"}`}>
        Bunyan<span className="text-accent ml-0.5">AI</span>
      </span>
    </Link>
  );
};

export default Logo;
