import { useEffect, useState } from "react";
import { useApp, AppMode } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { User, Briefcase, Check } from "lucide-react";
import TopAccent from "@/components/TopAccent";

const AccountTypeSelect = () => {
  const { language, isEmployee, profile, setMode, setAccountTypes, setAuthState, saveProfile, beginOnboardingTutorial } = useApp();
  const tr = t[language];
  const [selected, setSelected] = useState<AppMode[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEmployee && !profile?.employee_of_user_id) return;
    setAccountTypes(["business"]);
    setMode("business");
    void saveProfile({
      account_types: ["business"],
      is_business: true,
    });
    setAuthState("authenticated");
  }, [isEmployee, profile?.employee_of_user_id, saveProfile, setAccountTypes, setAuthState, setMode]);

  const toggle = (type: AppMode) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const finishOnboarding = async (types: AppMode[], mode: AppMode) => {
    setSaving(true);
    setAccountTypes(types);
    setMode(mode);
    await saveProfile({
      account_types: types,
      is_business: types.includes("business"),
    });
    setSaving(false);
    if (types.includes("business") && !profile?.business_name) {
      setAuthState("business-setup");
    } else {
      beginOnboardingTutorial(types, profile?.notification_prefs);
      setAuthState("tutorial");
    }
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    void finishOnboarding(selected, selected[0]);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <TopAccent />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
        <h1 className="text-xl font-bold text-center mb-2">{tr.selectAccountType}</h1>
        <p className="text-muted-foreground text-sm text-center mb-1">{tr.selectMultipleHint}</p>
        <p className="text-muted-foreground text-xs text-center mb-6">{tr.canChangeLater}</p>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => toggle("business")}
            className={`bg-card border p-5 text-left hover:border-primary hover:shadow-md transition group relative ${selected.includes("business") ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
          >
            {selected.includes("business") && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">{tr.business}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{tr.businessDesc}</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggle("personal")}
            className={`bg-card border p-5 text-left hover:border-primary hover:shadow-md transition group relative ${selected.includes("personal") ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
          >
            {selected.includes("personal") && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">{tr.personal}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{tr.individualDesc}</p>
              </div>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={selected.length === 0 || saving}
          className="w-full mt-4 bg-primary text-primary-foreground py-2.5 text-base font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : `${tr.continueBtn} (${selected.length} ${tr.selected})`}
        </button>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelect;
