import { ReactNode, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Truck, Receipt, BookOpen, BarChart3,
  Settings, PiggyBank, TrendingUp, Plus, Mic, Globe,
} from "lucide-react";
import AddTransactionModal from "@/components/modals/AddTransactionModal";
import AddExpenseModal from "@/components/modals/AddExpenseModal";

const businessNav = [
  { key: "dashboard", icon: LayoutDashboard, path: "/" },
  { key: "customers", icon: Users, path: "/customers" },
  { key: "suppliers", icon: Truck, path: "/suppliers" },
  { key: "expenses", icon: Receipt, path: "/expenses" },
  { key: "cashbook", icon: BookOpen, path: "/cashbook" },
  { key: "reports", icon: BarChart3, path: "/reports" },
  { key: "settings", icon: Settings, path: "/settings" },
] as const;

const personalNav = [
  { key: "dashboard", icon: LayoutDashboard, path: "/" },
  { key: "expenses", icon: Receipt, path: "/expenses" },
  { key: "budget", icon: PiggyBank, path: "/budget" },
  { key: "insights", icon: TrendingUp, path: "/insights" },
  { key: "settings", icon: Settings, path: "/settings" },
] as const;

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { mode, setMode, language, setLanguage, userName, accountTypes } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const tr = t[language];
  const navItems = mode === "business" ? businessNav : personalNav;
  const [showFabModal, setShowFabModal] = useState(false);

  const hasBoth = accountTypes.includes("business") && accountTypes.includes("personal");
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-card border-r border-border shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{userName}</p>
              <p className="text-xs text-money-in flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-money-in rounded-full" />
                {tr.online}
              </p>
            </div>
          </div>
        </div>

        {hasBoth && (
          <div className="p-3 border-b border-border">
            <div className="flex bg-muted p-0.5">
              <button onClick={() => { setMode("business"); navigate("/"); }} className={`flex-1 py-1.5 text-xs font-medium transition ${mode === "business" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{tr.business}</button>
              <button onClick={() => { setMode("personal"); navigate("/"); }} className={`flex-1 py-1.5 text-xs font-medium transition ${mode === "personal" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{tr.personal}</button>
            </div>
          </div>
        )}

        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => {
            const label = tr[item.key as keyof typeof tr] || item.key;
            const active = isActive(item.path);
            return (
              <button key={item.key} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-primary" : "text-sidebar-foreground hover:bg-accent"}`}>
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button onClick={() => setLanguage(language === "en" ? "zh-HK" : "en")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition w-full">
            <Globe className="h-3.5 w-3.5" />
            {language === "en" ? "繁體中文" : "English"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <h1 className="font-bold text-foreground">{tr.appName}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setLanguage(language === "en" ? "zh-HK" : "en")} className="text-xs text-muted-foreground border border-border px-2 py-1">{language === "en" ? "中文" : "EN"}</button>
            {hasBoth && (
              <div className="flex bg-muted p-0.5 text-xs">
                <button onClick={() => { setMode("business"); navigate("/"); }} className={`px-2 py-1 font-medium ${mode === "business" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Biz</button>
                <button onClick={() => { setMode("personal"); navigate("/"); }} className={`px-2 py-1 font-medium ${mode === "personal" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Me</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-4">{children}</main>

        {/* FAB */}
        <button onClick={() => setShowFabModal(true)} className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition z-50">
          <Plus className="h-5 w-5" />
        </button>

        <button className="fixed bottom-20 right-20 md:bottom-6 md:right-20 w-10 h-10 bg-card border border-border text-muted-foreground shadow flex items-center justify-center hover:text-foreground transition z-50">
          <Mic className="h-4 w-4" />
        </button>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-40">
          {navItems.slice(0, 5).map((item) => {
            const label = tr[item.key as keyof typeof tr] || item.key;
            const active = isActive(item.path);
            return (
              <button key={item.key} onClick={() => navigate(item.path)} className={`flex-1 flex flex-col items-center py-2 text-[10px] transition ${active ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="h-5 w-5 mb-0.5" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {mode === "business" ? (
        <AddTransactionModal open={showFabModal} onClose={() => setShowFabModal(false)} />
      ) : (
        <AddExpenseModal open={showFabModal} onClose={() => setShowFabModal(false)} type="personal" />
      )}
    </div>
  );
};

export default AppLayout;
