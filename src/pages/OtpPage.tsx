import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { ShieldCheck } from "lucide-react";

const OtpPage = () => {
  const { language, setAuthState, userEmail } = useApp();
  const tr = t[language];
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState("signup-terms");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
                key={i}
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
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition">
            {tr.verify}
          </button>
        </form>

        <button className="mt-3 text-sm text-primary font-medium">Resend OTP</button>
      </div>
    </div>
  );
};

export default OtpPage;
