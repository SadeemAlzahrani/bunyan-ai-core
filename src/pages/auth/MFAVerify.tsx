import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import PreferenceToggles from "@/components/PreferenceToggles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { roleHome } from "@/lib/auth";

const MFAVerify = () => {
  const navigate = useNavigate();

  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const createChallenge = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: assurance } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (assurance?.currentLevel === "aal2") {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("email", session.user.email)
          .maybeSingle();

          toast.success("2FA verified successfully");
          setVerifying(false);
          
          const destination = roleHome(
            (profile?.role ?? "project_engineer") as Parameters<typeof roleHome>[0]
          );
          
          navigate(destination, { replace: true });
        return;
      }

      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        toast.error(factorsError.message || "Failed to load 2FA factors");
        setLoading(false);
        return;
      }

      const verifiedFactor = factorsData?.totp?.find(
        (factor) => factor.status === "verified"
      );

      if (!verifiedFactor) {
        navigate("/mfa-setup", { replace: true });
        return;
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: verifiedFactor.id,
        });

      if (challengeError || !challengeData) {
        toast.error(challengeError?.message || "Failed to create 2FA challenge");
        setLoading(false);
        return;
      }

      setFactorId(verifiedFactor.id);
      setChallengeId(challengeData.id);
      setLoading(false);
    };

    void createChallenge();
  }, [navigate]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!code.trim()) {
      toast.error("Enter the 6-digit code");
      return;
    }

    setVerifying(true);

    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.trim(),
    });

    if (error) {
      setVerifying(false);
      toast.error(error.message || "Invalid verification code");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setVerifying(false);
      navigate("/login", { replace: true });
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("email", user.email)
      .maybeSingle();

    toast.success("2FA verified successfully");
    setVerifying(false);

    toast.success("2FA verified successfully");
setVerifying(false);

const destination = roleHome(
  (profile?.role ?? "project_engineer") as Parameters<typeof roleHome>[0]
);

navigate(destination, { replace: true });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute top-4 end-4">
        <PreferenceToggles />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-card">
        <div className="mb-8">
          <Logo />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h1 className="font-display font-bold text-2xl">
            Verify Your Identity
          </h1>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Enter the 6-digit code from your authenticator app to continue.
        </p>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto mb-3 animate-spin" />
            Preparing verification...
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Authentication Code
              </label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                maxLength={6}
                className="h-11 rounded-xl text-center tracking-[0.35em]"
              />
            </div>

            <Button
              type="submit"
              disabled={verifying}
              className="w-full h-11 rounded-full bg-gradient-accent text-accent-foreground"
            >
              {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verify & Continue
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
}

export default MFAVerify;


