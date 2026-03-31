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
    setAuthState("authenticated");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="text-xl font-bold text-center mb-2">{tr.selectAccountType}</h1>
        <p className="text-muted-foreground text-sm text-center mb-2">{tr.selectMultipleHint}</p>
        <p className="text-muted-foreground text-xs text-center mb-8">{tr.canChangeLater}</p>

        <div className="grid gap-4">
          <button
            onClick={() => toggle("personal")}
            className={`bg-card border p-6 text-left hover:border-primary hover:shadow-md transition group relative ${selected.includes("personal") ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
          >
            {selected.includes("personal") && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{tr.individual}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tr.individualDesc}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => toggle("business")}
            className={`bg-card border p-6 text-left hover:border-primary hover:shadow-md transition group relative ${selected.includes("business") ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
          >
            {selected.includes("business") && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{tr.business}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tr.businessDesc}</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="w-full mt-6 bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tr.continueBtn} ({selected.length} {tr.selected})
        </button>
      </div>
    </div>
  );
};

export default AccountTypeSelect;
