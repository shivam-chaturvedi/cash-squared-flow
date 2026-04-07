import { FormEvent, useEffect, useState } from "react";
import { useApp, AppMode } from "@/contexts/AppContext";
import { t, type TranslationKey } from "@/lib/translations";
import { Globe, Bell, Shield, LogOut, User, Briefcase, Check, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SettingsSection = "language" | "notifications" | "security";
type NotificationKey = "activity" | "insights" | "security";

const googleTranslateElementId = "google_translate_element";

const menuItems: { id: SettingsSection; label: string; description: string; icon: LucideIcon }[] = [
  { id: "language", label: "Language", description: "Translate the UI or load translations on demand with Google Translate.", icon: Globe },
  { id: "notifications", label: "Notifications", description: "Control which alerts reach your inbox and phone.", icon: Bell },
  { id: "security", label: "Security", description: "Review sessions, passwords, and account protection tools.", icon: Shield },
];

const notificationOptions: { id: NotificationKey; labelKey: TranslationKey; hintKey: TranslationKey }[] = [
  { id: "activity", labelKey: "notificationActivity", hintKey: "notificationActivityHint" },
  { id: "insights", labelKey: "notificationInsights", hintKey: "notificationInsightsHint" },
  { id: "security", labelKey: "notificationSecurity", hintKey: "notificationSecurityHint" },
];

const initialNotificationPrefs: Record<NotificationKey, boolean> = {
  activity: true,
  insights: true,
  security: true,
};

const SettingsPage = () => {
  const { language, setAuthState, userName, accountTypes, setAccountTypes, setMode } = useApp();
  const tr = t[language];
  const [activeSection, setActiveSection] = useState<SettingsSection>("language");
  const [notificationPrefs, setNotificationPrefs] = useState(() => ({ ...initialNotificationPrefs }));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

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

  const googleTranslateUrl =
    typeof window === "undefined"
      ? "https://translate.google.com"
      : `https://translate.google.com/translate?hl=en&sl=auto&tl=${language === "zh-HK" ? "zh-TW" : "en"}&u=${encodeURIComponent(
          window.location.href,
        )}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pageLang = language === "zh-HK" ? "zh-TW" : "en";

    const initGoogleTranslate = () => {
      const container = document.getElementById(googleTranslateElementId);
      if (!container || !window.google?.translate) return;
      container.innerHTML = "";
      new window.google.translate.TranslateElement({
        pageLanguage: pageLang,
        autoDisplay: false,
      }, googleTranslateElementId);
    };

    window.googleTranslateElementInit = initGoogleTranslate;

    const existingScript = document.getElementById("google-translate-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      initGoogleTranslate();
    }

    return () => {
      window.googleTranslateElementInit = undefined;
    };
  }, [language]);

  const toggleNotification = (pref: NotificationKey) => {
    setNotificationPrefs((prev) => ({ ...prev, [pref]: !prev[pref] }));
  };

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // placeholder for integrating with backend; currently just clears fields.
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatusMessage(tr.securityUpdatedMessage);
  };

  const activeInfo = menuItems.find((item) => item.id === activeSection);

  const handleTranslateRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const renderSectionDetail = () => {
    switch (activeSection) {
      case "notifications":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.notificationsSettingDesc}</p>
            <div className="space-y-3">
              {notificationOptions.map((option) => (
                <label key={option.id} className="flex items-center justify-between gap-4 border border-border rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{tr[option.labelKey]}</p>
                    <p className="text-xs text-muted-foreground">{tr[option.hintKey]}</p>
                  </div>
                  <input
                    type="checkbox"
                    aria-label={tr[option.labelKey]}
                    checked={notificationPrefs[option.id]}
                    onChange={() => toggleNotification(option.id)}
                    className="h-5 w-5 accent-primary"
                  />
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">These preferences only affect notification delivery; you can always log out from the right panel.</p>
          </div>
        );
      case "security":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.securitySettingDesc}</p>
            <form onSubmit={handlePasswordSubmit} className="space-y-3 rounded-xl border border-border/70 bg-muted/40 p-4">
              <div>
                <p className="text-sm font-semibold">{tr.securityUpdateTitle}</p>
                <p className="text-xs text-muted-foreground">{tr.securityUpdateHint}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr.securityCurrentPassword}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={tr.securityCurrentPassword}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr.securityNewPassword}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={tr.securityNewPassword}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr.securityConfirmPassword}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={tr.securityConfirmPassword}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                {tr.securityUpdateButton}
              </button>
              {statusMessage && (
                <p className="text-xs text-money-in">{statusMessage}</p>
              )}
            </form>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.languageSettingDesc}</p>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div id={googleTranslateElementId} className="mt-1 min-h-[60px]" />
            <p className="mt-3 text-xs text-muted-foreground">{tr.googleTranslateHelper}</p>
          </div>
          <button
            type="button"
            onClick={handleTranslateRefresh}
            className="mt-3 rounded-2xl border border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/80"
          >
            {tr.googleTranslateRefresh}
          </button>
        </div>
      );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <h2 className="text-lg font-semibold">{tr.settings}</h2>

      <div className="grid gap-5 lg:grid-cols-[minmax(260px,320px),minmax(0,1fr)]">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold">{userName}</p>
              <p className="text-xs text-muted-foreground">{tr.profile}</p>
            </div>
          </div>
          <div className="space-y-3">
            {menuItems.map((item) => {
              const active = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  aria-pressed={active}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted"}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className={`h-4 w-4 transition ${active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>{tr[`${item.id}Setting` as keyof typeof tr] || item.label}</p>
                    <p className="text-xs text-muted-foreground">{tr[`${item.id}SettingDesc` as keyof typeof tr] || item.description}</p>
                  </div>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setAuthState("login")}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-money-out transition hover:border-money-out hover:bg-money-out/10"
          >
            <LogOut className="h-4 w-4" />
            {tr.logout}
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              {activeInfo?.icon && <activeInfo.icon className="h-4 w-4 text-primary" />}
            </div>
            <div>
              <p className="text-lg font-semibold">{activeInfo ? (tr[`${activeInfo.id}Setting` as keyof typeof tr] || activeInfo.label) : "Details"}</p>
              <p className="text-xs text-muted-foreground">{activeInfo ? (tr[`${activeInfo.id}SettingDesc` as keyof typeof tr] || activeInfo.description) : ""}</p>
            </div>
          </div>
          <hr className="my-4 border-border" />
          {renderSectionDetail()}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{tr.manageAccountTypes}</h3>
        <p className="text-xs text-muted-foreground mb-3">{tr.manageAccountTypesDesc}</p>

        <div className="space-y-2">
          <button
            onClick={() => toggleAccountType("personal")}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition ${accountTypes.includes("personal") ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{tr.individual}</p>
              <p className="text-xs text-muted-foreground">{tr.individualDesc}</p>
            </div>
            {accountTypes.includes("personal") ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground">
                <Plus className="h-3.5 w-3.5" />
              </div>
            )}
          </button>

          <button
            onClick={() => toggleAccountType("business")}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition ${accountTypes.includes("business") ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{tr.business}</p>
              <p className="text-xs text-muted-foreground">{tr.businessDesc}</p>
            </div>
            {accountTypes.includes("business") ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground">
                <Plus className="h-3.5 w-3.5" />
              </div>
            )}
          </button>
        </div>

        {accountTypes.length <= 1 && (
          <p className="text-xs text-muted-foreground italic mt-2">You must have at least one account type active.</p>
        )}
      </section>
    </div>
  );
};

export default SettingsPage;

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}
