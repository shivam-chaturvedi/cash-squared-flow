import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { User, Briefcase } from "lucide-react";

const AccountTypeSelect = () => {
  const { language, setMode, setAuthState } = useApp();
  const tr = t[language];

  const select = (mode: "personal" | "business") => {
    setMode(mode);
    setAuthState("authenticated");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="text-xl font-bold text-center mb-2">{tr.selectAccountType}</h1>
        <p className="text-muted-foreground text-sm text-center mb-8">Choose how you want to use {tr.appName}</p>

        <div className="grid gap-4">
          <button
            onClick={() => select("personal")}
            className="bg-card border border-border p-6 text-left hover:border-primary hover:shadow-md transition group"
          >
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
            onClick={() => select("business")}
            className="bg-card border border-border p-6 text-left hover:border-primary hover:shadow-md transition group"
          >
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
      </div>
    </div>
  );
};

export default AccountTypeSelect;
