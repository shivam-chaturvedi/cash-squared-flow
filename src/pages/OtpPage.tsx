import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { t } from "@/lib/translations";
import { ShieldCheck } from "lucide-react";
import TopAccent from "@/components/TopAccent";
import { clearPendingSignupOtpEmail } from "@/lib/signupOtpPending";
import { clearPendingSignup, clearPendingSignupOtp, getPendingSignup, getPendingSignupOtp } from "@/lib/pendingSignup";
import { requestSignupOtp } from "@/lib/signupOtp";
import { clearPendingInvite, getPendingInvite } from "@/lib/pendingInvite";

const OtpPage = () => {
  const { language, setAuthState, userEmail } = useApp();
  const tr = t[language];
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!userEmail) {
      setErrorMessage("Email is required to verify OTP.");
      return;
    }

    const token = otp.join("");
    if (token.length !== 6) {
      setErrorMessage("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    const stored = getPendingSignupOtp();
    if (!stored || stored.expiresAt < Date.now()) {
      setLoading(false);
      setErrorMessage("OTP expired. Please resend and try again.");
      return;
    }
    if (stored.value !== token) {
      setLoading(false);
      setErrorMessage("Invalid OTP. Please try again.");
      return;
    }

    const pending = getPendingSignup();
    if (!pending || !pending.email || !pending.password) {
      setLoading(false);
      setErrorMessage("Signup details missing. Please go back and try again.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: pending.email,
      password: pending.password,
      options: {
        data: {
          ...(pending.full_name ? { full_name: pending.full_name } : {}),
          ...(typeof pending.age === "number" ? { age: pending.age } : {}),
        },
      },
    });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    // If email confirmations are enabled in Supabase, signUp may not create a session here.
    if (!data.session) {
      setLoading(false);
      setErrorMessage("Signup created, but you are not signed in. Disable Supabase email confirmations to use custom OTP emails.");
      return;
    }

    clearPendingSignupOtpEmail();
    clearPendingSignup();
    clearPendingSignupOtp();
    const pendingInvite = getPendingInvite();
    if (pendingInvite?.inviteId) {
      try {
        await supabase
          .from("business_employee_invites")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
            claimed_user_id: data.session.user.id,
          })
          .eq("id", pendingInvite.inviteId);

        await supabase
          .from("business_employees")
          .upsert({
            user_id: pendingInvite.ownerUserId,
            email: pendingInvite.employeeEmail,
            name: pendingInvite.employeeName,
            role: "Employee",
            access_pages: pendingInvite.accessPages,
            salary: pendingInvite.salary,
            employee_user_id: data.session.user.id,
            last_edit_at: new Date().toISOString(),
          }, { onConflict: "user_id,email" });
      } catch {
        // ignore, employee still can be resolved by email later
      }
      clearPendingInvite();
    }
    setAuthState("signup-terms");
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopAccent />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-1">{tr.otp}</h1>
        <p className="text-muted-foreground text-sm mb-6">{tr.otpSent}<br /><span className="font-medium text-foreground">{userEmail}</span></p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={`otp-${i}`}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-11 h-12 text-center text-lg font-bold border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ))}
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Verifying…" : tr.verify}
          </button>
        </form>

        {errorMessage && (
          <p className="text-xs text-center text-destructive mt-2">{errorMessage}</p>
        )}

        <button
          className="mt-3 text-sm text-primary font-medium"
          onClick={async () => {
            const pending = getPendingSignup();
            if (!pending) {
              setErrorMessage("Signup details missing. Please go back and try again.");
              return;
            }
            setErrorMessage(null);
            setLoading(true);
            try {
              await requestSignupOtp({
                email: pending.email,
                password: pending.password,
                full_name: pending.full_name,
                age: pending.age ?? null,
              });
            } catch (err) {
              setErrorMessage(err instanceof Error ? err.message : "Unable to resend OTP right now.");
            }
            setLoading(false);
          }}
          disabled={loading}
          type="button"
        >
          Resend OTP
        </button>

        <button
          className="mt-4 w-full border border-input bg-background py-2.5 font-semibold text-base hover:bg-muted transition disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => {
            clearPendingSignupOtpEmail();
            clearPendingSignup();
            clearPendingSignupOtp();
            setAuthState("login");
          }}
          disabled={loading}
          type="button"
        >
          {tr.otpBackHome}
        </button>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
