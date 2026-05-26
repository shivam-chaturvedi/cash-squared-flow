import { FormEvent, useEffect, useState } from "react";
import { useApp, AppMode } from "@/contexts/AppContext";
import { t } from "@/lib/translations";
import { Globe, Bell, Shield, LogOut, User, Briefcase, Check, Plus, MessageSquareText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { subscribeNotifications } from "@/lib/notifications";
import { db, type AppNotificationRow } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import TranslateLanguageSelect from "@/components/TranslateLanguageSelect";

type SettingsSection = "account" | "language" | "notifications" | "security" | "feedback";

const menuItems: { id: SettingsSection; label: string; description: string; icon: LucideIcon }[] = [
  { id: "account", label: "Account", description: "View and maintain your profile, email, and preferences.", icon: User },
  { id: "language", label: "Language", description: "Translate the UI or load translations on demand with Google Translate.", icon: Globe },
  { id: "notifications", label: "Notifications", description: "Control which alerts reach your inbox and phone.", icon: Bell },
  { id: "security", label: "Security", description: "Review sessions, passwords, and account protection tools.", icon: Shield },
  { id: "feedback", label: "Feedback", description: "Share feedback or open the feedback form.", icon: MessageSquareText },
];

const BUSINESS_ROLES = ["Owner", "Manager", "Accountant", "Staff"] as const;

const SettingsPage = () => {
  const {
    language,
    setAuthState,
    userName,
    accountTypes,
    setAccountTypes,
    setMode,
    userEmail,
    userAge,
    profile,
    saveProfile,
    session,
    isEmployee,
  } = useApp();
  const tr = t[language];
  const [activeSection, setActiveSection] = useState<SettingsSection>("language");
  const [recent, setRecent] = useState<AppNotificationRow[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);

  const authProviders = (() => {
    const set = new Set<string>();
    const user = session?.user as unknown as {
      app_metadata?: { provider?: string; providers?: string[] };
      identities?: Array<{ provider?: string | null }>;
    } | null;
    const primaryProvider = user?.app_metadata?.provider;
    if (typeof primaryProvider === "string" && primaryProvider) set.add(primaryProvider);
    const providers = user?.app_metadata?.providers;
    if (Array.isArray(providers)) {
      for (const p of providers) {
        if (typeof p === "string" && p) set.add(p);
      }
    }
    const identities = user?.identities;
    if (Array.isArray(identities)) {
      for (const ident of identities) {
        if (typeof ident?.provider === "string" && ident.provider) set.add(ident.provider);
      }
    }
    return set;
  })();

  const canUpdatePassword = authProviders.size === 0 || authProviders.has("email");
  const showSecurityDescriptions = canUpdatePassword;

  const toggleAccountType = async (type: AppMode) => {
    setAccountError("");
    const hasType = accountTypes.includes(type);
    if (hasType && accountTypes.length <= 1) {
      setAccountError("At least one account type must remain active.");
      return;
    }

    const nextTypes = hasType
      ? accountTypes.filter((t) => t !== type)
      : [...accountTypes, type];
    setAccountTypes(nextTypes);
    if (nextTypes.length > 0) {
      setMode(nextTypes[0]);
    }

    setAccountSaving(true);
    const { error } = await saveProfile({
      account_types: nextTypes,
      is_business: nextTypes.includes("business"),
    });
    setAccountSaving(false);
    if (error) {
      setAccountError(error.message ?? "Unable to update account types right now.");
      setAccountTypes(accountTypes);
    }
  };

  const userId = session?.user?.id ?? null;
  const profileNotif = (profile?.notification_prefs ?? {}) as Record<string, unknown>;
  const myRole = profile?.business_role ?? "Owner";

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const notifRes = await db.notifications.list(userId);
      if (notifRes.data) setRecent(notifRes.data);
    };
    void load();
    return subscribeNotifications(() => {
      void load();
    });
  }, [userId]);

  const updateMyRole = async (nextRole: string) => {
    if (!userId) return;
    await saveProfile({ business_role: nextRole, roles: [nextRole] });
  };

  const handleLogout = () => {
    if (!window.confirm(tr.confirmLogout)) return;
    setAuthState("login");
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

  const renderSectionDetail = () => {
    switch (activeSection) {
      case "account": {
        const displayAge = userAge || (profile?.age ? String(profile.age) : "");
        const infoItems = [
          { label: tr.name, value: userName || tr.noData },
          { label: tr.email, value: userEmail || tr.noData },
          { label: tr.age, value: displayAge || tr.noData },
          { label: tr.accountTypes, value: accountTypes.length > 0 ? accountTypes.join(", ") : tr.noData },
          { label: tr.businessName, value: profile?.business_name || tr.noData },
          { label: tr.ownerName, value: profile?.owner_name || tr.noData },
        ];

        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.accountSettingDesc}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {infoItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                  <p className="text-base font-semibold text-foreground mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Business role selection removed */}
          </div>
        );
      }
      case "notifications":
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">{tr.recentAlerts}</p>
              <p className="text-xs text-muted-foreground">{tr.recentAlertsHint}</p>
              <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-background">
                {recent.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">{tr.noAlertsYet}</div>
                ) : (
                  recent.slice(0, 10).map((n) => (
                    <div key={n.id} className="p-3">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.description && <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-4">
            {canUpdatePassword ? (
              <>
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
              </>
            ) : (
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">{tr.securityUpdateTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tr.securityPasswordManagedByProvider}
                </p>
              </div>
            )}
          </div>
        );
      case "feedback": {
        const feedbackUrl = (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined) || "";
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the bottom-right star widget anytime, or open the feedback form link below.
            </p>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">Feedback form</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Set <code className="font-mono">VITE_FEEDBACK_FORM_URL</code> to control where this button points.
              </p>
              <div className="mt-3">
                {feedbackUrl ? (
                  <a
                    href={feedbackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent transition"
                  >
                    Open feedback form
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No feedback form link configured yet.</p>
                )}
              </div>
            </div>
          </div>
        );
      }
      case "language":
      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{tr.languageSettingDesc}</p>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">{tr.googleTranslateLabel}</p>
              <p className="mt-2 text-xs text-muted-foreground">{tr.googleTranslateHelper}</p>
              <div className="mt-3">
                <TranslateLanguageSelect fullWidth />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <PageHeader title={tr.settings} />

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
                    {item.id === "notifications"
                      ? null
                      : item.id === "security"
                        ? (showSecurityDescriptions && (
                          <p className="text-xs text-muted-foreground">{tr[`${item.id}SettingDesc` as keyof typeof tr] || item.description}</p>
                        ))
                        : (
                          <p className="text-xs text-muted-foreground">{tr[`${item.id}SettingDesc` as keyof typeof tr] || item.description}</p>
                        )}
                  </div>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleLogout}
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
              {activeInfo?.id !== "notifications" && activeInfo?.id !== "security" && (
                <p className="text-xs text-muted-foreground">{activeInfo ? (tr[`${activeInfo.id}SettingDesc` as keyof typeof tr] || activeInfo.description) : ""}</p>
              )}
              {activeInfo?.id === "security" && showSecurityDescriptions && (
                <p className="text-xs text-muted-foreground">{activeInfo ? (tr[`${activeInfo.id}SettingDesc` as keyof typeof tr] || activeInfo.description) : ""}</p>
              )}
            </div>
          </div>
          <hr className="my-4 border-border" />
          {renderSectionDetail()}
        </section>
      </div>

      {!isEmployee && !profile?.employee_of_user_id && (
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">{tr.manageAccountTypes}</h3>
        <p className="text-xs text-muted-foreground mb-3">{tr.manageAccountTypesDesc}</p>

        <div className="space-y-2">
          <button
            onClick={() => toggleAccountType("personal")}
            disabled={accountSaving}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition ${accountTypes.includes("personal") ? "border-primary bg-primary/5" : "border-border hover:border-primary"} ${accountSaving ? "cursor-wait" : ""}`}
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
            disabled={accountSaving}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 transition ${accountTypes.includes("business") ? "border-primary bg-primary/5" : "border-border hover:border-primary"} ${accountSaving ? "cursor-wait" : ""}`}
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
        {accountError && (
          <p className="text-xs text-destructive mt-2">{accountError}</p>
        )}
        {accountSaving && (
          <p className="text-xs text-muted-foreground mt-1">Saving account type preferences…</p>
        )}
      </section>
      )}
    </div>
  );
};

export default SettingsPage;
