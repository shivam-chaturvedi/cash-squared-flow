import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { FileText } from "lucide-react";

const TermsPage = () => {
  const { language, setAuthState } = useApp();
  const tr = t[language];
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{tr.termsTitle}</h1>
        </div>

        <div className="bg-card border border-border p-4 max-h-60 overflow-auto text-sm text-muted-foreground space-y-3 mb-4">
          <p className="font-semibold text-foreground">Terms of Service</p>
          <p>By using Avail, you agree to these terms. Avail provides financial tracking tools for personal and business use. Your data is stored securely and will not be shared with third parties without your consent.</p>
          <p className="font-semibold text-foreground">Privacy Policy</p>
          <p>We collect only the information necessary to provide our services. This includes your name, email, and financial records you choose to enter. You can request deletion of your data at any time.</p>
          <p className="font-semibold text-foreground">Usage</p>
          <p>You agree not to use Avail for any illegal purposes. We reserve the right to suspend accounts that violate these terms.</p>
          <p className="text-xs text-muted-foreground italic">Full terms will be available soon. This is a placeholder.</p>
        </div>

        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
            className="w-5 h-5 accent-[hsl(220,70%,50%)]" />
          <span className="text-base">{tr.termsAccept}</span>
        </label>

        <button onClick={() => setAuthState("select-type")} disabled={!accepted}
          className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {tr.continueBtn}
        </button>
      </div>
    </div>
  );
};

export default TermsPage;
