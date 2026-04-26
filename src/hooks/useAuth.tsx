import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { loadAppUser, type AppUser } from "@/lib/auth";

interface AuthCtx {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, refresh: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async (s: Session | null) => {
    if (!s?.user?.email) {
      setUser(null);
      return;
    }
    const u = await loadAppUser(s.user.id, s.user.email);
    setUser(u);
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Defer the async DB lookup to avoid blocking the listener
      setTimeout(() => { void hydrate(s); }, 0);
    });

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await hydrate(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await hydrate(data.session);
  };

  return <Ctx.Provider value={{ session, user, loading, refresh }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
