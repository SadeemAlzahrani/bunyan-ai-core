import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import Logo from "@/components/Logo";
import PreferenceToggles from "@/components/PreferenceToggles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { roleHome } from "@/lib/auth";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user, loading, refresh } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isResetPasswordFlow = useMemo(() => {
    return window.location.pathname === "/reset-password";
  }, []);

  useEffect(() => {
    if (loading) return;

    // مهم: لا نرجع المستخدم للّوقن إذا هو جاي من رابط Forgot Password
    if (isResetPasswordFlow) return;

    // هذا فقط لتغيير الباسورد المؤقت بعد تسجيل الدخول
    if (!user) {
      toast.error("Please sign in first.");
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate, isResetPasswordFlow]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user?.email) {
        toast.error("Reset session expired. Please request a new reset link.");
        navigate("/forgot-password", { replace: true });
        return;
      }

      const authUser = sessionData.session.user;

      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      });

      if (passwordError) throw passwordError;

      const { error: profileError } = await supabase
        .from("users")
        .update({ must_change_password: false } as any)
        .eq("email", authUser.email);

      if (profileError) throw profileError;

      await refresh();

      toast.success("Password updated successfully.");

      if (isResetPasswordFlow) {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return;
      }

      navigate(roleHome(user?.role ?? "project_engineer"), { replace: true });
    } catch (err) {
      toast.error((err as Error).message || "Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !isResetPasswordFlow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-5">
        <Logo />
        <PreferenceToggles />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <Card className="w-full max-w-md rounded-3xl border-border/70 shadow-card">
          <CardContent className="p-7">
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <LockKeyhole className="h-7 w-7" />
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight">
                {isResetPasswordFlow
                  ? "Reset Password"
                  : "Change Temporary Password"}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {isResetPasswordFlow
                  ? "Create a new password for your account."
                  : "For security reasons, please create a new password before accessing your workspace."}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 rounded-xl"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 rounded-xl"
                  placeholder="Re-enter new password"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-full bg-gradient-accent text-accent-foreground border-0 shadow-card"
              >
                {submitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangePasswordPage;