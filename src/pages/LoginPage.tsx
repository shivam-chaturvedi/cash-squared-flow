import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const { language, setAuthState, setUserName } = useApp();
  const tr = t[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [confirmPw, setConfirmPw] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(email.split("@")[0] || "User");
    if (isSignup) {
      setAuthState("select-type");
    } else {
      setAuthState("authenticated");
    }
  };

  const handleGoogle = () => {
    setUserName("Google User");
    setAuthState("select-type");
  };

  const handleGuest = () => {
    setUserName("Guest");
    setAuthState("authenticated");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">₹</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{tr.appName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSignup ? tr.signup : tr.login}
          </p>
        </div>

        <div className="bg-card border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder={tr.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                placeholder={tr.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {isSignup && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder={tr.confirmPassword}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            )}

            <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 font-medium text-sm hover:opacity-90 transition">
              {isSignup ? tr.signup : tr.login}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={handleGoogle} className="w-full border border-input py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent transition mb-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {tr.googleLogin}
          </button>

          <button onClick={handleGuest} className="w-full text-sm text-muted-foreground hover:text-foreground transition py-2">
            {tr.guestMode}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {isSignup ? (
            <>Already have an account? <button onClick={() => setIsSignup(false)} className="text-primary font-medium">{tr.login}</button></>
          ) : (
            <>Don't have an account? <button onClick={() => setIsSignup(true)} className="text-primary font-medium">{tr.signup}</button></>
          )}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
