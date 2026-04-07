import { useState } from "react";
import { useApp, AppMode } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { User, Briefcase, Check } from "lucide-react";

const AccountTypeSelect = () => {
  const { language, setMode, setAccountTypes, setAuthState } = useApp();
  const tr = t[language];
  const [selected, setSelected] = useState<AppMode[]>([]);

  const toggle = (type: AppMode) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    setAccountTypes(selected);
    setMode(selected[0]);
    // If business is selected, go to business setup
    if (selected.includes("business")) {
      setAuthState("business-setup");
    } else {
      setAuthState("tutorial");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="text-xl font-bold text-center mb-2">{tr.selectAccountType}</h1>
        <p className="text-muted-foreground text-sm text-center mb-1">{tr.selectMultipleHint}</p>
        <p className="text-muted-foreground text-xs text-center mb-6">{tr.canChangeLater}</p>

        <div className="grid gap-3">
          <button
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
                <h3 className="font-semibold text-foreground text-base">{tr.individual}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{tr.individualDesc}</p>
              </div>
            </div>
          </button>

          <button
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
        </div>

        <button
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="w-full mt-4 bg-primary text-primary-foreground py-2.5 text-base font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tr.continueBtn} ({selected.length} {tr.selected})
        </button>
      </div>
    </div>
  );
};

export default AccountTypeSelect;
