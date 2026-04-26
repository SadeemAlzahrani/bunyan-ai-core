import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-6">
    <div className="text-center max-w-md">
      <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">404</p>
      <h1 className="mt-3 font-display font-bold text-4xl md:text-5xl tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you're looking for doesn't exist or you don't have access to it.</p>
      <Button asChild className="mt-7 rounded-full bg-gradient-accent text-accent-foreground border-0">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  </div>
);

export default NotFound;
