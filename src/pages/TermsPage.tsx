import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { FileText } from "lucide-react";
import TopAccent from "@/components/TopAccent";
import { supabase } from "@/lib/supabaseClient";

const TermsPage = () => {
  const { language, translateLang, setAuthState, saveProfile, profile, session } = useApp();
  const tr = t[language];
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.accepted_terms) {
      setAuthState("authenticated");
    }
  }, [profile?.accepted_terms, setAuthState]);

  const handleContinue = async () => {
    if (!accepted) return;
    setErrorMessage(null);
    setLoading(true);
    const userIdFromCtx = session?.user?.id ?? null;
    const userId =
      userIdFromCtx ||
      (await supabase.auth.getSession().then((r) => r.data.session?.user?.id ?? null).catch(() => null));

    const { data, error } = await saveProfile(
      {
        accepted_terms: true,
        preferred_language: translateLang || "en",
      },
      userId ?? undefined,
    );

    if (error) {
      setLoading(false);
      setErrorMessage(error.message ?? "Unable to save your acceptance right now.");
      return;
    }
    setLoading(false);
    const next =
      !data
        ? "authenticated"
        : !Array.isArray(data.account_types) || data.account_types.length === 0
          ? "select-type"
          : data.account_types.includes("business") && !data.business_name
            ? "business-setup"
            : "authenticated";
    setAuthState(next);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopAccent />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">{tr.termsTitle}</h1>
        </div>

        <div className="bg-card border border-border p-4 max-h-72 overflow-auto text-sm text-muted-foreground space-y-3 mb-4">
          <p className="font-semibold text-foreground">Terms and Policy</p>
          <p>By using this application, you agree to the following terms and policies. This document clarifies the scope of our services and limits liability to ensure compliance with applicable laws worldwide.</p>
          <p>The purpose of the app is solely to help you record and organize personal or business expenses. It is not financial advice, investment recommendations, or money-management guidance.</p>
          <p>The app does not guarantee the accuracy or reliability of the data entered by users, and it is not responsible for financial decisions based on that data.</p>
          <p>Users are responsible for the accuracy of the information they provide, compliance with local laws and regulations, and their own financial outcomes. The app cannot limit or stop potential losses or gains; it is simply a tracking tool.</p>
          <p>Data entered into the app remains under the control of the user. No data is shared without consent unless required by law.</p>
          <p>We reserve the right to update or modify these terms and policies at any time.</p>
        </div>

        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
            className="w-5 h-5 accent-[hsl(220,70%,50%)]" />
          <span className="text-base">{tr.termsAccept}</span>
        </label>

        <button onClick={handleContinue} disabled={!accepted || loading}
          className="w-full bg-primary text-primary-foreground py-2.5 font-semibold text-base hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Saving…" : tr.continueBtn}
        </button>
        {errorMessage && <p className="text-xs text-center text-destructive mt-2">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
