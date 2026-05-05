import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { t } from "@/lib/translations";
import { requestSignupOtp } from "@/lib/signupOtp";
import { setPendingSignupOtpEmail } from "@/lib/signupOtpPending";
import { Mail, Lock, Eye, EyeOff, User, Calendar } from "lucide-react";
import TopAccent from "@/components/TopAccent";
import { getPendingInvite } from "@/lib/pendingInvite";

const LoginPage = ({ initialIsSignup = false }: { initialIsSignup?: boolean }) => {
  const { language, setLanguage, authState, setAuthState, setUserName, setUserAge, setUserEmail } = useApp();
  const navigate = useNavigate();
  const tr = t[language];
  const [isSignup, setIsSignup] = useState(initialIsSignup || authState === "signup");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Signup fields
  const [signupStep, setSignupStep] = useState(1); // 1=name+age, 2=email+pw, 3=confirm pw
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    setIsSignup(authState === "signup");
  }, [authState]);

  useEffect(() => {
    const invite = getPendingInvite();
    if (!invite) return;
    setIsSignup(true);
    setSignupStep(1);
    if (invite.employeeName) setName(invite.employeeName);
    if (invite.employeeEmail) setEmail(invite.employeeEmail);
    setUserName(invite.employeeName || "User");
    setUserEmail(invite.employeeEmail || "");
    setAuthState("signup");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatusMessage(error.message);
    } else {
      setUserName(email.split("@")[0] || "User");
      setUserEmail(email);
      setAuthState("authenticated");
    }
    setLoading(false);
  };

  const handleSignupNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (signupStep === 1) {
      setSignupStep(2);
      return;
    }

    if (signupStep === 2) {
      if (!name.trim() || !age.trim() || !email.trim() || !password.trim()) {
        setStatusMessage("Please complete all fields before continuing.");
        return;
      }

      if (!isValidEmail(email)) {
        setStatusMessage("Please enter a valid email address.");
        return;
      }

      if (password !== confirmPw) {
        setStatusMessage("Passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        await requestSignupOtp({
          email: email.trim(),
          password,
          full_name: name.trim(),
          age: Number(age) || null,
        });
        setUserName(name);
        setUserAge(age);
        setUserEmail(email);
        // Always send the user to OTP entry after signup.
        setPendingSignupOtpEmail(email.trim());
        setAuthState("signup-otp");
      } catch (err) {
        setStatusMessage(err instanceof Error ? err.message : "Unable to send OTP right now.");
      }
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setStatusMessage(null);
    setLoading(true);
    const redirectTo =
      import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL ||
      new URL(import.meta.env.BASE_URL || "/", window.location.origin).toString();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "openid email profile",
        redirectTo,
      },
    });
    if (error) {
      setStatusMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopAccent />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo & Brand — click to return to landing page */}
        <div className="mb-6">
          <div className="text-center">
          <button
            type="button"
            onClick={() => { setAuthState("login"); navigate("/"); }}
            className="inline-block focus:outline-none"
            aria-label="Back to home"
          >
            <img
              src="/logo.png"
              alt="Cash Squared Flow"
              className="w-80 h-auto mx-auto mb-2 object-contain border-2 border-[#F04507] rounded-xl bg-white/40 hover:opacity-80 transition-opacity cursor-pointer"
            />
          </button>
          <p className="text-sm mt-0.5 text-[#F01707]">{tr.slogan}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 shadow-sm rounded-2xl">
          <div className="flex justify-end mb-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Language"
            >
              <option value="en">{tr.languageEnglish}</option>
              <option value="hi">{tr.languageHindi}</option>
              <option value="zh-CN">{tr.languageMandarin}</option>
              <option value="zh-HK">{tr.languageCantonese}</option>
            </select>
          </div>
          {!isSignup ? (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-3">
              <p className="text-base font-semibold text-center mb-1">{tr.login}</p>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type="email" placeholder={tr.email} value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type={showPw ? "text" : "password"} placeholder={tr.password} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition">
                {tr.login}
              </button>
            </form>
          ) : (
            /* SIGNUP FORM - Multi Step */
            <form onSubmit={handleSignupNext} className="space-y-3">
              <p className="text-base font-semibold text-center mb-1">{tr.signup} — Step {signupStep}/2</p>

              {signupStep === 1 && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder={tr.name} value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input type="number" placeholder={tr.age} value={age} onChange={(e) => setAge(e.target.value)} min="13" max="120"
                      className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
                  </div>
                </>
              )}

              {signupStep === 2 && (
                <>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input type="email" placeholder={tr.email} value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input type={showPw ? "text" : "password"} placeholder={tr.password} value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-muted-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input type="password" placeholder={tr.confirmPassword} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring" required />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                {signupStep > 1 && (
                  <button type="button" onClick={() => setSignupStep((prev) => prev - 1)}
                    className="flex-1 border border-input py-2.5 font-medium text-base hover:bg-accent transition">
                    {tr.back}
                  </button>
                )}
                <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition">
                  {signupStep === 2 ? tr.verify : tr.next}
                </button>
              </div>
            </form>
          )}

          {statusMessage && (
            <p className="text-xs text-center text-destructive mt-2">{statusMessage}</p>
          )}

          <div className="my-3 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full border border-input py-2.5 text-base font-medium flex items-center justify-center gap-2 hover:bg-accent transition mb-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {tr.googleLogin}
          </button>
        </div>

        <p className="text-center text-base text-muted-foreground mt-4">
          {isSignup ? (
            <>Already have an account?{" "}
              <button
                onClick={() => { setIsSignup(false); setSignupStep(1); setStatusMessage(null); setAuthState("login"); navigate("/login"); }}
                className="text-primary font-semibold"
              >{tr.login}</button>
            </>
          ) : (
            <>Don't have an account?{" "}
              <button
                onClick={() => { setIsSignup(true); setStatusMessage(null); setAuthState("signup"); navigate("/signup"); }}
                className="text-primary font-semibold"
              >{tr.signup}</button>
            </>
          )}
        </p>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
