import { useApp, AppMode } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Globe, Bell, Shield, LogOut, User, Briefcase, Check, Plus } from "lucide-react";

const SettingsPage = () => {
  const { language, setLanguage, setAuthState, userName, accountTypes, setAccountTypes, setMode } = useApp();
  const tr = t[language];

  const toggleAccountType = (type: AppMode) => {
    if (accountTypes.includes(type)) {
      if (accountTypes.length <= 1) return;
      const newTypes = accountTypes.filter((t) => t !== type);
      setAccountTypes(newTypes);
      setMode(newTypes[0]);
    } else {
      setAccountTypes([...accountTypes, type]);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-3 animate-fade-in max-w-lg">
      <h2 className="text-lg font-bold">{tr.settings}</h2>

      <div className="bg-card border border-border divide-y divide-border">
        <div className="flex items-center gap-3 p-3">
          <div className="w-11 h-11 bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-base">{userName}</p>
            <p className="text-xs text-muted-foreground">{tr.profile}</p>
          </div>
        </div>

        <button onClick={() => setLanguage(language === "en" ? "zh-HK" : "en")} className="w-full flex items-center gap-3 p-3 hover:bg-accent transition">
          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <span className="flex-1 text-base text-left">Language</span>
          <span className="text-sm font-medium bg-primary text-primary-foreground px-2 py-0.5">{language === "en" ? "English" : "繁體中文"}</span>
        </button>

        <button className="w-full flex items-center gap-3 p-3 hover:bg-accent transition">
          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <span className="flex-1 text-base text-left">Notifications</span>
        </button>

        <button className="w-full flex items-center gap-3 p-3 hover:bg-accent transition">
          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="flex-1 text-base text-left">Security</span>
        </button>

        <button onClick={() => setAuthState("login")} className="w-full flex items-center gap-3 p-3 hover:bg-accent transition text-money-out">
          <LogOut className="h-4 w-4" />
          <span className="text-base">Log Out</span>
        </button>
      </div>

      {/* Account Types Management */}
      <div className="bg-card border border-border p-3 space-y-2">
        <h3 className="text-sm font-semibold">{tr.manageAccountTypes}</h3>
        <p className="text-xs text-muted-foreground">{tr.manageAccountTypesDesc}</p>

        <div className="space-y-2">
          <button onClick={() => toggleAccountType("personal")}
            className={`w-full flex items-center gap-3 p-3 border transition ${accountTypes.includes("personal") ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{tr.individual}</p>
              <p className="text-xs text-muted-foreground">{tr.individualDesc}</p>
            </div>
            {accountTypes.includes("personal") ? (
              <div className="w-6 h-6 bg-primary flex items-center justify-center"><Check className="h-3.5 w-3.5 text-primary-foreground" /></div>
            ) : (
              <div className="w-6 h-6 border border-border flex items-center justify-center"><Plus className="h-3.5 w-3.5 text-muted-foreground" /></div>
            )}
          </button>

          <button onClick={() => toggleAccountType("business")}
            className={`w-full flex items-center gap-3 p-3 border transition ${accountTypes.includes("business") ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{tr.business}</p>
              <p className="text-xs text-muted-foreground">{tr.businessDesc}</p>
            </div>
            {accountTypes.includes("business") ? (
              <div className="w-6 h-6 bg-primary flex items-center justify-center"><Check className="h-3.5 w-3.5 text-primary-foreground" /></div>
            ) : (
              <div className="w-6 h-6 border border-border flex items-center justify-center"><Plus className="h-3.5 w-3.5 text-muted-foreground" /></div>
            )}
          </button>
        </div>

        {accountTypes.length <= 1 && (
          <p className="text-xs text-muted-foreground italic">You must have at least one account type active</p>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
