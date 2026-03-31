import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { User, Globe, Bell, Shield, LogOut } from "lucide-react";

const SettingsPage = () => {
  const { language, setLanguage, setAuthState, userName } = useApp();
  const tr = t[language];

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in max-w-lg">
      <h2 className="text-lg font-bold">{tr.settings}</h2>

      <div className="bg-card border border-border divide-y divide-border">
        {/* Profile */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-12 h-12 bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">{tr.profile}</p>
          </div>
        </div>

        {/* Language */}
        <button
          onClick={() => setLanguage(language === "en" ? "zh-HK" : "en")}
          className="w-full flex items-center gap-3 p-4 hover:bg-accent transition"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm text-left">Language</span>
          <span className="text-sm text-muted-foreground">{language === "en" ? "English" : "繁體中文"}</span>
        </button>

        {/* Notifications */}
        <button className="w-full flex items-center gap-3 p-4 hover:bg-accent transition">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm text-left">Notifications</span>
        </button>

        {/* Security */}
        <button className="w-full flex items-center gap-3 p-4 hover:bg-accent transition">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm text-left">Security</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => setAuthState("login")}
          className="w-full flex items-center gap-3 p-4 hover:bg-accent transition text-money-out"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
